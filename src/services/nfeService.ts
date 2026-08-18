import { Pedido, PedidoNfe } from '../types';
import { INfeService } from './types';

export type NfeSimulacaoModo =
  | 'sucesso'
  | 'rejeicao_cpf'
  | 'rejeicao_cfop'
  | 'timeout_emissor';

let modoSimulacaoNfe: NfeSimulacaoModo = 'sucesso';

export function setModoSimulacaoNfe(modo: NfeSimulacaoModo) {
  modoSimulacaoNfe = modo;
}

export function getModoSimulacaoNfe(): NfeSimulacaoModo {
  return modoSimulacaoNfe;
}

export class SefazRejeicaoError extends Error {
  codigo: string;
  motivo: string;

  constructor(codigo: string, motivo: string) {
    super(`Rejeição SEFAZ [${codigo}]: ${motivo}`);
    this.name = 'SefazRejeicaoError';
    this.codigo = codigo;
    this.motivo = motivo;
  }
}

export class MockNfeService implements INfeService {
  async emitir(pedido: Pedido): Promise<PedidoNfe> {
    // Simula atraso na comunicação com o emissor / SEFAZ MG
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (modoSimulacaoNfe === 'rejeicao_cpf') {
      throw new SefazRejeicaoError(
        'SEFAZ-204',
        'Rejeição: Duplicidade de NF-e com diferença na Chave de Acesso ou CPF do destinatário inválido na base do Governo Federal.'
      );
    }

    if (modoSimulacaoNfe === 'rejeicao_cfop') {
      throw new SefazRejeicaoError(
        'SEFAZ-528',
        'Rejeição: Valor do ICMS difere do produto do BC e Alíquota / CFOP incompatível com a operação interestadual (CFOP 5102 x UF Destino).'
      );
    }

    if (modoSimulacaoNfe === 'timeout_emissor') {
      throw new SefazRejeicaoError(
        'TIMEOUT',
        'Servidor da SEFAZ/Emissor não respondeu dentro do limite de tempo (Timeout 30s de conexão com a Sefaz-MG).'
      );
    }

    // Sucesso
    const num = Math.floor(100000 + Math.random() * 899999);
    const chave = `312608${Math.floor(1000000000000000000000 + Math.random() * 8999999999999999999999)}`;
    const danfeUrl = `https://example.com/danfe-${chave}.pdf`;
    const xmlUrl = `https://example.com/nfe-${chave}.xml`;

    return {
      status: 'emitida',
      numero: `000.${num}`,
      chave,
      xmlUrl,
      danfeUrl,
      tentativas: 1,
    };
  }

  async emitirNfe(pedido: Pedido): Promise<PedidoNfe> {
    return this.emitir(pedido);
  }

  async consultarStatusNfe(chave: string): Promise<PedidoNfe> {
    return {
      status: 'emitida',
      chave,
      danfeUrl: `https://example.com/danfe-${chave}.pdf`,
      tentativas: 1,
    };
  }
}

export class HttpNfeService implements INfeService {
  async emitir(pedido: Pedido): Promise<PedidoNfe> {
    // TODO: Endpoint real da API de Emissão NF-e (Emissor intermediário / SEFAZ MG)
    // POST /api/nfe/emitir
    console.warn('HttpNfeService: Endpoint real de emissão de NF-e via emissor intermediário.');
    throw new Error('Serviço HTTP NF-e não configurado.');
  }

  async emitirNfe(pedido: Pedido): Promise<PedidoNfe> {
    return this.emitir(pedido);
  }

  async consultarStatusNfe(chave: string): Promise<PedidoNfe> {
    // TODO: Endpoint real para consulta de NF-e na SEFAZ
    // GET /api/nfe/status/{chave}
    throw new Error('Serviço HTTP NF-e não configurado.');
  }
}
