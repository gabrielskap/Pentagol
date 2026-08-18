import { CarrinhoItem, Pedido } from '../types';
import { IErpService } from './types';
import { mapearPedidoParaSupraSoft } from './mapeamentoErp';
import { getAll, upsert } from '../lib/db';

export type ErpSimulacaoModo = 'sucesso' | 'indisponivel' | 'erro_validacao';

let modoSimulacaoAtual: ErpSimulacaoModo = 'sucesso';

export function setModoSimulacaoErp(modo: ErpSimulacaoModo) {
  modoSimulacaoAtual = modo;
}

export function getModoSimulacaoErp(): ErpSimulacaoModo {
  return modoSimulacaoAtual;
}

export class MockErpService implements IErpService {
  async enviarPedido(pedido: Pedido): Promise<{ idExterno: string; status: string; mensagem: string }> {
    // Simula tempo de resposta do ERP
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (modoSimulacaoAtual === 'indisponivel') {
      throw new Error('Serviço ERP SupraSoft indisponível (503 Service Unavailable / Timeout de Conexão)');
    }

    if (modoSimulacaoAtual === 'erro_validacao') {
      throw new Error('Erro de validação de leiaute SupraSoft: Campo "CPF" em formato divergente.');
    }

    // Mapeia os dados utilizando o de-para centralizado
    const payloadSupraSoft = mapearPedidoParaSupraSoft(pedido);
    console.log('📦 [ERP SupraSoft Payload Enviado]:', payloadSupraSoft);

    const idExt = `SUPRA-${Math.floor(100000 + Math.random() * 899999)}`;

    return {
      idExterno: idExt,
      status: 'Pago',
      mensagem: `Pedido #${pedido.numero} integrado com sucesso no ERP SupraSoft (${idExt}). Status no ERP: Pago`,
    };
  }

  async sincronizarPedido(pedido: Pedido): Promise<{ idExterno: string; sucesso: boolean; mensagem: string }> {
    try {
      const res = await this.enviarPedido(pedido);
      return { idExterno: res.idExterno, sucesso: true, mensagem: res.mensagem };
    } catch (err: any) {
      return { idExterno: '', sucesso: false, mensagem: err.message };
    }
  }

  async consultarStatus(idExterno: string): Promise<{ status: string; recebidoEm?: string }> {
    return {
      status: 'Pago',
      recebidoEm: new Date().toISOString(),
    };
  }

  async baixarEstoque(itens: CarrinhoItem[]): Promise<boolean> {
    // Atualiza estoque na base local
    const variacoes = getAll<any>('variacoes');
    for (const item of itens) {
      const v = variacoes.find((varItem) => varItem.id === item.variacaoId || varItem.sku === item.sku);
      if (v) {
        const novoEstoque = Math.max(0, v.estoque - item.quantidade);
        upsert('variacoes', { ...v, estoque: novoEstoque });
      }
    }
    return true;
  }
}

export class HttpErpService implements IErpService {
  async enviarPedido(pedido: Pedido): Promise<{ idExterno: string; status: string; mensagem: string }> {
    // TODO: Confirmar com a Supra Soft qual o meio de entrada disponível — API REST/webservice, importação de arquivo (TXT/XML/CSV em pasta monitorada) ou integração direta em banco — porque isso define o adapter final.
    // Exemplo HTTP REST: POST /api/erp/pedidos
    const payload = mapearPedidoParaSupraSoft(pedido);
    console.warn('HttpErpService: POST /api/erp/pedidos chamando adapter real com payload:', payload);
    throw new Error('Endpoint HTTP do ERP SupraSoft não configurado em ambiente de produção.');
  }

  async sincronizarPedido(pedido: Pedido): Promise<{ idExterno: string; sucesso: boolean; mensagem: string }> {
    return this.enviarPedido(pedido).then((res) => ({
      idExterno: res.idExterno,
      sucesso: true,
      mensagem: res.mensagem,
    }));
  }

  async consultarStatus(idExterno: string): Promise<{ status: string; recebidoEm?: string }> {
    // TODO: GET /api/erp/pedidos/{idExterno}
    throw new Error('HttpErpService: Endpoint de consulta não configurado.');
  }

  async baixarEstoque(itens: CarrinhoItem[]): Promise<boolean> {
    // TODO: POST /api/erp/estoque/baixa
    throw new Error('HttpErpService: Endpoint de baixa de estoque não configurado.');
  }
}
