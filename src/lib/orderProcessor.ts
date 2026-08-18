import { getAll, upsert } from './db';
import { enfileirarJob, processarFila } from '../services/fila';
import { Cupom, Pedido, Variacao } from '../types';

/**
 * Lida com os efeitos colaterais quando um pagamento PIX é confirmado:
 * 1. Atualiza status do pedido para 'pago' e grava horário de pagamento.
 * 2. Baixa estoque por variação de produto.
 * 3. Incrementa contador de usos do cupom (se utilizado).
 * 4. Enfileira os jobs assíncronos 'erp.enviarPedido' e 'nfe.emitir' na fila persistida.
 * 5. Dispara o processamento imediato da fila em background sem travar a UI.
 */
export async function processarConfirmacaoPagamento(pedidoId: string): Promise<Pedido | null> {
  const pedidos = getAll<Pedido>('pedidos');
  const pedido = pedidos.find((p) => p.id === pedidoId || p.numero === pedidoId);

  if (!pedido) {
    console.error(`Order processor: Pedido ${pedidoId} não encontrado.`);
    return null;
  }

  // Checagem de idempotência: se já estava pago, apenas retorna
  if (pedido.status === 'pago') {
    return pedido;
  }

  const agora = new Date().toISOString();

  // 1. Atualiza status para 'pago'
  const pAtualizado: Pedido = {
    ...pedido,
    status: 'pago',
    pix: {
      ...pedido.pix,
      pagoEm: agora,
    },
    timeline: [
      ...pedido.timeline,
      {
        em: agora,
        evento: 'Pagamento PIX Confirmado',
        detalhe: 'Liquidação bancária confirmada via Webhook / Polling realtime',
      },
    ],
  };

  // 2. Baixa de estoque por variação
  const variacoes = getAll<Variacao>('variacoes');
  let estoqueAtualizadoCount = 0;

  for (const item of pAtualizado.itens) {
    const v = variacoes.find((varItem) => varItem.id === item.variacaoId || varItem.sku === item.sku);
    if (v) {
      const novoEstoque = Math.max(0, v.estoque - item.quantidade);
      upsert('variacoes', { ...v, estoque: novoEstoque });
      estoqueAtualizadoCount++;
    }
  }

  pAtualizado.timeline.push({
    em: new Date().toISOString(),
    evento: 'Baixa de Estoque Realizada',
    detalhe: `Estoque deduzido para ${estoqueAtualizadoCount} variação(ões) no banco de dados`,
  });

  // 3. Incremento de uso do cupom
  if (pAtualizado.cupomCodigo) {
    const cupons = getAll<Cupom>('cupons');
    const cupom = cupons.find((c) => c.codigo.toUpperCase() === pAtualizado.cupomCodigo?.toUpperCase());
    if (cupom) {
      upsert('cupons', { ...cupom, usos: (cupom.usos || 0) + 1 });
      pAtualizado.timeline.push({
        em: new Date().toISOString(),
        evento: 'Uso de Cupom Registrado',
        detalhe: `Cupom ${cupom.codigo} utilizado (${cupom.usos + 1}º uso acumulado)`,
      });
    }
  }

  // Grava pedido pago no DB
  upsert('pedidos', pAtualizado);

  // 4. Enfileiramento de jobs assíncronos com idempotência
  enfileirarJob(pAtualizado.id, 'erp.enviarPedido');
  enfileirarJob(pAtualizado.id, 'nfe.emitir');

  // Dispara o processamento imediato em background
  setTimeout(() => {
    processarFila();
  }, 100);

  return pAtualizado;
}

/**
 * Processa expiração do PIX após o limite de tempo
 */
export function processarExpiracaoPix(pedidoId: string): Pedido | null {
  const pedidos = getAll<Pedido>('pedidos');
  const pedido = pedidos.find((p) => p.id === pedidoId || p.numero === pedidoId);

  if (!pedido) return null;

  if (pedido.status === 'aguardando_pix') {
    const agora = new Date().toISOString();
    const pExpirado: Pedido = {
      ...pedido,
      status: 'pix_expirado',
      timeline: [
        ...pedido.timeline,
        {
          em: agora,
          evento: 'PIX Expirado',
          detalhe: 'Chave de pagamento expirada após o limite de tempo (30 minutos)',
        },
      ],
    };
    upsert('pedidos', pExpirado);
    return pExpirado;
  }

  return pedido;
}
