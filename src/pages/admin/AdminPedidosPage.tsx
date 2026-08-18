import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, Eye, Filter, RefreshCw, Search, Wrench } from 'lucide-react';
import { getAll } from '../../lib/db';
import { enfileirarJob, processarFila } from '../../services/fila';
import { Pedido, PedidoStatus } from '../../types';

export const AdminPedidosPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [pedidos, setPedidos] = useState<Pedido[]>(getAll<Pedido>('pedidos'));
  
  // Filters
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [periodoFiltro, setPeriodoFiltro] = useState<string>('todos');
  const [valorFiltro, setValorFiltro] = useState<string>('todos');
  const [cupomFiltro, setCupomFiltro] = useState<string>('todos');
  const [ufFiltro, setUfFiltro] = useState<string>('todos');
  const [nfFiltro, setNfFiltro] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    const filtroParam = searchParams.get('filtro');
    if (filtroParam) {
      setStatusFiltro(filtroParam);
    }
  }, [searchParams]);

  const recarregarPedidos = () => {
    setPedidos(getAll<Pedido>('pedidos'));
  };

  // List of unique UFs from orders
  const ufsDisponiveis = Array.from(
    new Set(pedidos.map((p) => p.endereco?.uf).filter(Boolean))
  ).sort();

  const pedidosFiltrados = pedidos.filter((p) => {
    // Status Filter
    if (statusFiltro === 'pendencias_fiscais') {
      if (p.nf?.status !== 'rejeitada') return false;
    } else if (statusFiltro !== 'todos') {
      if (p.status !== statusFiltro) return false;
    }

    // NF Filter
    if (nfFiltro !== 'todos') {
      if ((p.nf?.status || 'nao_emitida') !== nfFiltro) return false;
    }

    // UF Filter
    if (ufFiltro !== 'todos') {
      if (p.endereco?.uf !== ufFiltro) return false;
    }

    // Cupom Filter
    if (cupomFiltro === 'com_cupom' && !p.cupomCodigo && p.descontoCupom <= 0) return false;
    if (cupomFiltro === 'sem_cupom' && (p.cupomCodigo || p.descontoCupom > 0)) return false;

    // Valor Filter
    if (valorFiltro === 'ate_100' && p.total > 100) return false;
    if (valorFiltro === '100_500' && (p.total < 100 || p.total > 500)) return false;
    if (valorFiltro === 'acima_500' && p.total < 500) return false;

    // Period Filter
    if (periodoFiltro !== 'todos') {
      const dataPedido = new Date(p.criadoEm).getTime();
      const agora = Date.now();
      const umDia = 86400000;
      if (periodoFiltro === 'hoje' && agora - dataPedido > umDia) return false;
      if (periodoFiltro === '7d' && agora - dataPedido > 7 * umDia) return false;
      if (periodoFiltro === '30d' && agora - dataPedido > 30 * umDia) return false;
    }

    // Search
    const term = busca.toLowerCase();
    const matchBusca =
      p.numero.toLowerCase().includes(term) ||
      p.snapshotCliente.nomeCompleto.toLowerCase().includes(term) ||
      p.snapshotCliente.email.toLowerCase().includes(term) ||
      p.snapshotCliente.cpf.includes(term);

    return matchBusca;
  });

  const handleExportarCSV = () => {
    if (pedidosFiltrados.length === 0) {
      alert('Nenhum pedido para exportar.');
      return;
    }

    const headers = [
      'Número',
      'Data/Hora',
      'Cliente',
      'CPF',
      'E-mail',
      'Telefone',
      'UF',
      'Subtotal',
      'Desconto',
      'Frete',
      'Total',
      'Status Pedido',
      'Status NF-e',
      'Rastreio',
    ];

    const rows = pedidosFiltrados.map((p) => [
      p.numero,
      new Date(p.criadoEm).toLocaleString('pt-BR'),
      `"${p.snapshotCliente.nomeCompleto}"`,
      p.snapshotCliente.cpf,
      p.snapshotCliente.email,
      p.snapshotCliente.telefone,
      p.endereco?.uf || '',
      p.subtotal.toFixed(2),
      p.descontoCupom.toFixed(2),
      p.frete?.valor?.toFixed(2) || '0.00',
      p.total.toFixed(2),
      p.status,
      p.nf?.status || 'nao_emitida',
      p.rastreio?.codigo || p.frete?.codigoRastreio || '',
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pedidos_pentagol_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeStatusClass = (status: PedidoStatus) => {
    switch (status) {
      case 'pago':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'aguardando_pix':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'em_separacao':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'enviado':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'entregue':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pix_expirado':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      aguardando_pix: 'Aguardando Pix',
      pago: 'Pago',
      em_separacao: 'Em separação',
      enviado: 'Enviado',
      entregue: 'Entregue',
      cancelado: 'Cancelado',
      pix_expirado: 'Pix Expirado',
    };
    return map[status] || status;
  };

  return (
    <div className="space-y-6 font-body">
      {/* HEADER */}
      <div className="bg-white border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-pg-display text-2xl text-gray-900 uppercase tracking-tight">
            GESTÃO DE PEDIDOS
          </h1>
          <p className="text-xs text-gray-500">
            Acompanhamento em tempo real de vendas, status fiscais SEFAZ e envios aos Correios
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleExportarCSV}
            className="bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display text-xs px-3.5 py-2 flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORTAR CSV</span>
          </button>
          <div className="bg-amber-50 border border-amber-300 px-3 py-1.5 text-xs text-amber-950 font-bold font-mono">
            {pedidosFiltrados.length} / {pedidos.length} Pedidos
          </div>
        </div>
      </div>

      {/* PAINEL DE FILTROS DENSOS */}
      <div className="bg-white border border-gray-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* SEARCH BUSCA */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por número do pedido, cliente, e-mail ou CPF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 text-xs focus:outline-none focus:border-pg-red font-body"
            />
          </div>

          {/* STATUS PRINCIPAL */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-gray-700 whitespace-nowrap">Status:</label>
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="border border-gray-300 p-2 text-xs font-body"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendencias_fiscais">⚠️ Pendências Fiscais (Rejeição SEFAZ)</option>
              <option value="aguardando_pix">Aguardando Pix</option>
              <option value="pago">Pago</option>
              <option value="em_separacao">Em separação</option>
              <option value="enviado">Enviado</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
              <option value="pix_expirado">Pix Expirado</option>
            </select>
          </div>
        </div>

        {/* SECUNDARY FILTERS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2 border-t text-xs">
          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-0.5">Período:</label>
            <select
              value={periodoFiltro}
              onChange={(e) => setPeriodoFiltro(e.target.value)}
              className="w-full border border-gray-300 p-1.5 font-body"
            >
              <option value="todos">Todo o histórico</option>
              <option value="hoje">Hoje</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-0.5">Valor Total:</label>
            <select
              value={valorFiltro}
              onChange={(e) => setValorFiltro(e.target.value)}
              className="w-full border border-gray-300 p-1.5 font-body"
            >
              <option value="todos">Qualquer valor</option>
              <option value="ate_100">Até R$ 100</option>
              <option value="100_500">R$ 100 a R$ 500</option>
              <option value="acima_500">Acima de R$ 500</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-0.5">Cupom Usado:</label>
            <select
              value={cupomFiltro}
              onChange={(e) => setCupomFiltro(e.target.value)}
              className="w-full border border-gray-300 p-1.5 font-body"
            >
              <option value="todos">Todos os pedidos</option>
              <option value="com_cupom">Com cupom aplicado</option>
              <option value="sem_cupom">Sem cupom</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-0.5">Estado (UF):</label>
            <select
              value={ufFiltro}
              onChange={(e) => setUfFiltro(e.target.value)}
              className="w-full border border-gray-300 p-1.5 font-body"
            >
              <option value="todos">Todas as UFs</option>
              {ufsDisponiveis.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-0.5">Status NF-e:</label>
            <select
              value={nfFiltro}
              onChange={(e) => setNfFiltro(e.target.value)}
              className="w-full border border-gray-300 p-1.5 font-body"
            >
              <option value="todos">Todos os status NF</option>
              <option value="nao_emitida">Não emitida</option>
              <option value="na_fila">Na fila de emissão</option>
              <option value="emitida">Emitida com sucesso</option>
              <option value="rejeitada">Rejeitada pela SEFAZ</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABELA DE PEDIDOS */}
      <div className="bg-white border border-gray-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-100 text-gray-700 uppercase font-bold border-b border-gray-200">
            <tr>
              <th className="py-3 px-4">Número</th>
              <th className="py-3 px-4">Data/Hora</th>
              <th className="py-3 px-4">Cliente / CPF</th>
              <th className="py-3 px-4">Itens</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Status Pedido</th>
              <th className="py-3 px-4">NF-e SEFAZ</th>
              <th className="py-3 px-4">Rastreio</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-body">
            {pedidosFiltrados.map((p) => {
              const temRejeicaoNfe = p.nf?.status === 'rejeitada';
              const qtdTotalItens = p.itens.reduce((acc, i) => acc + i.quantidade, 0);

              return (
                <tr
                  key={p.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    temRejeicaoNfe ? 'bg-red-50/60' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                    #{p.numero}
                  </td>
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                    {new Date(p.criadoEm).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-gray-900 block uppercase">
                      {p.snapshotCliente.nomeCompleto}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {p.snapshotCliente.cpf} • {p.endereco?.cidade}/{p.endereco?.uf}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="group relative inline-block cursor-help">
                      <span className="bg-gray-100 border border-gray-300 font-bold px-2 py-0.5 text-[11px]">
                        {qtdTotalItens} {qtdTotalItens === 1 ? 'item' : 'itens'}
                      </span>
                      {/* Tooltip Hover */}
                      <div className="hidden group-hover:block absolute z-20 left-0 top-full mt-1 w-64 bg-gray-900 text-white p-2.5 rounded shadow-lg text-[11px] space-y-1">
                        <p className="font-bold border-b border-gray-700 pb-1 text-pg-yellow">
                          DETALHE DOS ITENS:
                        </p>
                        {p.itens.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px]">
                            <span className="truncate pr-2">
                              {it.quantidade}x {it.nome} ({it.tamanho || 'Tam Único'})
                            </span>
                            <span className="font-mono text-gray-300">{it.sku}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-pg-red whitespace-nowrap">
                    R$ {p.total.toFixed(2).replace('.', ',')}
                    {p.cupomCodigo && (
                      <span className="block text-[9px] text-emerald-700 font-mono">
                        Cupom: {p.cupomCodigo}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase border ${getBadgeStatusClass(
                        p.status
                      )}`}
                    >
                      {formatStatusLabel(p.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {p.nf?.status === 'emitida' ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold uppercase block w-max">
                        EMITIDA (№ {p.nf.numero || '101'})
                      </span>
                    ) : p.nf?.status === 'rejeitada' ? (
                      <div className="space-y-1">
                        <span className="bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 text-[10px] font-bold uppercase block w-max">
                          REJEITADA
                        </span>
                        <p className="text-[10px] text-pg-red font-mono truncate max-w-[160px]" title={p.nf.motivoRejeicao}>
                          {p.nf.motivoRejeicao}
                        </p>
                      </div>
                    ) : p.nf?.status === 'na_fila' ? (
                      <span className="bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 text-[10px] font-bold uppercase block w-max">
                        NA FILA
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase block w-max">
                        NÃO EMITIDA
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                    {p.rastreio?.codigo || p.frete?.codigoRastreio ? (
                      <a
                        href={p.rastreio?.url || `https://rastreamento.correios.com.br/app/index.php?codigo=${p.frete?.codigoRastreio}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-pg-petrol hover:underline font-bold"
                      >
                        {p.rastreio?.codigo || p.frete?.codigoRastreio}
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">Sem rastreio</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    {temRejeicaoNfe && (
                      <button
                        type="button"
                        onClick={async () => {
                          enfileirarJob(p.id, 'nfe.emitir');
                          await processarFila();
                          recarregarPedidos();
                        }}
                        className="bg-pg-red hover:bg-opacity-90 text-white font-pg-display text-[10px] font-bold px-2 py-1 uppercase shadow-xs inline-flex items-center space-x-1"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>REEMITIR</span>
                      </button>
                    )}

                    <Link
                      to={`/admin/pedidos/${p.id}`}
                      className="bg-pg-petrol text-white font-pg-display text-[11px] px-3 py-1.5 hover:bg-opacity-90 inline-flex items-center space-x-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>GERENCIAR</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {pedidosFiltrados.length === 0 && (
          <div className="p-8 text-center text-gray-500 font-body">
            Nenhum pedido localizado com os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
};
