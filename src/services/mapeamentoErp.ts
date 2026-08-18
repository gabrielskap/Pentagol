import { Pedido } from '../types';

export interface SupraSoftClientePayload {
  nomeRazaoSocial: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
}

export interface SupraSoftItemPayload {
  codigoItemReferencia: string; // Produto ID
  skuVariacao: string;         // SKU da Variação
  descricaoProduto: string;     // Nome do produto
  tamanhoCor: string;           // Tamanho e/ou Cor
  quantidade: number;
  precoUnitarioBruto: number;   // Preço cheio do item
  descontoRateado: number;      // Desconto proporcional do cupom aplicado ao item
  precoUnitarioLiquido: number; // Preço unitário líquido pós-desconto
  subtotalItem: number;         // Preço líquido * quantidade
}

export interface SupraSoftPedidoPayload {
  origem: 'PENTAGOL_ECOMMERCE';
  numeroPedidoLoja: string;
  dataHoraPedido: string;
  valorTotalPedido: number;
  valorFrete: number;
  valorDescontoGlobal: number;
  codigoCupom?: string;
  cliente: SupraSoftClientePayload;
  itens: SupraSoftItemPayload[];
  formaPagamento: 'PIX';
  detalhesPix: {
    txid: string;
    pagoEm?: string;
  };
}

/**
 * Mapeamento de-para de campos do Pedido da Pentagol para o formato do ERP SupraSoft.
 * Centralizado neste arquivo para facilitar ajustes futuros conforme layout oficial.
 */
export function mapearPedidoParaSupraSoft(pedido: Pedido): SupraSoftPedidoPayload {
  const subtotalProdutos = pedido.subtotal || 1;
  const descontoTotal = pedido.descontoCupom || 0;

  const itensMapeados: SupraSoftItemPayload[] = pedido.itens.map((item) => {
    const itemSubtotalBruto = item.precoUnit * item.quantidade;
    // Rateia o desconto do cupom proporcionalmente ao valor bruto de cada item
    const proporcao = subtotalProdutos > 0 ? itemSubtotalBruto / subtotalProdutos : 0;
    const descontoItemTotal = Number((descontoTotal * proporcao).toFixed(2));
    const descontoPorUnidade = item.quantidade > 0 ? descontoItemTotal / item.quantidade : 0;
    const precoLiquidoUnit = Number(Math.max(0, item.precoUnit - descontoPorUnidade).toFixed(2));
    const subtotalItemLiquido = Number((precoLiquidoUnit * item.quantidade).toFixed(2));

    const variacaoTexto = [item.tamanho, item.cor].filter(Boolean).join(' / ');

    return {
      codigoItemReferencia: item.produtoId,
      skuVariacao: item.sku,
      descricaoProduto: item.nome,
      tamanhoCor: variacaoTexto || 'Tamanho Único',
      quantidade: item.quantidade,
      precoUnitarioBruto: item.precoUnit,
      descontoRateado: descontoItemTotal,
      precoUnitarioLiquido: precoLiquidoUnit,
      subtotalItem: subtotalItemLiquido,
    };
  });

  return {
    origem: 'PENTAGOL_ECOMMERCE',
    numeroPedidoLoja: pedido.numero,
    dataHoraPedido: pedido.criadoEm,
    valorTotalPedido: pedido.total,
    valorFrete: pedido.frete?.valor || 0,
    valorDescontoGlobal: pedido.descontoCupom || 0,
    codigoCupom: pedido.cupomCodigo,
    cliente: {
      nomeRazaoSocial: pedido.snapshotCliente.nomeCompleto,
      cpfCnpj: pedido.snapshotCliente.cpf,
      email: pedido.snapshotCliente.email,
      telefone: pedido.snapshotCliente.telefone,
      endereco: {
        logradouro: pedido.endereco.rua,
        numero: pedido.endereco.numero,
        complemento: pedido.endereco.complemento || '',
        bairro: pedido.endereco.bairro,
        cidade: pedido.endereco.cidade,
        uf: pedido.endereco.uf,
        cep: pedido.endereco.cep,
      },
    },
    itens: itensMapeados,
    formaPagamento: 'PIX',
    detalhesPix: {
      txid: pedido.pix?.txid || 'TXID-MOCK',
      pagoEm: pedido.pix?.pagoEm || new Date().toISOString(),
    },
  };
}
