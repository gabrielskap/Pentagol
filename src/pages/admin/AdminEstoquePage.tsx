import React, { useState } from 'react';
import { AlertTriangle, ArrowUpDown, Box, Check, RefreshCw, Save, Search } from 'lucide-react';
import { getAll, upsert } from '../../lib/db';
import { Categoria, Produto, Variacao } from '../../types';

export const AdminEstoquePage: React.FC = () => {
  const [produtos] = useState<Produto[]>(getAll<Produto>('produtos'));
  const [variacoes, setVariacoes] = useState<Variacao[]>(getAll<Variacao>('variacoes'));
  const categorias = getAll<Categoria>('categorias');

  // Filters State
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [apenasEstoqueBaixo, setApenasEstoqueBaixo] = useState(false);

  // Local changes map for unsubmitted edits: { [variacaoId: string]: number }
  const [estoquesAlterados, setEstoquesAlterados] = useState<Record<string, number>>({});
  const [salvando, setSalvando] = useState(false);
  const [feedbackSucesso, setFeedbackSucesso] = useState('');

  const refreshData = () => {
    setVariacoes(getAll<Variacao>('variacoes'));
    setEstoquesAlterados({});
  };

  const handleStockInputChange = (variacaoId: string, val: number) => {
    const valFinal = Math.max(0, val);
    setEstoquesAlterados((prev) => ({
      ...prev,
      [variacaoId]: valFinal,
    }));
  };

  const handleSalvarEstoque = () => {
    const ids = Object.keys(estoquesAlterados);
    if (ids.length === 0) return;

    setSalvando(true);
    const todasVars = getAll<Variacao>('variacoes');

    ids.forEach((id) => {
      const v = todasVars.find((item) => item.id === id);
      if (v) {
        v.estoque = estoquesAlterados[id];
        upsert('variacoes', v);
      }
    });

    setSalvando(false);
    setFeedbackSucesso(`${ids.length} item(ns) de estoque atualizado(s) com sucesso!`);
    refreshData();
    setTimeout(() => setFeedbackSucesso(''), 3500);
  };

  // Build flattened list of variation items with parent product info
  const itensGrade = variacoes.map((v) => {
    const parent = produtos.find((p) => p.id === v.produtoId);
    return {
      variacao: v,
      produto: parent,
      estoqueAtual: estoquesAlterados[v.id] !== undefined ? estoquesAlterados[v.id] : v.estoque,
      modificado: estoquesAlterados[v.id] !== undefined && estoquesAlterados[v.id] !== v.estoque,
    };
  });

  const itensFiltrados = itensGrade.filter((item) => {
    if (!item.produto) return false;
    const termo = busca.toLowerCase();
    const bateBusca =
      !busca ||
      item.produto.nome.toLowerCase().includes(termo) ||
      item.produto.referencia.toLowerCase().includes(termo) ||
      item.variacao.sku.toLowerCase().includes(termo) ||
      (item.variacao.tamanho && item.variacao.tamanho.toLowerCase().includes(termo)) ||
      (item.variacao.cor && item.variacao.cor.toLowerCase().includes(termo));

    const bateCategoria =
      !categoriaFiltro || item.produto.categoriaIds.includes(categoriaFiltro);

    const bateEstoqueBaixo = !apenasEstoqueBaixo || item.estoqueAtual < 5;

    return bateBusca && bateCategoria && bateEstoqueBaixo;
  });

  const totalModificados = Object.keys(estoquesAlterados).length;
  const totalItensCriticos = itensGrade.filter((i) => i.estoqueAtual < 5).length;

  return (
    <div className="space-y-6 font-body">
      {/* HEADER */}
      <div className="bg-white border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-pg-display text-2xl text-gray-900 uppercase flex items-center space-x-2">
            <Box className="w-6 h-6 text-pg-petrol" />
            <span>CONTROLE RÁPIDO DE ESTOQUE POR VARIAÇÃO / SKU</span>
          </h1>
          <p className="text-xs text-gray-500">
            Gerencie e atualize a quantidade física de cada variação de produto em lote
          </p>
        </div>

        {totalModificados > 0 && (
          <button
            type="button"
            disabled={salvando}
            onClick={handleSalvarEstoque}
            className="bg-pg-red hover:bg-opacity-90 text-white font-pg-display text-xs px-5 py-2.5 shadow-md flex items-center space-x-2 animate-bounce"
          >
            <Save className="w-4 h-4" />
            <span>SALVAR {totalModificados} ALTERAÇÃO(ÕES)</span>
          </button>
        )}
      </div>

      {feedbackSucesso && (
        <div className="bg-emerald-100 border-2 border-emerald-400 text-emerald-900 p-3 text-xs font-bold flex items-center space-x-2 animate-pulse">
          <Check className="w-5 h-5 text-emerald-700" />
          <span>{feedbackSucesso}</span>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="bg-white border border-gray-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por SKU da variação, SKU pai, nome do produto ou tamanho..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full border border-gray-300 pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-pg-red"
            />
          </div>

          <div>
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="w-full border border-gray-300 p-2 text-xs"
            >
              <option value="">Todas as Categorias</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.tipo})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 border-t text-xs gap-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={apenasEstoqueBaixo}
              onChange={(e) => setApenasEstoqueBaixo(e.target.checked)}
              className="text-pg-red focus:ring-pg-red"
            />
            <span className="font-bold text-pg-red uppercase flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Filtrar apenas Estoque Baixo (&lt; 5 un. - Total: {totalItensCriticos})</span>
            </span>
          </label>

          <span className="text-gray-500">
            Exibindo <strong>{itensFiltrados.length}</strong> variações cadastradas
          </span>
        </div>
      </div>

      {/* STOCK TABLE */}
      <div className="bg-white border border-gray-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs font-body">
          <thead className="bg-gray-100 text-gray-700 uppercase font-bold border-b border-gray-200">
            <tr>
              <th className="py-3 px-3 w-12">Foto</th>
              <th className="py-3 px-3">SKU Variação</th>
              <th className="py-3 px-3">Produto Pai</th>
              <th className="py-3 px-3">Tamanho / Cor</th>
              <th className="py-3 px-3">Preço Unit.</th>
              <th className="py-3 px-3 text-center">Estoque Físico (Unidades)</th>
              <th className="py-3 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {itensFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  Nenhum registro atende aos filtros informados.
                </td>
              </tr>
            ) : (
              itensFiltrados.map(({ variacao, produto, estoqueAtual, modificado }) => {
                if (!produto) return null;
                const precoFinal =
                  (produto.precoPromocional ?? produto.precoBase) + (variacao.precoAdicional || 0);

                const eBaixo = estoqueAtual < 5;

                return (
                  <tr
                    key={variacao.id}
                    className={`transition-colors ${
                      modificado ? 'bg-amber-50' : eBaixo ? 'bg-red-50/60' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <img
                        src={produto.imagens[0]}
                        alt={produto.nome}
                        className="w-9 h-9 object-contain border p-0.5 bg-white"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                      {variacao.sku}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-gray-900 block uppercase">{produto.nome}</span>
                      <span className="text-[10px] text-gray-500 font-mono">Ref: {produto.referencia}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-pg-petrol uppercase">
                        {variacao.tamanho || 'U'}
                      </span>
                      {variacao.cor && (
                        <span className="text-[10px] text-gray-500 block">{variacao.cor}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                      R$ {precoFinal.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleStockInputChange(variacao.id, estoqueAtual - 1)}
                          className="w-7 h-7 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold border rounded-xs"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={estoqueAtual}
                          onChange={(e) =>
                            handleStockInputChange(variacao.id, parseInt(e.target.value) || 0)
                          }
                          className={`w-16 text-center border p-1 font-mono font-bold text-xs ${
                            modificado
                              ? 'border-amber-500 bg-amber-100 text-amber-900'
                              : eBaixo
                              ? 'border-pg-red text-pg-red font-extrabold'
                              : 'border-gray-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => handleStockInputChange(variacao.id, estoqueAtual + 1)}
                          className="w-7 h-7 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold border rounded-xs"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                          estoqueAtual === 0
                            ? 'bg-red-100 text-red-900 border border-red-300'
                            : eBaixo
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {estoqueAtual === 0
                          ? 'Esgotado'
                          : eBaixo
                          ? 'Estoque Baixo'
                          : 'Normal'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
