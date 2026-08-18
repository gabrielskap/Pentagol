import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Box,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Package,
  QrCode,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getAll } from '../../lib/db';
import { enfileirarJob, processarFila } from '../../services/fila';
import { LogIntegracao, Pedido, Produto, Variacao } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes'>('mes');
  const [agora, setAgora] = useState(new Date());

  const pedidos = getAll<Pedido>('pedidos');
  const produtos = getAll<Produto>('produtos');
  const variacoes = getAll<Variacao>('variacoes');
  const logs = getAll<LogIntegracao>('logs');

  // Live timer for Pix countdowns
  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter orders by period
  const pedidosNoPeriodo = pedidos.filter((p) => {
    const dataPed = new Date(p.criadoEm);
    const diffDias = (agora.getTime() - dataPed.getTime()) / (1000 * 3600 * 24);

    if (periodo === 'hoje') return diffDias <= 1;
    if (periodo === 'semana') return diffDias <= 7;
    return diffDias <= 30; // mes
  });

  // Metrics calculation
  const pedidosPagos = pedidosNoPeriodo.filter(
    (p) => p.status === 'pago' || p.status === 'em_separacao' || p.status === 'enviado' || p.status === 'entregue'
  );

  const totalFaturamento = pedidosPagos.reduce((sum, p) => sum + p.total, 0);
  const totalTicketMedio = pedidosPagos.length > 0 ? totalFaturamento / pedidosPagos.length : 0;

  const totalItensVendidos = pedidosPagos.reduce(
    (sum, p) => sum + p.itens.reduce((iSum, item) => iSum + item.quantidade, 0),
    0
  );

  const totalPixGerados = pedidosNoPeriodo.filter((p) => p.pix).length;
  const totalPixPagos = pedidosPagos.filter((p) => p.pix?.pagoEm).length;
  const taxaConversaoPix = totalPixGerados > 0 ? (totalPixPagos / totalPixGerados) * 100 : 100;

  // Breakdown by status
  const statusCount = {
    pago: pedidosNoPeriodo.filter((p) => p.status === 'pago').length,
    aguardando_pix: pedidosNoPeriodo.filter((p) => p.status === 'aguardando_pix').length,
    em_separacao: pedidosNoPeriodo.filter((p) => p.status === 'em_separacao').length,
    enviado: pedidosNoPeriodo.filter((p) => p.status === 'enviado').length,
    entregue: pedidosNoPeriodo.filter((p) => p.status === 'entregue').length,
    cancelado: pedidosNoPeriodo.filter((p) => p.status === 'cancelado').length,
  };

  // Line chart data: Sales trend by day
  const diasMap: Record<string, { data: string; total: number; pedidos: number }> = {};
  pedidosNoPeriodo.forEach((p) => {
    if (p.status === 'pago' || p.status === 'enviado' || p.status === 'entregue' || p.status === 'em_separacao') {
      const dataFmt = new Date(p.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!diasMap[dataFmt]) {
        diasMap[dataFmt] = { data: dataFmt, total: 0, pedidos: 0 };
      }
      diasMap[dataFmt].total += p.total;
      diasMap[dataFmt].pedidos += 1;
    }
  });

  const dadosGraficoVendas = Object.values(diasMap);
  if (dadosGraficoVendas.length === 0) {
    dadosGraficoVendas.push(
      { data: 'Hoje', total: totalFaturamento, pedidos: pedidosPagos.length }
    );
  }

  // Bar chart data: Top 10 best-selling products
  const rankingProdutos: Record<string, { nome: string; quantidade: number; valorTotal: number }> = {};
  pedidos.forEach((p) => {
    if (p.status === 'pago' || p.status === 'enviado' || p.status === 'entregue' || p.status === 'em_separacao') {
      p.itens.forEach((item) => {
        if (!rankingProdutos[item.nome]) {
          rankingProdutos[item.nome] = { nome: item.nome, quantidade: 0, valorTotal: 0 };
        }
        rankingProdutos[item.nome].quantidade += item.quantidade;
        rankingProdutos[item.nome].valorTotal += item.precoUnit * item.quantidade;
      });
    }
  });

  const top10Produtos = Object.values(rankingProdutos)
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10);

  // Lists
  const ultimos10Pedidos = [...pedidos].reverse().slice(0, 10);

  const pedidosAguardandoPix = pedidos.filter((p) => p.status === 'aguardando_pix');

  // Low stock products (< 5)
  const produtosEstoqueBaixo = produtos
    .map((p) => {
      const varsDoProd = variacoes.filter((v) => v.produtoId === p.id);
      const estoqueTotal = varsDoProd.reduce((sum, v) => sum + v.estoque, 0);
      return { produto: p, estoqueTotal, variacoesCount: varsDoProd.length };
    })
    .filter((item) => item.estoqueTotal < 5);

  const pedPendenciasFiscais = pedidos.filter((p) => p.nf?.status === 'rejeitada');
  const pedErrosErp = pedidos.filter((p) => p.erp?.status === 'erro');

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR & PERIOD SELECTOR */}
      <div className="bg-white border border-gray-200 p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-pg-display text-2xl text-gray-900 uppercase">
            DASHBOARD EXECUTIVO DE VENDAS
          </h1>
          <p className="text-xs text-gray-500">
            Painel consolidado em tempo real: faturamento, conversão Pix, integração NF-e e ERP SupraSoft
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-gray-500 uppercase mr-1">Período:</span>
          <div className="inline-flex bg-gray-100 p-1 border border-gray-200">
            <button
              type="button"
              onClick={() => setPeriodo('hoje')}
              className={`px-3 py-1 text-xs font-bold uppercase transition-colors ${
                periodo === 'hoje' ? 'bg-pg-red text-white' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('semana')}
              className={`px-3 py-1 text-xs font-bold uppercase transition-colors ${
                periodo === 'semana' ? 'bg-pg-red text-white' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Esta Semana
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('mes')}
              className={`px-3 py-1 text-xs font-bold uppercase transition-colors ${
                periodo === 'mes' ? 'bg-pg-red text-white' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Este Mês
            </button>
          </div>
        </div>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 1. FATURAMENTO PAGO */}
        <div className="bg-white border border-gray-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Faturamento Pago</p>
          <h3 className="font-body text-xl font-extrabold text-gray-900 mt-1">
            R$ {totalFaturamento.toFixed(2).replace('.', ',')}
          </h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{pedidosPagos.length} pedido(s) confirmados</span>
          </p>
        </div>

        {/* 2. TICKET MÉDIO */}
        <div className="bg-white border border-gray-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ticket Médio</p>
          <h3 className="font-body text-xl font-extrabold text-pg-petrol mt-1">
            R$ {totalTicketMedio.toFixed(2).replace('.', ',')}
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">Média por pedido aprovado</p>
        </div>

        {/* 3. ITENS VENDIDOS */}
        <div className="bg-white border border-gray-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Itens Vendidos</p>
          <h3 className="font-body text-xl font-extrabold text-gray-900 mt-1">
            {totalItensVendidos} <span className="text-xs font-normal text-gray-500">unidades</span>
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">Volume físico entregue/enviado</p>
        </div>

        {/* 4. CONVERSÃO PIX */}
        <div className="bg-white border border-gray-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Conversão de Pix</p>
          <h3 className="font-body text-xl font-extrabold text-emerald-700 mt-1">
            {taxaConversaoPix.toFixed(1)}%
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">{totalPixPagos} pagos de {totalPixGerados} gerados</p>
        </div>

        {/* 5. AGUARDANDO PIX */}
        <div className="bg-white border border-gray-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aguardando Pix</p>
          <h3 className="font-body text-xl font-extrabold text-pg-orange mt-1">
            {statusCount.aguardando_pix} <span className="text-xs font-normal text-gray-500">pedidos</span>
          </h3>
          <p className="text-[10px] text-amber-600 font-bold mt-1">Dentro do prazo de 30min</p>
        </div>

      </div>

      {/* PEDIDOS POR STATUS BREAKDOWN */}
      <div className="bg-white border border-gray-200 p-4 shadow-xs space-y-2">
        <h3 className="font-pg-display text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">
          DISTRIBUIÇÃO DE PEDIDOS POR STATUS
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
          <div className="bg-amber-50 p-2 border border-amber-200">
            <span className="block text-[10px] font-bold text-amber-800 uppercase">Aguardando Pix</span>
            <span className="font-mono text-base font-bold text-amber-900">{statusCount.aguardando_pix}</span>
          </div>
          <div className="bg-emerald-50 p-2 border border-emerald-200">
            <span className="block text-[10px] font-bold text-emerald-800 uppercase">Pago</span>
            <span className="font-mono text-base font-bold text-emerald-900">{statusCount.pago}</span>
          </div>
          <div className="bg-sky-50 p-2 border border-sky-200">
            <span className="block text-[10px] font-bold text-sky-800 uppercase">Em Separação</span>
            <span className="font-mono text-base font-bold text-sky-900">{statusCount.em_separacao}</span>
          </div>
          <div className="bg-blue-50 p-2 border border-blue-200">
            <span className="block text-[10px] font-bold text-blue-800 uppercase">Enviado</span>
            <span className="font-mono text-base font-bold text-blue-900">{statusCount.enviado}</span>
          </div>
          <div className="bg-green-50 p-2 border border-green-200">
            <span className="block text-[10px] font-bold text-green-800 uppercase">Entregue</span>
            <span className="font-mono text-base font-bold text-green-900">{statusCount.entregue}</span>
          </div>
          <div className="bg-gray-100 p-2 border border-gray-200">
            <span className="block text-[10px] font-bold text-gray-600 uppercase">Cancelado/Expirado</span>
            <span className="font-mono text-base font-bold text-gray-700">{statusCount.cancelado}</span>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRÁFICO 1: LINHA DE VENDAS DIÁRIAS */}
        <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-pg-display text-sm font-bold text-gray-900 uppercase flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-pg-red" />
              <span>EVOLUÇÃO DO FATURAMENTO (R$)</span>
            </h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Por dia do período</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosGraficoVendas}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="data" style={{ fontSize: '11px', fontFamily: 'sans-serif' }} />
                <YAxis style={{ fontSize: '11px', fontFamily: 'sans-serif' }} />
                <Tooltip
                  formatter={(val: any) => [`R$ ${Number(val).toFixed(2).replace('.', ',')}`, 'Faturamento']}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#c8102e"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#c8102e' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: TOP 10 PRODUTOS MAIS VENDIDOS */}
        <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-pg-display text-sm font-bold text-gray-900 uppercase flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-pg-petrol" />
              <span>TOP 10 PRODUTOS MAIS VENDIDOS (UNIDADES)</span>
            </h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Ranking acumulado</span>
          </div>
          <div className="h-64 w-full">
            {top10Produtos.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Nenhuma venda registrada no período selecionado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10Produtos} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" style={{ fontSize: '11px' }} />
                  <YAxis dataKey="nome" type="category" width={110} style={{ fontSize: '10px' }} />
                  <Tooltip
                    formatter={(val: any) => [`${val} un.`, 'Quantidade Vendida']}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="quantidade" fill="#082229" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* CARD PENDÊNCIAS FISCAIS & ERROS DE INTEGRAÇÃO */}
      {(pedPendenciasFiscais.length > 0 || pedErrosErp.length > 0) && (
        <div className="bg-white border-2 border-pg-red p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-red-200 pb-2">
            <h3 className="font-pg-display text-base font-bold text-pg-red uppercase flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-pg-red animate-bounce" />
              <span>CARD DE PENDÊNCIAS: REJEIÇÕES FISCAIS SEFAZ & ERROS DE ERP</span>
            </h3>
            <span className="bg-red-100 text-red-900 font-mono text-xs font-bold px-2.5 py-0.5">
              {pedPendenciasFiscais.length + pedErrosErp.length} alerta(s)
            </span>
          </div>

          <div className="divide-y divide-red-100 text-xs">
            {pedPendenciasFiscais.map((ped) => (
              <div key={`nf-${ped.id}`} className="py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold font-mono text-gray-900 text-sm">Pedido #{ped.numero}</span>
                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 uppercase">
                      REJEIÇÃO SEFAZ NF-E
                    </span>
                  </div>
                  <p className="text-gray-800 font-bold">{ped.snapshotCliente.nomeCompleto} ({ped.snapshotCliente.email})</p>
                  <p className="text-pg-red font-mono text-[11px] bg-red-50 p-2 border border-red-200">
                    Motivo SEFAZ: {ped.nf.motivoRejeicao || 'Erro de autorização de nota fiscal'}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      enfileirarJob(ped.id, 'nfe.emitir');
                      processarFila();
                      alert(`Job de reemissão de NF-e do pedido #${ped.numero} adicionado à fila com sucesso!`);
                      window.location.reload();
                    }}
                    className="bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-xs font-bold uppercase px-3.5 py-2 flex items-center space-x-1.5 shadow-xs"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>REEMITIR NOTA FISCAL</span>
                  </button>
                  <Link
                    to={`/admin/pedidos/${ped.id}`}
                    className="bg-gray-800 hover:bg-gray-900 text-white font-pg-display text-xs font-bold uppercase px-3 py-2"
                  >
                    VER DETALHES
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TWO COLUMNS: PIX COUNTDOWN & ESTOQUE BAIXO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LISTA 1: PEDIDOS AGUARDANDO PIX COM TEMPO RESTANTE */}
        <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-pg-display text-sm font-bold text-gray-900 uppercase flex items-center space-x-2">
              <Clock className="w-4 h-4 text-pg-orange" />
              <span>PEDIDOS AGUARDANDO PIX (TEMPO RESTANTE)</span>
            </h3>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 font-mono">
              {pedidosAguardandoPix.length} em aberto
            </span>
          </div>

          {pedidosAguardandoPix.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 italic text-center">
              Nenhum pedido aguardando pagamento via Pix no momento.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {pedidosAguardandoPix.map((ped) => {
                const expiraEm = ped.pix?.expiraEm ? new Date(ped.pix.expiraEm) : new Date(Date.now() + 1800000);
                const diffMs = expiraEm.getTime() - agora.getTime();
                const minutos = Math.max(0, Math.floor(diffMs / 60000));
                const segundos = Math.max(0, Math.floor((diffMs % 60000) / 1000));

                return (
                  <div
                    key={ped.id}
                    className="p-3 bg-amber-50 border border-amber-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-gray-900">{ped.numero}</span>
                        <span className="text-gray-600 font-bold">{ped.snapshotCliente.nomeCompleto}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Total: <strong className="text-gray-900">R$ {ped.total.toFixed(2).replace('.', ',')}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="block font-mono text-sm font-bold text-pg-red">
                        {String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] text-gray-500 uppercase">Tempo Restante</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LISTA 2: PRODUTOS COM ESTOQUE BAIXO (< 5) */}
        <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-pg-display text-sm font-bold text-gray-900 uppercase flex items-center space-x-2">
              <Box className="w-4 h-4 text-pg-red" />
              <span>ALERTA DE ESTOQUE BAIXO (&lt; 5 UNIDADES)</span>
            </h3>
            <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 font-mono">
              {produtosEstoqueBaixo.length} alerta(s)
            </span>
          </div>

          {produtosEstoqueBaixo.length === 0 ? (
            <p className="text-xs text-emerald-700 font-bold py-4 text-center flex items-center justify-center space-x-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Todos os produtos possuem estoque suficiente superior a 5 unidades.</span>
            </p>
          ) : (
            <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
              {produtosEstoqueBaixo.map(({ produto, estoqueTotal }) => (
                <div
                  key={produto.id}
                  className="p-2.5 bg-red-50 border border-red-200 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <img src={produto.imagens[0]} alt="" className="w-8 h-8 object-contain border bg-white" />
                    <div>
                      <span className="font-bold text-gray-900 uppercase block">{produto.nome}</span>
                      <span className="text-gray-500 font-mono text-[10px]">Ref: {produto.referencia} | Marca: {produto.marca}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-sm font-extrabold text-pg-red block">
                      {estoqueTotal} un.
                    </span>
                    <Link
                      to={`/admin/produtos/${produto.id}`}
                      className="text-[10px] text-pg-petrol underline font-bold hover:text-pg-red"
                    >
                      Repor Estoque →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ÚLTIMOS 10 PEDIDOS TABLE */}
      <div className="bg-white border border-gray-200 shadow-xs space-y-3 p-5">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-pg-display text-base text-gray-900 uppercase">ÚLTIMOS 10 PEDIDOS REALIZADOS</h3>
          <Link to="/admin/pedidos" className="font-pg-display text-xs text-pg-red hover:underline flex items-center space-x-1">
            <span>VER TODOS OS PEDIDOS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100 text-gray-700 uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3">Número</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">CPF</th>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Total</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">NF-e</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-body">
              {ultimos10Pedidos.map((ped) => (
                <tr key={ped.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-bold font-mono text-gray-900">{ped.numero}</td>
                  <td className="py-2.5 px-3 text-gray-800 font-medium">{ped.snapshotCliente.nomeCompleto}</td>
                  <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px]">{ped.snapshotCliente.cpf}</td>
                  <td className="py-2.5 px-3 text-gray-500">{new Date(ped.criadoEm).toLocaleDateString('pt-BR')}</td>
                  <td className="py-2.5 px-3 font-bold text-gray-900">R$ {ped.total.toFixed(2).replace('.', ',')}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                      ped.status === 'pago' ? 'bg-emerald-100 text-emerald-800' :
                      ped.status === 'aguardando_pix' ? 'bg-amber-100 text-amber-800' :
                      ped.status === 'enviado' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ped.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                      ped.nf.status === 'emitida' ? 'bg-emerald-100 text-emerald-800' :
                      ped.nf.status === 'rejeitada' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {ped.nf.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Link
                      to={`/admin/pedidos/${ped.id}`}
                      className="bg-[#082229] text-white font-pg-display text-[11px] px-2.5 py-1 hover:bg-opacity-90"
                    >
                      GERENCIAR
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
