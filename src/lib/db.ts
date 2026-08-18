import {
  initialAdminUsuarios,
  initialBanners,
  initialBlocosHome,
  initialCategorias,
  initialClientes,
  initialConfigLoja,
  initialCupons,
  initialLogsIntegracao,
  initialPedidos,
  initialProdutos,
  initialVariacoes,
} from '../data/seed';
import {
  Banner,
  BlocoHome,
  Categoria,
  Cliente,
  ConfigLoja,
  Cupom,
  LogIntegracao,
  Pedido,
  Produto,
  UsuarioAdmin,
  Variacao,
} from '../types';

const DB_PREFIX = 'pentagol_db_v1_';
const DB_INITIALIZED_KEY = `${DB_PREFIX}initialized`;

export type CollectionName =
  | 'config'
  | 'categorias'
  | 'produtos'
  | 'variacoes'
  | 'banners'
  | 'blocos_home'
  | 'cupons'
  | 'clientes'
  | 'pedidos'
  | 'admins'
  | 'logs'
  | 'logs_integracao'
  | 'alertas_admin';

/**
 * Initialize database with seed data if not initialized
 */
export function initDb(forceReset = false): void {
  if (forceReset || localStorage.getItem(DB_INITIALIZED_KEY) !== 'true') {
    localStorage.setItem(`${DB_PREFIX}config`, JSON.stringify([initialConfigLoja]));
    localStorage.setItem(`${DB_PREFIX}categorias`, JSON.stringify(initialCategorias));
    localStorage.setItem(`${DB_PREFIX}produtos`, JSON.stringify(initialProdutos));
    localStorage.setItem(`${DB_PREFIX}variacoes`, JSON.stringify(initialVariacoes));
    localStorage.setItem(`${DB_PREFIX}banners`, JSON.stringify(initialBanners));
    localStorage.setItem(`${DB_PREFIX}blocos_home`, JSON.stringify(initialBlocosHome));
    localStorage.setItem(`${DB_PREFIX}cupons`, JSON.stringify(initialCupons));
    localStorage.setItem(`${DB_PREFIX}clientes`, JSON.stringify(initialClientes));
    localStorage.setItem(`${DB_PREFIX}pedidos`, JSON.stringify(initialPedidos));
    localStorage.setItem(`${DB_PREFIX}admins`, JSON.stringify(initialAdminUsuarios));
    localStorage.setItem(`${DB_PREFIX}logs`, JSON.stringify(initialLogsIntegracao));

    localStorage.setItem(DB_INITIALIZED_KEY, 'true');
    window.dispatchEvent(new CustomEvent('pentagol:db-updated', { detail: { collection: 'all' } }));
  }
}

/**
 * Check if database is initialized
 */
export function isDbInitialized(): boolean {
  return localStorage.getItem(DB_INITIALIZED_KEY) === 'true';
}

/**
 * Get all items from a collection
 */
export function getAll<T = any>(collection: CollectionName): T[] {
  if (!isDbInitialized()) {
    initDb();
  }
  const raw = localStorage.getItem(`${DB_PREFIX}${collection}`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as T[];
    if (collection === 'banners' && Array.isArray(parsed)) {
      const existingIds = new Set((parsed as any[]).map((b) => b.id));
      let updated = false;
      initialBanners.forEach((ib) => {
        if (!existingIds.has(ib.id)) {
          parsed.push(ib as any);
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(`${DB_PREFIX}banners`, JSON.stringify(parsed));
      }
    }
    if (collection === 'cupons' && Array.isArray(parsed)) {
      const existingCodes = new Set((parsed as any[]).map((c) => c.codigo.toUpperCase()));
      let updated = false;
      initialCupons.forEach((ic) => {
        if (!existingCodes.has(ic.codigo.toUpperCase())) {
          parsed.push(ic as any);
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(`${DB_PREFIX}cupons`, JSON.stringify(parsed));
      }
    }
    return parsed;
  } catch (err) {
    console.error(`Failed to parse collection ${collection}:`, err);
    return [];
  }
}

/**
 * Get item by ID from a collection
 */
export function getById<T extends { id: string }>(
  collection: CollectionName,
  id: string
): T | null {
  const items = getAll<T>(collection);
  return items.find((item) => item.id === id) || null;
}

/**
 * Upsert (insert or update) an item in a collection
 */
export function upsert<T extends { id: string }>(
  collection: CollectionName,
  item: T
): T {
  const items = getAll<T>(collection);
  const index = items.findIndex((existing) => existing.id === item.id);
  if (index >= 0) {
    items[index] = item;
  } else {
    items.push(item);
  }
  localStorage.setItem(`${DB_PREFIX}${collection}`, JSON.stringify(items));
  window.dispatchEvent(
    new CustomEvent('pentagol:db-updated', { detail: { collection, action: 'upsert', id: item.id } })
  );
  return item;
}

/**
 * Remove an item by ID from a collection
 */
export function remove(collection: CollectionName, id: string): boolean {
  const items = getAll<{ id: string }>(collection);
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length !== items.length) {
    localStorage.setItem(`${DB_PREFIX}${collection}`, JSON.stringify(filtered));
    window.dispatchEvent(
      new CustomEvent('pentagol:db-updated', { detail: { collection, action: 'remove', id } })
    );
    return true;
  }
  return false;
}

export const deleteRecord = remove;

/**
 * Get store configuration
 */
export function getConfigLoja(): ConfigLoja {
  const list = getAll<ConfigLoja>('config');
  return list[0] || initialConfigLoja;
}

/**
 * Save store configuration
 */
export function saveConfigLoja(config: ConfigLoja): ConfigLoja {
  localStorage.setItem(`${DB_PREFIX}config`, JSON.stringify([config]));
  window.dispatchEvent(
    new CustomEvent('pentagol:db-updated', { detail: { collection: 'config', action: 'upsert' } })
  );
  return config;
}

/**
 * Reset database to initial seed data
 */
export function resetToSeedData(): void {
  initDb(true);
}

/**
 * Generate and store 30 sample orders with varied statuses
 */
export function popular30PedidosExemplo(): number {
  const produtos = getAll<Produto>('produtos');
  const clientes = getAll<Cliente>('clientes');

  if (produtos.length === 0) return 0;

  const clientesExemplo = [
    { nome: 'Carlos Eduardo Silva', email: 'carlos.silva@gmail.com', cpf: '123.456.789-01', tel: '(31) 99811-2233', cidade: 'Belo Horizonte', uf: 'MG', cep: '30110-000' },
    { nome: 'Mariana Oliveira Costa', email: 'mariana.costa@hotmail.com', cpf: '234.567.890-12', tel: '(31) 98722-3344', cidade: 'Belo Horizonte', uf: 'MG', cep: '30130-010' },
    { nome: 'Fernanda Lima Rocha', email: 'fernanda.rocha@yahoo.com.br', cpf: '345.678.901-23', tel: '(31) 99133-4455', cidade: 'Contagem', uf: 'MG', cep: '32010-000' },
    { nome: 'Lucas Mendes Ferreira', email: 'lucas.mendes@outlook.com', cpf: '456.789.012-34', tel: '(31) 98844-5566', cidade: 'Betim', uf: 'MG', cep: '32600-000' },
    { nome: 'Patricia Souza Alves', email: 'patricia.souza@gmail.com', cpf: '567.890.123-45', tel: '(31) 99555-6677', cidade: 'Nova Lima', uf: 'MG', cep: '34000-000' },
    { nome: 'Roberto Carlos Santos', email: 'roberto.santos@gmail.com', cpf: '678.901.234-56', tel: '(31) 99666-7788', cidade: 'Sabará', uf: 'MG', cep: '34500-000' },
    { nome: 'Juliana Barbosa Martins', email: 'juliana.martins@uol.com.br', cpf: '789.012.345-67', tel: '(31) 99777-8899', cidade: 'Sete Lagoas', uf: 'MG', cep: '35700-000' },
    { nome: 'Gabriel Ribeiro Dias', email: 'gabriel.dias@gmail.com', cpf: '890.123.456-78', tel: '(31) 99888-9900', cidade: 'Uberlândia', uf: 'MG', cep: '38400-000' },
    { nome: 'Thiago Nogueira Gomes', email: 'thiago.gomes@gmail.com', cpf: '901.234.567-89', tel: '(11) 99111-2233', cidade: 'São Paulo', uf: 'SP', cep: '01310-100' },
    { nome: 'Camila Fernandes Pinto', email: 'camila.pinto@gmail.com', cpf: '012.345.678-90', tel: '(21) 99222-3344', cidade: 'Rio de Janeiro', uf: 'RJ', cep: '20040-002' },
  ];

  const statusDistribution: PedidoStatus[] = [
    'aguardando_pix', 'aguardando_pix', 'aguardando_pix',
    'pago', 'pago', 'pago', 'pago', 'pago',
    'em_separacao', 'em_separacao', 'em_separacao', 'em_separacao', 'em_separacao',
    'enviado', 'enviado', 'enviado', 'enviado', 'enviado', 'enviado',
    'entregue', 'entregue', 'entregue', 'entregue', 'entregue', 'entregue', 'entregue',
    'cancelado', 'cancelado',
    'pix_expirado', 'pix_expirado',
  ];

  const novosPedidos: Pedido[] = [];
  const agora = new Date();

  statusDistribution.forEach((st, idx) => {
    const numSeq = String(1001 + idx).padStart(4, '0');
    const numPedido = `PG-2026-${numSeq}`;
    const cli = clientesExemplo[idx % clientesExemplo.length];

    // Pick 1 to 3 random products
    const p1 = produtos[idx % produtos.length];
    const p2 = produtos[(idx + 3) % produtos.length];
    const item1Qty = (idx % 2) + 1;

    const items: CarrinhoItem[] = [
      {
        variacaoId: `${p1.id}-v1`,
        produtoId: p1.id,
        nome: p1.nome,
        sku: `${p1.referencia}-M`,
        tamanho: 'M',
        cor: 'Padrão',
        imagem: p1.imagens[0] || '',
        precoUnit: p1.precoBase,
        quantidade: item1Qty,
        pesoKg: p1.pesoKg,
        dimensoes: { alturaCm: p1.alturaCm, larguraCm: p1.larguraCm, comprimentoCm: p1.comprimentoCm },
      },
    ];

    if (idx % 3 === 0 && p2) {
      items.push({
        variacaoId: `${p2.id}-v2`,
        produtoId: p2.id,
        nome: p2.nome,
        sku: `${p2.referencia}-G`,
        tamanho: 'G',
        cor: 'Padrão',
        imagem: p2.imagens[0] || '',
        precoUnit: p2.precoBase,
        quantidade: 1,
        pesoKg: p2.pesoKg,
        dimensoes: { alturaCm: p2.alturaCm, larguraCm: p2.larguraCm, comprimentoCm: p2.comprimentoCm },
      });
    }

    const subtotal = items.reduce((acc, i) => acc + i.precoUnit * i.quantidade, 0);
    const temCupom = idx % 4 === 0;
    const descontoCupom = temCupom ? Number((subtotal * 0.1).toFixed(2)) : 0;
    const cupomCodigo = temCupom ? 'PENTA10' : undefined;
    const freteValor = subtotal > 299 ? 0 : 18.90;
    const total = Number((subtotal - descontoCupom + freteValor).toFixed(2));

    const diasAtras = 30 - idx;
    const dataCriacao = new Date(agora.getTime() - diasAtras * 24 * 60 * 60 * 1000 - (idx * 37 * 60 * 1000));
    const dataIso = dataCriacao.toISOString();

    const timeline: PedidoTimelineEvent[] = [
      { em: dataIso, evento: 'Pedido Criado', detalhe: 'Aguardando confirmação do pagamento Pix' },
    ];

    let pagoEm: string | undefined = undefined;
    if (st !== 'aguardando_pix' && st !== 'pix_expirado' && st !== 'cancelado') {
      const pData = new Date(dataCriacao.getTime() + 15 * 60 * 1000).toISOString();
      pagoEm = pData;
      timeline.push({ em: pData, evento: 'Pagamento Confirmado', detalhe: 'Pix R$ ' + total.toFixed(2) + ' confirmado' });
      timeline.push({ em: pData, evento: 'Enviado ao ERP', detalhe: 'Cadastrado no SupraSoft via API' });
    }

    if (st === 'em_separacao' || st === 'enviado' || st === 'entregue') {
      const sepData = new Date(dataCriacao.getTime() + 2 * 60 * 60 * 1000).toISOString();
      timeline.push({ em: sepData, evento: 'Em Separação', detalhe: 'NF-e emitida e produtos em separação no estoque' });
    }

    let rastreioObj: { codigo: string; url: string } | undefined = undefined;
    if (st === 'enviado' || st === 'entregue') {
      const envData = new Date(dataCriacao.getTime() + 24 * 60 * 60 * 1000).toISOString();
      const codRastreio = `PG${1000000 + idx}BR`;
      rastreioObj = { codigo: codRastreio, url: `https://www meurastreio.com.br?cod=${codRastreio}` };
      timeline.push({ em: envData, evento: 'Pedido Enviado', detalhe: `Postado via Correios (${codRastreio})` });
    }

    if (st === 'entregue') {
      const entData = new Date(dataCriacao.getTime() + 72 * 60 * 60 * 1000).toISOString();
      timeline.push({ em: entData, evento: 'Pedido Entregue', detalhe: 'Entregue ao destinatário no endereço cadastrado' });
    }

    if (st === 'cancelado') {
      const cancData = new Date(dataCriacao.getTime() + 30 * 60 * 1000).toISOString();
      timeline.push({ em: cancData, evento: 'Pedido Cancelado', detalhe: 'Cancelado pelo cliente ou falta de pagamento' });
    }

    if (st === 'pix_expirado') {
      const expData = new Date(dataCriacao.getTime() + 31 * 60 * 1000).toISOString();
      timeline.push({ em: expData, evento: 'Pix Expirado', detalhe: 'QRCode Pix não pago dentro do prazo de 30 minutos' });
    }

    const ped: Pedido = {
      id: `ped-30demo-${idx + 1}`,
      numero: numPedido,
      clienteId: `cli-demo-${(idx % clientesExemplo.length) + 1}`,
      snapshotCliente: {
        nomeCompleto: cli.nome,
        email: cli.email,
        cpf: cli.cpf,
        telefone: cli.tel,
      },
      itens: items,
      subtotal,
      descontoCupom,
      cupomCodigo,
      frete: {
        servico: idx % 2 === 0 ? 'PAC' : 'SEDEX',
        valor: freteValor,
        prazoDias: idx % 2 === 0 ? 5 : 2,
        transportadora: 'Correios',
      },
      total,
      endereco: {
        id: `end-demo-${idx}`,
        apelido: 'Residencial',
        cep: cli.cep,
        rua: 'Avenida Afonso Pena',
        numero: String(100 + idx * 10),
        bairro: 'Centro',
        cidade: cli.cidade,
        uf: cli.uf,
        principal: true,
      },
      status: st,
      pix: {
        txid: `TXID-DEMO-30-${idx + 1000}`,
        qrCodeImagem: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PENTAGOL_PIX_DEMO',
        copiaECola: '00020126360014BR.GOV.BCB.PIX0114+5531998765432520400005303986540510.005802BR5916PENTAGOL6009BH620705031236304E0C3',
        expiraEm: new Date(dataCriacao.getTime() + 30 * 60 * 1000).toISOString(),
        pagoEm,
      },
      nf: {
        status: (st === 'pago' || st === 'em_separacao' || st === 'enviado' || st === 'entregue') ? 'emitida' : st === 'aguardando_pix' ? 'nao_emitida' : 'nao_emitida',
        numero: (st === 'pago' || st === 'em_separacao' || st === 'enviado' || st === 'entregue') ? `000.${1000 + idx}` : undefined,
        chave: (st === 'pago' || st === 'em_separacao' || st === 'enviado' || st === 'entregue') ? `3126081234567800019955001000${1000 + idx}1001234567` : undefined,
        danfeUrl: '#',
        tentativas: st === 'pago' ? 1 : 0,
      },
      erp: {
        status: (st === 'pago' || st === 'em_separacao' || st === 'enviado' || st === 'entregue') ? 'enviado' : 'nao_enviado',
        idExterno: (st === 'pago' || st === 'em_separacao' || st === 'enviado' || st === 'entregue') ? `ERP-SUPRA-${9000 + idx}` : undefined,
      },
      rastreio: rastreioObj,
      timeline,
      criadoEm: dataIso,
    };

    novosPedidos.push(ped);
  });

  localStorage.setItem(`${DB_PREFIX}pedidos`, JSON.stringify(novosPedidos));
  window.dispatchEvent(
    new CustomEvent('pentagol:db-updated', { detail: { collection: 'pedidos', action: 'upsert' } })
  );

  return novosPedidos.length;
}

