import { getAll, upsert } from '../lib/db';
import { LogIntegracao, Pedido } from '../types';
import { erpService, nfeService } from './index';

export type JobTipo = 'erp.enviarPedido' | 'nfe.emitir';
export type JobStatus = 'pendente' | 'processando' | 'sucesso' | 'falha' | 'rejeitado';

export interface JobFila {
  id: string; // Formato: ${pedidoId}:${tipo}
  pedidoId: string;
  tipo: JobTipo;
  status: JobStatus;
  tentativas: number;
  maxTentativas: number;
  proximaTentativaEm?: string;
  ultimoErro?: string;
  criadoEm: string;
  atualizadoEm: string;
}

const FILA_STORAGE_KEY = 'pentagol_fila_jobs';

// Delays de backoff em milissegundos: 1ª falha -> 5s, 2ª falha -> 30s, 3ª falha -> 2min (120s)
const BACKOFF_DELAYS = [0, 5000, 30000, 120000];

function lerFila(): JobFila[] {
  try {
    const raw = localStorage.getItem(FILA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Erro ao ler fila do localStorage:', err);
    return [];
  }
}

function salvarFila(fila: JobFila[]) {
  try {
    localStorage.setItem(FILA_STORAGE_KEY, JSON.stringify(fila));
  } catch (err) {
    console.error('Erro ao salvar fila no localStorage:', err);
  }
}

function registrarLog(
  servico: 'erp' | 'nfe',
  pedidoId: string,
  requisicao: string,
  resposta: string,
  sucesso: boolean,
  mensagem: string
) {
  const log: LogIntegracao = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    em: new Date().toISOString(),
    servico,
    pedidoId,
    requisicao,
    resposta,
    sucesso,
    mensagem,
  };
  upsert('logs_integracao', log);
}

function registrarAlertaAdmin(pedido: Pedido, motivo: string) {
  const alerta = {
    id: `alerta-${pedido.id}`,
    pedidoId: pedido.id,
    pedidoNumero: pedido.numero,
    clienteNome: pedido.snapshotCliente.nomeCompleto,
    motivo,
    criadoEm: new Date().toISOString(),
    lido: false,
  };
  upsert('alertas_admin', alerta);
}

/**
 * Adiciona um job na fila com idempotência por chave (pedidoId + tipo).
 * Se o job já existia e estava em 'sucesso', ignora para nunca reprocessar.
 */
export function enfileirarJob(pedidoId: string, tipo: JobTipo): JobFila {
  const fila = lerFila();
  const jobId = `${pedidoId}:${tipo}`;
  const existente = fila.find((j) => j.id === jobId);

  if (existente) {
    if (existente.status === 'sucesso') {
      console.log(`[Fila] Job ${jobId} já concluído com sucesso. Idempotência preservada.`);
      return existente;
    }
    // Se estava em falha ou rejeitado e reenfileirou manualmente: reseta para pendente
    existente.status = 'pendente';
    existente.tentativas = 0;
    existente.proximaTentativaEm = new Date().toISOString();
    existente.atualizadoEm = new Date().toISOString();
    salvarFila(fila);
    return existente;
  }

  const novoJob: JobFila = {
    id: jobId,
    pedidoId,
    tipo,
    status: 'pendente',
    tentativas: 0,
    maxTentativas: 3,
    proximaTentativaEm: new Date().toISOString(),
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };

  fila.push(novoJob);
  salvarFila(fila);
  console.log(`[Fila] Job ${jobId} adicionado com sucesso.`);
  return novoJob;
}

let emProcessamento = false;

/**
 * Processador assíncrono sequencial da fila.
 */
export async function processarFila(): Promise<void> {
  if (emProcessamento) return;
  emProcessamento = true;

  try {
    const fila = lerFila();
    const agoraMs = Date.now();

    // Filtra o próximo job elegível
    const job = fila.find((j) => {
      if (j.status !== 'pendente') return false;
      if (!j.proximaTentativaEm) return true;
      return new Date(j.proximaTentativaEm).getTime() <= agoraMs;
    });

    if (!job) {
      emProcessamento = false;
      return;
    }

    // Marca como processando
    job.status = 'processando';
    job.tentativas += 1;
    job.atualizadoEm = new Date().toISOString();
    salvarFila(fila);

    // Carrega o pedido correspondente
    const pedidos = getAll<Pedido>('pedidos');
    const pedido = pedidos.find((p) => p.id === job.pedidoId || p.numero === job.pedidoId);

    if (!pedido) {
      job.status = 'falha';
      job.ultimoErro = 'Pedido não localizado no banco de dados';
      salvarFila(fila);
      emProcessamento = false;
      return;
    }

    // REGRA DE SEGURANÇA: NF-e e ERP NUNCA são processados para pedidos não pagos
    if (pedido.status !== 'pago') {
      console.warn(`[Fila] Pedido ${pedido.numero} tem status ${pedido.status}. Job ${job.tipo} cancelado.`);
      job.status = 'rejeitado';
      job.ultimoErro = `Pedido não está pago (status: ${pedido.status})`;
      salvarFila(fila);
      emProcessamento = false;
      return;
    }

    // Execução por tipo de Job
    if (job.tipo === 'erp.enviarPedido') {
      try {
        const res = await erpService.enviarPedido(pedido);

        // Atualiza Pedido no DB
        const pAtualizado: Pedido = {
          ...pedido,
          erp: {
            status: 'enviado',
            idExterno: res.idExterno,
          },
          timeline: [
            ...pedido.timeline,
            {
              em: new Date().toISOString(),
              evento: 'Enviado ao SupraSoft (ERP)',
              detalhe: `ID Externo ERP: ${res.idExterno}`,
            },
          ],
        };
        upsert('pedidos', pAtualizado);

        // Sucesso do Job
        job.status = 'sucesso';
        job.ultimoErro = undefined;

        registrarLog(
          'erp',
          pedido.id,
          JSON.stringify({ numero: pedido.numero, cliente: pedido.snapshotCliente.nomeCompleto }),
          JSON.stringify(res),
          true,
          `Enviado ao SupraSoft com sucesso (ID: ${res.idExterno})`
        );
      } catch (err: any) {
        const mensagemErro = err.message || 'Erro de integração com ERP SupraSoft';
        job.ultimoErro = mensagemErro;

        registrarLog(
          'erp',
          pedido.id,
          JSON.stringify({ numero: pedido.numero }),
          JSON.stringify({ erro: mensagemErro }),
          false,
          `Falha no envio ao ERP SupraSoft (Tentativa ${job.tentativas}): ${mensagemErro}`
        );

        if (job.tentativas <= job.maxTentativas) {
          job.status = 'pendente';
          const delay = BACKOFF_DELAYS[job.tentativas] || 120000;
          job.proximaTentativaEm = new Date(Date.now() + delay).toISOString();
        } else {
          job.status = 'falha';
          const pErro: Pedido = {
            ...pedido,
            erp: {
              status: 'erro',
              erro: mensagemErro,
            },
            timeline: [
              ...pedido.timeline,
              {
                em: new Date().toISOString(),
                evento: 'Falha Final Envio ERP',
                detalhe: `Excedido limite de ${job.maxTentativas} tentativas: ${mensagemErro}`,
              },
            ],
          };
          upsert('pedidos', pErro);
        }
      }
    } else if (job.tipo === 'nfe.emitir') {
      try {
        const res = await nfeService.emitir(pedido);

        // Atualiza Pedido no DB
        const pAtualizado: Pedido = {
          ...pedido,
          nf: {
            status: 'emitida',
            numero: res.numero,
            chave: res.chave,
            xmlUrl: res.xmlUrl,
            danfeUrl: res.danfeUrl,
            tentativas: job.tentativas,
          },
          timeline: [
            ...pedido.timeline,
            {
              em: new Date().toISOString(),
              evento: 'NF-e Emitida',
              detalhe: `NF-e nº ${res.numero} autorizada pela SEFAZ (Chave: ${res.chave})`,
            },
          ],
        };
        upsert('pedidos', pAtualizado);

        // Sucesso do Job
        job.status = 'sucesso';
        job.ultimoErro = undefined;

        registrarLog(
          'nfe',
          pedido.id,
          JSON.stringify({ numero: pedido.numero, cpf: pedido.snapshotCliente.cpf }),
          JSON.stringify(res),
          true,
          `NF-e nº ${res.numero} emitida com sucesso. E-mail com DANFE e XML enviado para ${pedido.snapshotCliente.email}`
        );
      } catch (err: any) {
        const codigo = err.codigo || 'SEFAZ-ERRO';
        const motivo = err.motivo || err.message || 'Erro na emissão da NF-e';
        job.ultimoErro = `[${codigo}] ${motivo}`;

        registrarLog(
          'nfe',
          pedido.id,
          JSON.stringify({ numero: pedido.numero }),
          JSON.stringify({ codigo, motivo }),
          false,
          `Falha na emissão da NF-e (Tentativa ${job.tentativas}): ${motivo}`
        );

        if (job.tentativas <= job.maxTentativas) {
          job.status = 'pendente';
          const delay = BACKOFF_DELAYS[job.tentativas] || 120000;
          job.proximaTentativaEm = new Date(Date.now() + delay).toISOString();
        } else {
          job.status = 'rejeitado';
          const pRejeitado: Pedido = {
            ...pedido,
            nf: {
              status: 'rejeitada',
              motivoRejeicao: `[${codigo}] ${motivo}`,
              tentativas: job.tentativas,
            },
            timeline: [
              ...pedido.timeline,
              {
                em: new Date().toISOString(),
                evento: 'NF-e Rejeitada pela SEFAZ',
                detalhe: `[${codigo}] ${motivo}`,
              },
            ],
          };
          upsert('pedidos', pRejeitado);

          // Dispara alerta fiscal para o Painel Admin
          registrarAlertaAdmin(pRejeitado, `Rejeição SEFAZ [${codigo}]: ${motivo}`);
        }
      }
    }

    job.atualizadoEm = new Date().toISOString();
    salvarFila(fila);
  } catch (err) {
    console.error('[Fila] Erro crítico no processador de fila:', err);
  } finally {
    emProcessamento = false;
  }
}

let timerFila: any = null;

/**
 * Inicia o loop em background para rodar a fila a cada 3 segundos.
 */
export function iniciarFilaBackground() {
  if (timerFila) return;
  timerFila = setInterval(() => {
    processarFila();
  }, 3000);
  // Primeira execução imediata
  processarFila();
  console.log('🚀 [Fila] Processador de fila assíncrono em background iniciado.');
}

/**
 * Retorna todos os jobs da fila para exibição em telas dev/admin.
 */
export function obterJobsFila(): JobFila[] {
  return lerFila();
}

export const listarFila = obterJobsFila;

/**
 * Limpa a fila (útil para resets em testes).
 */
export function limparFilaJobs() {
  localStorage.removeItem(FILA_STORAGE_KEY);
}
