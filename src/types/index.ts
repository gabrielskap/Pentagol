export type CategoriaTipo = 'modalidade' | 'publico' | 'linha';

export interface Categoria {
  id: string;
  nome: string;
  slug: string;
  tipo: CategoriaTipo;
  parentId?: string;
  ordem: number;
  ativo: boolean;
  exibirNaSidebarHome?: boolean;
  exibirNoMegaMenuEsportes?: boolean;
}

export interface Variacao {
  id: string;
  produtoId: string;
  sku: string;
  tamanho?: string;
  cor?: string;
  precoAdicional: number;
  estoque: number;
  ativo: boolean;
}

export interface Produto {
  id: string;
  nome: string;
  referencia: string; // SKU pai
  descricao: string;
  marca: string;
  categoriaIds: string[];
  modalidades: string[];
  imagens: string[];
  precoBase: number;
  ativo: boolean;
  destaque: boolean;
  novidade: boolean;
  pesoKg: number;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
  criadoEm: string;
}

export interface Endereco {
  id: string;
  apelido: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  principal: boolean;
}

export interface Cliente {
  id: string;
  nomeCompleto: string;
  email: string;
  cpf: string;
  telefone: string;
  senhaHash: string; // base64 mock
  enderecos: Endereco[];
  criadoEm: string;
  ativo?: boolean;
}

export interface CarrinhoItem {
  variacaoId: string;
  produtoId: string;
  nome: string;
  sku: string;
  tamanho?: string;
  cor?: string;
  imagem: string;
  precoUnit: number;
  quantidade: number;
  pesoKg: number;
  dimensoes: {
    alturaCm: number;
    larguraCm: number;
    comprimentoCm: number;
  };
}

export interface Cupom {
  id: string;
  codigo: string;
  percentual: number;
  valorMinimoPedido?: number;
  automatico: boolean;
  validadeInicio: string;
  validadeFim: string;
  usosMaximos?: number;
  usos: number;
  ativo: boolean;
  descricao: string;
}

export interface Frete {
  servico: 'PAC' | 'SEDEX';
  valor: number;
  prazoDias: number;
  transportadora: string;
}

export type PedidoStatus =
  | 'aguardando_pix'
  | 'pago'
  | 'em_separacao'
  | 'enviado'
  | 'entregue'
  | 'cancelado'
  | 'pix_expirado';

export interface PedidoPix {
  txid: string;
  qrCodeImagem: string;
  copiaECola: string;
  expiraEm: string;
  pagoEm?: string;
}

export interface PedidoNfe {
  status: 'nao_emitida' | 'na_fila' | 'emitida' | 'rejeitada';
  numero?: string;
  chave?: string;
  xmlUrl?: string;
  danfeUrl?: string;
  motivoRejeicao?: string;
  tentativas: number;
}

export interface PedidoErp {
  status: 'nao_enviado' | 'enviado' | 'erro';
  idExterno?: string;
  erro?: string;
}

export interface PedidoTimelineEvent {
  em: string;
  evento: string;
  detalhe?: string;
}

export interface Pedido {
  id: string;
  numero: string;
  clienteId: string;
  snapshotCliente: {
    nomeCompleto: string;
    email: string;
    cpf: string;
    telefone: string;
  };
  itens: CarrinhoItem[];
  subtotal: number;
  descontoCupom: number;
  cupomCodigo?: string;
  frete: Frete;
  total: number;
  endereco: Endereco;
  status: PedidoStatus;
  pix: PedidoPix;
  nf: PedidoNfe;
  erp: PedidoErp;
  rastreio?: {
    codigo: string;
    url: string;
  };
  timeline: PedidoTimelineEvent[];
  criadoEm: string;
}

export interface Banner {
  id: string;
  titulo: string;
  subtitulo?: string;
  textoBotao?: string;
  corDestaque?: string;
  imagemUrl: string;
  linkUrl: string;
  posicao: 'hero' | 'promo_1' | 'promo_2' | 'promo_3' | 'faixa_inferior';
  ordem: number;
  ativo: boolean;
  dataInicio?: string;
  dataFim?: string;
}

export interface BlocoHome {
  id: string;
  tipo: 'sidebar_categorias' | 'grid_banners' | 'vitrine';
  titulo: string;
  ordem: number;
  ativo: boolean;
  config?: Record<string, any>;
}

export interface PaginaInstitucional {
  id: string;
  titulo: string;
  slug: string;
  conteudo: string;
  exibirNoRodaPe: boolean;
  ordem: number;
}

export interface ConfigLoja {
  nomeLoja: string;
  cnpj?: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  cepOrigem: string;
  prazoAdicionalDias: number;
  textoTopo: string;
  descontoPixPorcentagem?: number;
  chavePixDefault?: string;
  redes: {
    instagram: string;
    facebook: string;
  };
  cupomAutomaticoAtivo: boolean;
  valorMinimoCupomAutomatico: number;
  percentualCupomAutomatico: number;
  pixExpiracaoMinutos: number;
  freteGratisAcimaDe?: number;
  modoServicos?: {
    viacep: 'demo' | 'prod';
    correios: 'demo' | 'prod';
    pix: 'demo' | 'prod';
    erp: 'demo' | 'prod';
    nfe: 'demo' | 'prod';
  };
}

export interface LogIntegracao {
  id: string;
  em: string;
  servico: 'viacep' | 'correios' | 'pix' | 'erp' | 'nfe';
  acao?: string;
  pedidoId?: string;
  requisicao: string;
  resposta: string;
  sucesso: boolean;
  mensagem: string;
}

export interface UsuarioAdmin {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  perfil: 'admin' | 'operador';
  ativo: boolean;
}
