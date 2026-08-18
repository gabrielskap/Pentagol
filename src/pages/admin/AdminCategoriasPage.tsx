import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  FolderTree,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { deleteRecord, getAll, upsert } from '../../lib/db';
import { Categoria, Produto } from '../../types';

export const AdminCategoriasPage: React.FC = () => {
  const { isOperador } = useAdmin();

  const [categorias, setCategorias] = useState<Categoria[]>(getAll<Categoria>('categorias'));
  const produtos = getAll<Produto>('produtos');

  // Form state
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [slug, setSlug] = useState('');
  const [tipo, setTipo] = useState<'modalidade' | 'publico' | 'linha'>('modalidade');
  const [exibirNaSidebarHome, setExibirNaSidebarHome] = useState(true);
  const [exibirNoMegaMenuEsportes, setExibirNoMegaMenuEsportes] = useState(true);
  const [ativo, setAtivo] = useState(true);

  // Modal reassignment state for deletion
  const [modalExclusaoOpen, setModalExclusaoOpen] = useState(false);
  const [catParaExcluir, setCatParaExcluir] = useState<Categoria | null>(null);
  const [catDestinoReatribuir, setCatDestinoReatribuir] = useState<string>('');

  const refreshCategorias = () => {
    setCategorias(getAll<Categoria>('categorias'));
  };

  const handleNomeChange = (val: string) => {
    setNome(val);
    if (!editandoId) {
      const generatedSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSalvarCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const catId = editandoId || `cat-${Date.now()}`;
    const ordemAtual = editandoId
      ? categorias.find((c) => c.id === editandoId)?.ordem || 1
      : categorias.length + 1;

    const novaCat: Categoria = {
      id: catId,
      nome: nome.trim(),
      slug:
        slug.trim() ||
        nome
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, ''),
      tipo,
      ordem: ordemAtual,
      ativo,
      exibirNaSidebarHome,
      exibirNoMegaMenuEsportes,
    };

    upsert('categorias', novaCat);
    refreshCategorias();

    // Reset Form
    setEditandoId(null);
    setNome('');
    setSlug('');
    setTipo('modalidade');
    setExibirNaSidebarHome(true);
    setExibirNoMegaMenuEsportes(true);
    setAtivo(true);
  };

  const handleEditar = (cat: Categoria) => {
    setEditandoId(cat.id);
    setNome(cat.nome);
    setSlug(cat.slug);
    setTipo(cat.tipo);
    setExibirNaSidebarHome(cat.exibirNaSidebarHome ?? true);
    setExibirNoMegaMenuEsportes(cat.exibirNoMegaMenuEsportes ?? true);
    setAtivo(cat.ativo);
  };

  const handleMoverOrdem = (index: number, direcao: 'sober' | 'descer') => {
    const arr = [...categorias];
    const targetIdx = direcao === 'sober' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= arr.length) return;

    const temp = arr[index].ordem;
    arr[index].ordem = arr[targetIdx].ordem;
    arr[targetIdx].ordem = temp;

    upsert('categorias', arr[index]);
    upsert('categorias', arr[targetIdx]);
    refreshCategorias();
  };

  const handleIniciarExclusao = (cat: Categoria) => {
    if (isOperador) {
      alert('Perfil Operador não possui permissão para excluir categorias.');
      return;
    }

    const prodsVinculados = produtos.filter((p) => p.categoriaIds.includes(cat.id));
    if (prodsVinculados.length > 0) {
      setCatParaExcluir(cat);
      setModalExclusaoOpen(true);
    } else {
      if (window.confirm(`Deseja realmente excluir a categoria "${cat.nome}"?`)) {
        deleteRecord('categorias', cat.id);
        refreshCategorias();
      }
    }
  };

  const handleConfirmarReatribuicaoExclusao = () => {
    if (!catParaExcluir) return;

    if (catDestinoReatribuir) {
      // Reassign products to selected category
      const prodsToUpdate = getAll<Produto>('produtos');
      prodsToUpdate.forEach((p) => {
        if (p.categoriaIds.includes(catParaExcluir.id)) {
          p.categoriaIds = p.categoriaIds.filter((cid) => cid !== catParaExcluir.id);
          if (!p.categoriaIds.includes(catDestinoReatribuir)) {
            p.categoriaIds.push(catDestinoReatribuir);
          }
          upsert('produtos', p);
        }
      });
    }

    deleteRecord('categorias', catParaExcluir.id);
    refreshCategorias();
    setModalExclusaoOpen(false);
    setCatParaExcluir(null);
    setCatDestinoReatribuir('');
    alert('Categoria excluída e produtos reatribuídos com sucesso.');
  };

  const categoriasOrdenadas = [...categorias].sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="bg-white border border-gray-200 p-5 shadow-xs">
        <h1 className="font-pg-display text-2xl text-gray-900 uppercase">
          ÁRVORE DE CATEGORIAS E MODALIDADES
        </h1>
        <p className="text-xs text-gray-500">
          Gerencie o menu da loja pública, ordem de exibição, tipos e visibilidade na Home/Mega Menu
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* FORMULÁRIO DE CADASTRAR / EDITAR */}
        <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-4 h-fit">
          <h3 className="font-pg-display text-base text-gray-900 border-b pb-2 uppercase">
            {editandoId ? 'EDITAR CATEGORIA' : 'CADASTRAR NOVA CATEGORIA'}
          </h3>

          <form onSubmit={handleSalvarCategoria} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Nome da Categoria *</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                placeholder="Ex: Futebol de Campo, Basquete, Natacao..."
                className="w-full border border-gray-300 p-2 font-body"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Slug da URL *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Ex: futebol-de-campo"
                className="w-full border border-gray-300 p-2 font-mono uppercase"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Tipo de Categoria *</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full border border-gray-300 p-2 font-body"
              >
                <option value="modalidade">Modalidade Esportiva (ex: Futebol, Vôlei)</option>
                <option value="publico">Público Alvo (ex: Masculino, Feminino, Infantil)</option>
                <option value="linha">Linha / Equipamento (ex: Calçados, Vestuário)</option>
              </select>
            </div>

            <div className="bg-gray-50 p-3 border space-y-2 font-bold text-gray-800">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exibirNaSidebarHome}
                  onChange={(e) => setExibirNaSidebarHome(e.target.checked)}
                  className="text-pg-red focus:ring-pg-red"
                />
                <span>Exibir na Sidebar da Home</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exibirNoMegaMenuEsportes}
                  onChange={(e) => setExibirNoMegaMenuEsportes(e.target.checked)}
                  className="text-pg-red focus:ring-pg-red"
                />
                <span>Exibir no Mega-Menu "ESPORTES"</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="text-pg-red focus:ring-pg-red"
                />
                <span>Categoria Ativa</span>
              </label>
            </div>

            <div className="flex space-x-2 pt-2">
              {editandoId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditandoId(null);
                    setNome('');
                    setSlug('');
                  }}
                  className="w-1/3 bg-gray-200 text-gray-800 font-pg-display py-2"
                >
                  CANCELAR
                </button>
              )}
              <button
                type="submit"
                className="flex-1 bg-pg-red hover:bg-opacity-95 text-white font-pg-display py-2.5 shadow-xs flex items-center justify-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>{editandoId ? 'ATUALIZAR' : 'SALVAR CATEGORIA'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* LISTA / TABELA DE CATEGORIAS */}
        <div className="md:col-span-2 bg-white border border-gray-200 shadow-xs overflow-x-auto p-5">
          <h3 className="font-pg-display text-base text-gray-900 border-b pb-3 uppercase mb-3">
            CATEGORIAS CADASTRADAS ({categorias.length})
          </h3>

          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100 text-gray-700 uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3 w-12">Ordem</th>
                <th className="py-2.5 px-3">Nome</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Produtos</th>
                <th className="py-2.5 px-3">Visibilidade</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-body">
              {categoriasOrdenadas.map((c, idx) => {
                const qtdProdutos = produtos.filter((p) => p.categoriaIds.includes(c.id)).length;

                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-700">
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleMoverOrdem(idx, 'sober')}
                          disabled={idx === 0}
                          className="p-0.5 border hover:bg-gray-200 disabled:opacity-20"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoverOrdem(idx, 'descer')}
                          disabled={idx === categoriasOrdenadas.length - 1}
                          className="p-0.5 border hover:bg-gray-200 disabled:opacity-20"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <span className="ml-1">{c.ordem}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-gray-900 uppercase block">{c.nome}</span>
                      <span className="font-mono text-gray-400 text-[10px]">{c.slug}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold uppercase text-gray-700">
                      <span className="bg-gray-100 px-2 py-0.5 border">{c.tipo}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-gray-900 font-mono">
                      {qtdProdutos} produto(s)
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="space-y-0.5 text-[10px]">
                        {c.exibirNaSidebarHome && (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 block w-fit">
                            Sidebar Home
                          </span>
                        )}
                        {c.exibirNoMegaMenuEsportes && (
                          <span className="bg-sky-100 text-sky-800 font-bold px-1.5 py-0.2 block w-fit">
                            Mega-Menu
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleEditar(c)}
                        className="bg-[#082229] text-white p-1 hover:bg-opacity-90"
                        title="Editar"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleIniciarExclusao(c)}
                        className="bg-pg-red text-white p-1 hover:bg-opacity-90"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL REATRIBUIÇÃO DE PRODUTOS PARA EXCLUSÃO DA CATEGORIA */}
      {modalExclusaoOpen && catParaExcluir && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-pg-red max-w-md w-full p-6 shadow-2xl space-y-4 text-xs font-body">
            <h3 className="font-pg-display text-lg text-pg-red uppercase border-b pb-2">
              BLOQUEIO DE EXCLUSÃO DE CATEGORIA
            </h3>

            <p className="text-gray-800 font-bold">
              A categoria <span className="text-pg-red font-mono uppercase">{catParaExcluir.nome}</span> possui{' '}
              {produtos.filter((p) => p.categoriaIds.includes(catParaExcluir.id)).length} produto(s) vinculado(s).
            </p>

            <p className="text-gray-600">
              Selecione uma nova categoria de destino para reatribuir automaticamente estes produtos antes de confirmar a exclusão:
            </p>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Categoria de Destino:</label>
              <select
                value={catDestinoReatribuir}
                onChange={(e) => setCatDestinoReatribuir(e.target.value)}
                className="w-full border border-gray-300 p-2 font-body"
              >
                <option value="">Sem reatribuição (Remover vinculo apenas)</option>
                {categorias
                  .filter((c) => c.id !== catParaExcluir.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.tipo})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setModalExclusaoOpen(false);
                  setCatParaExcluir(null);
                }}
                className="bg-gray-200 text-gray-800 font-pg-display px-4 py-2"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleConfirmarReatribuicaoExclusao}
                className="bg-pg-red text-white font-pg-display px-4 py-2 hover:bg-opacity-95"
              >
                CONFIRMAR E EXCLUIR
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
