import { CarrinhoItem, Endereco, Frete, Pedido, PedidoNfe, PedidoPix } from '../types';

export interface EnderecoCepResponse {
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
  erro?: boolean;
}

export interface ICepService {
  consultarCep(cep: string): Promise<EnderecoCepResponse>;
}

export interface IFreteService {
  calcularFrete(cepDestino: string, pesoTotalKg: number, subtotal: number, itens?: CarrinhoItem[]): Promise<Frete[]>;
}

export interface IPixService {
  gerarPix(pedidoId: string, valorTotal: number, cpfPagador?: string, nomePagador?: string, expiraEmMinutos?: number): Promise<PedidoPix>;
  criarCobranca(params: { pedidoId: string; valorTotal: number; cpfPagador?: string; nomePagador?: string; expiraEmMinutos?: number }): Promise<PedidoPix>;
  verificarStatusPix(txid: string): Promise<{ pago: boolean; pagoEm?: string }>;
  consultarStatus(txid: string): Promise<{ pago: boolean; pagoEm?: string }>;
  simularConfirmacao?(txid: string): Promise<boolean>;
  simularExpiracao?(txid: string): Promise<boolean>;
}

export interface INfeService {
  emitir(pedido: Pedido): Promise<PedidoNfe>;
  emitirNfe(pedido: Pedido): Promise<PedidoNfe>;
  consultarStatusNfe(chave: string): Promise<PedidoNfe>;
}

export interface IErpService {
  enviarPedido(pedido: Pedido): Promise<{ idExterno: string; status: string; mensagem: string }>;
  consultarStatus(idExterno: string): Promise<{ status: string; recebidoEm?: string }>;
  baixarEstoque(itens: CarrinhoItem[]): Promise<boolean>;
  sincronizarPedido(pedido: Pedido): Promise<{ idExterno: string; sucesso: boolean; mensagem: string }>;
}
