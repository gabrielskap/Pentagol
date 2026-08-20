import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpDown,
  Box,
  CheckSquare,
  Edit,
  Filter,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { deleteRecord, getAll, upsert } from '../../lib/db';
import { Categoria, Produto, Variacao } from '../../types';

export const AdminProdutosPage: React.FC = () => {
  const { isOperador } = useAdmin();

  const [produtos, setProdutos] = useState<Produto[]>(getAll<Produto>('produtos'));
  const [variacoes, setVariacoes] = useState<Variacao[]>(getAll<Variacao>('variacoes'));
  const categorias = getAll<Categoria>('categorias');

  // Search & Filters state
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [marcaFiltro, setMarcaFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [apenasEstoqueBaixo, setApenasEstoqueBaixo] = useState(false);

  // Sorting state
  const [ordemColuna, setOrdemColuna] = useState<'nome' | 'referencia' | 'preco' | 'estoque' | 'criadoEm'>('criadoEm');
  const [ordemDirecao, setOrdemDirecao] = useState<'asc' | 'desc'>('desc');

  // Selection state for bulk actions
  const [selecionados, setSelecionados] = useState<string[]>([]);

  // Pagination state
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 10;

  const marcasUnicas = Array.from(new Set(produtos.map((p) => p.marca).filter(Boolean)));

  const refreshData = () => {
    setProdutos(getAll<Produto>('produtos'));
    setVariacoes(getAll<Variacao>('variacoes'));
  };

  const handleExcluirUnico = (id: string, nome: string) => {
    if (isOperador) {
      alert('Perfil Operador não possui permissão para excluir produtos.');
      return;
    }
    if (window.confirm(`Deseja realmente excluir o produto "${nome}"?`)) {
      deleteRecord('produtos', id);
      // Remove associated variations
      const varsRelacionadas = variacoes.filter((v) => v.produtoId === id);
      varsRelacionadas.forEach((v) => deleteRecord('variacoes', v.id));
      refreshData();
      setSelecionados((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleToggleStatus = (id: string, statusAtual: boolean) => {
    const p = produtos.find((item) => item.id === id);
    if (!p) return;
    p.ativo = !statusAtual;
    upsert('produtos', p);
    refreshData();
  };

  // Bulk actions
  const handleSelecionarTodos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelecionados(produtosFiltrados.map((p) => p.id));
    } else {
      setSelecionados([]);
    }
  };

  const handleToggleSelecionado = (id: string) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAcaoEmMassa = (acao: 'ativar' | 'desativar' | 'novidade' | 'excluir') => {
    if (selecionados.length === 0) return;

    if (acao === 'excluir') {
      if (isOperador) {
        alert('Perfil Operador não possui permissão para excluir registros.');
        return;
      }
      if (!window.confirm(`Confirma a exclusão de ${selecionados.length} produto(s) selecionado(s)?`)) {
        return;
      }
      selecionados.forEach((id) => {
        deleteRecord('produtos', id);
        const varsRel = variacoes.filter((v) => v.produtoId === id);
        varsRel.forEach((v) => deleteRecord('variacoes', v.id));
      });
      setSelecionados([]);
      refreshData();
      alert('Produtos excluídos com sucesso.');
      return;
    }

    const prodsOriginal = getAll<Produto>('produtos');
    prodsOriginal.forEach((p) => {
      if (selecionados.includes(p.id)) {
        if (acao === 'ativar') p.ativo = true;
        if (acao === 'desativar') p.ativo = false;
        if (acao === 'novidade') p.novidade = true;
        upsert('produtos', p);
      }
    });

    setSelecionados([]);
    refreshData();
    alert(`Ação em massa executada com sucesso para ${selecionados.length} produto(s).`);
  };

  // Filter pipeline
  const produtosFiltrados = produtos.filter((p) => {
    const termo = busca.toLowerCase();
    const bateBusca =
      !busca ||
      p.nome.toLowerCase().includes(termo) ||
      p.referencia.toLowerCase().includes(termo) ||
      p.marca.toLowerCase().includes(termo);

    const bateCategoria = !categoriaFiltro || p.categoriaIds.includes(categoriaFiltro);
    const bateMarca = !marcaFiltro || p.marca === marcaFiltro;
    const bateStatus =
      !statusFiltro ||
      (statusFiltro === 'ativo' ? p.ativo : !p.ativo);

    const varsDoProd = variacoes.filter((v) => v.produtoId === p.id);
    const estoqueTotal = varsDoProd.reduce((sum, v) => sum + v.estoque, 0);
    const bateEstoqueBaixo = !apenasEstoqueBaixo || estoqueTotal < 5;

    return bateBusca && bateCategoria && bateMarca && bateStatus && bateEstoqueBaixo;
  });

  // Sort pipeline
  const produtosOrdenados = [...produtosFiltrados].sort((a, b) => {
    let valA: any = a.nome;
    let valB: any = b.nome;

    if (ordemColuna === 'referencia') {
      valA = a.referencia;
      valB = b.referencia;
    } else if (ordemColuna === 'preco') {
      valA = a.precoBase;
      valB = b.precoBase;
    } else if (ordemColuna === 'estoque') {
      valA = variacoes.filter((v) => v.produtoId === a.id).reduce((s, v) => s + v.estoque, 0);
      valB = variacoes.filter((v) => v.produtoId === b.id).reduce((s, v) => s + v.estoque, 0);
    } else if (ordemColuna === 'criadoEm') {
      valA = new Date(a.criadoEm || 0).getTime();
      valB = new Date(b.criadoEm || 0).getTime();
    }

    if (valA < valB) return ordemDirecao === 'asc' ? -1 : 1;
    if (valA > valB) return ordemDirecao === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination pipeline
  const totalPaginas = Math.ceil(produtosOrdenados.length / itensPorPagina) || 1;
  const inicioIndex = (pagina - 1) * itensPorPagina;
  const produtosPaginados = produtosOrdenados.slice(inicioIndex, inicioIndex + itensPorPagina);

  const toggleSort = (coluna: typeof ordemColuna) => {
    if (ordemColuna === coluna) {
      setOrdemDirecao((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrdemColuna(coluna);
      setOrdemDirecao('asc');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="bg-white border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-pg-display text-2xl text-gray-900 uppercase">
            CATÁLOGO DE PRODUTOS E ESTOQUE
          </h1>
          <p className="text-xs text-gray-500">
            Gerencie itens, fotos, variações por numeração/cor e controle de estoque do e-commerce
          </p>
        </div>
        <Link
          to="/admin/produtos/novo"
          className="bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-xs px-4 py-2.5 shadow-xs flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>CADASTRAR NOVO PRODUTO</span>
        </Link>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white border border-gray-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          
          {/* CAMPO DE BUSCA */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome, marca ou referência (SKU)..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              className="w-full border border-gray-300 pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-pg-red font-body"
            />
          </div>

          {/* FILTRO CATEGORIA */}
          <div>
            <select
              value={categoriaFiltro}
              onChange={(e) => {
                setCategoriaFiltro(e.target.value);
                setPagina(1);
              }}
              className="w-full border border-gray-300 p-2 text-xs font-body"
            >
              <option value="">Todas as Categorias</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.tipo})
                </option>
              ))}
            </select>
          </div>

          {/* FILTRO MARCA */}
          <div>
            <select
              value={marcaFiltro}
              onChange={(e) => {
                setMarcaFiltro(e.target.value);
                setPagina(1);
              }}
              className="w-full border border-gray-300 p-2 text-xs font-body"
            >
              <option value="">Todas as Marcas</option>
              {marcasUnicas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* FILTRO STATUS */}
          <div>
            <select
              value={statusFiltro}
              onChange={(e) => {
                setStatusFiltro(e.target.value);
                setPagina(1);
              }}
              className="w-full border border-gray-300 p-2 text-xs font-body"
            >
              <option value="">Todos os Status</option>
              <option value="ativo">Somente Ativos</option>
              <option value="inativo">Somente Inativos</option>
            </select>
          </div>

        </div>

        <div className="flex items-center justify-between pt-2 border-t text-xs">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={apenasEstoqueBaixo}
              onChange={(e) => {
                setApenasEstoqueBaixo(e.target.checked);
                setPagina(1);
              }}
              className="text-pg-red focus:ring-pg-red"
            />
            <span className="font-bold text-pg-red uppercase">Exibir apenas produtos com Estoque Baixo (&lt; 5 un.)</span>
          </label>

          <span className="text-gray-500">
            Exibindo <strong>{produtosFiltrados.length}</strong> de {produtos.length} produtos
          </span>
        </div>
      </div>

      {/* BULK ACTIONS BAR */}
      {selecionados.length > 0 && (
        <div className="bg-pg-petrol text-white p-3 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 font-bold">
            <CheckSquare className="w-4 h-4 text-pg-orange" />
            <span>{selecionados.length} produto(s) selecionado(s)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleAcaoEmMassa('ativar')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 font-bold uppercase"
            >
              Ativar Selecionados
            </button>
            <button
              type="button"
              onClick={() => handleAcaoEmMassa('desativar')}
              className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 font-bold uppercase"
            >
              Desativar
            </button>
            <button
              type="button"
              onClick={() => handleAcaoEmMassa('novidade')}
              className="bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1 font-bold uppercase flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Marcar Novidade</span>
            </button>
            <button
              type="button"
              onClick={() => handleAcaoEmMassa('excluir')}
              className="bg-pg-red hover:bg-opacity-90 text-white px-2.5 py-1 font-bold uppercase flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Excluir Selecionados</span>
            </button>
          </div>
        </div>
      )}

      {/* TABELA DE PRODUTOS DENSE */}
      <div className="bg-white border border-gray-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-100 text-gray-700 uppercase font-bold border-b border-gray-200 select-none">
            <tr>
              <th className="py-3 px-3 w-8">
                <input
                  type="checkbox"
                  onChange={handleSelecionarTodos}
                  checked={
                    produtosFiltrados.length > 0 &&
                    selecionados.length === produtosFiltrados.length
                  }
                />
              </th>
              <th className="py-3 px-3 w-12">Foto</th>
              <th
                onClick={() => toggleSort('referencia')}
                className="py-3 px-3 cursor-pointer hover:text-pg-red"
              >
                <div className="flex items-center space-x-1">
                  <span>Referência / SKU</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('nome')}
                className="py-3 px-3 cursor-pointer hover:text-pg-red"
              >
                <div className="flex items-center space-x-1">
                  <span>Nome do Produto</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">Marca & Categorias</th>
              <th
                onClick={() => toggleSort('preco')}
                className="py-3 px-3 cursor-pointer hover:text-pg-red"
              >
                <div className="flex items-center space-x-1">
                  <span>Preço Base</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('estoque')}
                className="py-3 px-3 cursor-pointer hover:text-pg-red"
              >
                <div className="flex items-center space-x-1">
                  <span>Variações / Estoque</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-body">
            {produtosPaginados.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-400">
                  Nenhum produto atende aos critérios de busca selecionados.
                </td>
              </tr>
            ) : (
              produtosPaginados.map((p) => {
                const varsDoProd = variacoes.filter((v) => v.produtoId === p.id);
                const estoqueTotal = varsDoProd.reduce((sum, v) => sum + v.estoque, 0);

                const nomesCats = p.categoriaIds
                  .map((cid) => categorias.find((c) => c.id === cid)?.nome)
                  .filter(Boolean)
                  .join(', ');

                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selecionados.includes(p.id)}
                        onChange={() => handleToggleSelecionado(p.id)}
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <img
                        src={p.imagens[0]}
                        alt={p.nome}
                        className="w-9 h-9 object-contain border p-0.5 bg-white shrink-0"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{p.referencia}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-gray-900 block uppercase">{p.nome}</span>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        {p.novidade && (
                          <span className="bg-sky-100 text-sky-800 text-[9px] font-bold px-1 uppercase">
                            Novidade
                          </span>
                        )}
                        {p.destaque && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1 uppercase">
                            Destaque
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-pg-petrol block uppercase">{p.marca}</span>
                      <span className="text-[10px] text-gray-500 block truncate max-w-xs">{nomesCats}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {p.precoPromocional ? (
                        <div>
                          <span className="text-[10px] text-gray-400 line-through block">
                            R$ {p.precoBase.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="font-bold text-pg-red block">
                            R$ {p.precoPromocional.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-gray-900">
                          R$ {p.precoBase.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold block text-gray-800">{varsDoProd.length} variação(ões)</span>
                      <span
                        className={`font-mono text-[11px] font-bold ${
                          estoqueTotal < 5 ? 'text-pg-red animate-pulse' : 'text-emerald-700'
                        }`}
                      >
                        Estoque Total: {estoqueTotal} un.
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(p.id, p.ativo)}
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase transition-transform active:scale-95 cursor-pointer ${
                          p.ativo
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                        title="Clique para alternar o status (Ativo/Inativo)"
                      >
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1 shrink-0">
                      <Link
                        to={`/admin/produtos/${p.id}`}
                        className="inline-block bg-[#082229] text-white p-1.5 hover:bg-opacity-90"
                        title="Editar produto"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleExcluirUnico(p.id, p.nome)}
                        className="bg-pg-red text-white p-1.5 hover:bg-opacity-90"
                        title="Excluir produto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPaginas > 1 && (
        <div className="flex justify-between items-center bg-white p-3 border border-gray-200 text-xs font-body">
          <span className="text-gray-500">
            Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
          </span>

          <div className="flex space-x-1">
            <button
              type="button"
              disabled={pagina === 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              className="px-3 py-1 bg-gray-100 border text-gray-700 hover:bg-gray-200 disabled:opacity-40"
            >
              Anterior
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setPagina(num)}
                className={`px-3 py-1 border font-bold ${
                  pagina === num ? 'bg-pg-red text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              disabled={pagina === totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              className="px-3 py-1 bg-gray-100 border text-gray-700 hover:bg-gray-200 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
