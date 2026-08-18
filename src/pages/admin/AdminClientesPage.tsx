import React, { useState } from 'react';
import { Download, Eye, Search, UserCheck, UserX, Users } from 'lucide-react';
import { getAll, upsert } from '../../lib/db';
import { Cliente, Pedido } from '../../types';

export const AdminClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>(getAll<Cliente>('clientes'));
  const pedidos = getAll<Pedido>('pedidos');

  const [busca, setBusca] = useState('');
  const [filtroPedidos, setFiltroPedidos] = useState<'todos' | 'com_pedidos' | 'sem_pedidos'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [clienteDetalheModal, setClienteDetalheModal] = useState<Cliente | null>(null);

  const recarregarClientes = () => {
    setClientes(getAll<Cliente>('clientes'));
  };

  const getPedidosDoCliente = (clienteId: string, clienteCpf: string) => {
    return pedidos.filter(
      (p) => p.clienteId === clienteId || p.snapshotCliente?.cpf === clienteCpf
    );
  };

  const clientesFiltrados = clientes.filter((c) => {
    const pedidosCliente = getPedidosDoCliente(c.id, c.cpf);

    // Filtro por Pedidos
    if (filtroPedidos === 'com_pedidos' && pedidosCliente.length === 0) return false;
    if (filtroPedidos === 'sem_pedidos' && pedidosCliente.length > 0) return false;

    // Filtro por Status
    const isAtivo = c.ativo !== false;
    if (filtroStatus === 'ativos' && !isAtivo) return false;
    if (filtroStatus === 'inativos' && isAtivo) return false;

    // Busca por termo
    const endPrincipal = c.enderecos?.find((e) => e.principal) || c.enderecos?.[0];
    const termo = busca.toLowerCase();
    const matchBusca =
      c.nomeCompleto.toLowerCase().includes(termo) ||
      c.email.toLowerCase().includes(termo) ||
      c.cpf.includes(termo) ||
      (endPrincipal?.cidade && endPrincipal.cidade.toLowerCase().includes(termo)) ||
      (endPrincipal?.uf && endPrincipal.uf.toLowerCase().includes(termo));

    return matchBusca;
  });

  const handleToggleAtivo = (c: Cliente) => {
    const isAtivo = c.ativo !== false;
    const atualizado = { ...c, ativo: !isAtivo };
    upsert('clientes', atualizado);
    recarregarClientes();
  };

  const handleExportarCSV = () => {
    if (clientesFiltrados.length === 0) {
      alert('Nenhum cliente para exportar.');
      return;
    }

    const headers = [
      'Nome Completo',
      'E-mail',
      'CPF',
      'Telefone',
      'Cidade',
      'UF',
      'Nº de Pedidos',
      'Total Gasto (R$)',
      'Data de Cadastro',
      'Status',
    ];

    const rows = clientesFiltrados.map((c) => {
      const pCliente = getPedidosDoCliente(c.id, c.cpf);
      const totalGasto = pCliente
        .filter((p) => p.status === 'pago' || p.status === 'enviado' || p.status === 'entregue')
        .reduce((acc, p) => acc + p.total, 0);
      const end = c.enderecos?.find((e) => e.principal) || c.enderecos?.[0];

      return [
        `"${c.nomeCompleto}"`,
        c.email,
        c.cpf,
        c.telefone,
        end?.cidade || '',
        end?.uf || '',
        pCliente.length,
        totalGasto.toFixed(2),
        new Date(c.criadoEm).toLocaleDateString('pt-BR'),
        c.ativo !== false ? 'Ativo' : 'Inativo',
      ];
    });

    const csvContent =
      '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `base_clientes_pentagol_${Date.now()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 font-body">
      {/* HEADER */}
      <div className="bg-white border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-pg-display text-2xl text-gray-900 uppercase">
            BASE DE CLIENTES & COMPRADORES
          </h1>
          <p className="text-xs text-gray-500">
            Acompanhe o cadastro de clientes, histórico de compras e gerencie o acesso à loja
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportarCSV}
          className="bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display text-xs px-4 py-2 flex items-center space-x-1.5 shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>EXPORTAR BASE CSV</span>
        </button>
      </div>

      {/* PAINEL DE FILTROS */}
      <div className="bg-white border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar cliente por nome, e-mail, CPF ou cidade/UF..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 focus:outline-none focus:border-pg-red font-body"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center space-x-1.5">
            <label className="font-bold text-gray-700 whitespace-nowrap">Compras:</label>
            <select
              value={filtroPedidos}
              onChange={(e) => setFiltroPedidos(e.target.value as any)}
              className="border border-gray-300 p-2 font-body"
            >
              <option value="todos">Todos</option>
              <option value="com_pedidos">Com pedidos efetuados</option>
              <option value="sem_pedidos">Sem pedidos (Apenas cadastro)</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <label className="font-bold text-gray-700 whitespace-nowrap">Status:</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as any)}
              className="border border-gray-300 p-2 font-body"
            >
              <option value="todos">Todos</option>
              <option value="ativos">Apenas Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABELA DE CLIENTES */}
      <div className="bg-white border border-gray-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-100 text-gray-700 uppercase font-bold border-b border-gray-200">
            <tr>
              <th className="py-3 px-4">Nome Completo</th>
              <th className="py-3 px-4">E-mail</th>
              <th className="py-3 px-4">CPF</th>
              <th className="py-3 px-4">Telefone</th>
              <th className="py-3 px-4">Cidade / UF</th>
              <th className="py-3 px-4 text-center">Pedidos</th>
              <th className="py-3 px-4 text-right">Total Gasto</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-body">
            {clientesFiltrados.map((c) => {
              const pCliente = getPedidosDoCliente(c.id, c.cpf);
              const totalGasto = pCliente
                .filter((p) => p.status === 'pago' || p.status === 'enviado' || p.status === 'entregue')
                .reduce((acc, p) => acc + p.total, 0);
              const endPrincipal = c.enderecos?.find((e) => e.principal) || c.enderecos?.[0];
              const isAtivo = c.ativo !== false;

              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-bold text-gray-900 uppercase">
                    {c.nomeCompleto}
                  </td>
                  <td className="py-3 px-4 text-gray-700">{c.email}</td>
                  <td className="py-3 px-4 font-mono font-bold text-gray-800">{c.cpf}</td>
                  <td className="py-3 px-4 text-gray-700">{c.telefone}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {endPrincipal ? `${endPrincipal.cidade} / ${endPrincipal.uf}` : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold">
                    <span className="bg-gray-100 border px-2 py-0.5">{pCliente.length}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-800 font-mono">
                    R$ {totalGasto.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                        isAtivo
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {isAtivo ? 'Ativo' : 'Bloqueado'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      title="Ver Histórico e Endereços"
                      onClick={() => setClienteDetalheModal(c)}
                      className="bg-sky-50 text-sky-800 border border-sky-300 p-1.5 hover:bg-sky-100"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleAtivo(c)}
                      className={`px-2 py-1 text-[10px] font-pg-display uppercase font-bold border ${
                        isAtivo
                          ? 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      {isAtivo ? 'BLOQUEAR' : 'DESBLOQUEAR'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {clientesFiltrados.length === 0 && (
          <div className="p-8 text-center text-gray-500 font-body">
            Nenhum cliente localizado com os filtros selecionados.
          </div>
        )}
      </div>

      {/* MODAL DETALHES DO CLIENTE */}
      {clienteDetalheModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full p-6 space-y-4 shadow-2xl border">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h3 className="font-pg-display text-lg text-gray-900 uppercase">
                  {clienteDetalheModal.nomeCompleto}
                </h3>
                <p className="text-xs text-gray-500">
                  CPF: <span className="font-mono font-bold">{clienteDetalheModal.cpf}</span> |
                  Cadastrado em:{' '}
                  {new Date(clienteDetalheModal.criadoEm).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setClienteDetalheModal(null)}
                className="text-gray-500 font-bold hover:text-black text-sm"
              >
                ✕
              </button>
            </div>

            {/* ENDEREÇOS */}
            <div className="space-y-2 text-xs">
              <h4 className="font-pg-display text-sm text-gray-800 border-b pb-1 uppercase font-bold">
                ENDEREÇOS CADASTRADOS
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {clienteDetalheModal.enderecos?.map((end, idx) => (
                  <div key={idx} className="bg-gray-50 p-2.5 border text-[11px] space-y-0.5">
                    <p className="font-bold text-gray-900">
                      {end.apelido || 'Endereço'} {end.principal ? '(Principal)' : ''}
                    </p>
                    <p>
                      {end.rua}, {end.numero} {end.complemento}
                    </p>
                    <p>
                      {end.bairro} - {end.cidade}/{end.uf}
                    </p>
                    <p className="font-mono text-gray-600">CEP: {end.cep}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* HISTÓRICO DE PEDIDOS */}
            <div className="space-y-2 text-xs">
              <h4 className="font-pg-display text-sm text-gray-800 border-b pb-1 uppercase font-bold">
                HISTÓRICO DE PEDIDOS REALIZADOS
              </h4>

              {getPedidosDoCliente(clienteDetalheModal.id, clienteDetalheModal.cpf).length === 0 ? (
                <p className="text-gray-400 italic">Nenhum pedido efetuado ainda por este cliente.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y border">
                  {getPedidosDoCliente(clienteDetalheModal.id, clienteDetalheModal.cpf).map((p) => (
                    <div key={p.id} className="p-2 flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <span className="font-mono font-bold text-gray-900">#{p.numero}</span>
                        <span className="text-[10px] text-gray-500 block">
                          {new Date(p.criadoEm).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-pg-red block">
                          R$ {p.total.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-gray-700">
                          {p.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-right pt-2 border-t">
              <button
                type="button"
                onClick={() => setClienteDetalheModal(null)}
                className="bg-pg-petrol text-white font-pg-display text-xs px-4 py-2"
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
