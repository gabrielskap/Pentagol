import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  FileText,
  Image,
  Layout,
  Plus,
  Trash2,
} from 'lucide-react';
import { deleteRecord, getAll, upsert } from '../../lib/db';
import { Banner, BlocoHome, PaginaInstitucional } from '../../types';

export const AdminVitrinePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'banners' | 'blocos' | 'institucionais'>('banners');

  // Banners state
  const [banners, setBanners] = useState<Banner[]>(getAll<Banner>('banners'));
  const [tituloBanner, setTituloBanner] = useState('');
  const [subtituloBanner, setSubtituloBanner] = useState('');
  const [textoBotao, setTextoBotao] = useState('VER PRODUTOS');
  const [corDestaque, setCorDestaque] = useState('#CC0000');
  const [imagemUrl, setImagemUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('/categoria/futebol');
  const [posicaoBanner, setPosicaoBanner] = useState<
    'hero' | 'promo_1' | 'promo_2' | 'promo_3' | 'faixa_inferior'
  >('hero');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [previewBannerModal, setPreviewBannerModal] = useState<Banner | null>(null);

  // Blocos Home state
  const [blocos, setBlocos] = useState<BlocoHome[]>(getAll<BlocoHome>('blocos_home'));

  // Páginas Institucionais state
  const [paginas, setPaginas] = useState<PaginaInstitucional[]>(
    getAll<PaginaInstitucional>('paginas_institucionais')
  );
  const [tituloPagina, setTituloPagina] = useState('');
  const [slugPagina, setSlugPagina] = useState('');
  const [conteudoPagina, setConteudoPagina] = useState('');
  const [exibirNoRodaPe, setExibirNoRodaPe] = useState(true);

  const recarregarBanners = () => setBanners(getAll<Banner>('banners'));
  const recarregarBlocos = () => setBlocos(getAll<BlocoHome>('blocos_home'));
  const recarregarPaginas = () =>
    setPaginas(getAll<PaginaInstitucional>('paginas_institucionais'));

  // Image Upload helper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCadastrarBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloBanner || !imagemUrl) {
      alert('Preencha o título e selecione ou informe a imagem.');
      return;
    }

    const novoBanner: Banner = {
      id: `banner-${Date.now()}`,
      titulo: tituloBanner,
      subtitulo: subtituloBanner,
      textoBotao,
      corDestaque,
      imagemUrl,
      linkUrl,
      posicao: posicaoBanner,
      ordem: banners.length + 1,
      ativo: true,
      dataInicio: dataInicio ? new Date(dataInicio).toISOString() : undefined,
      dataFim: dataFim ? new Date(dataFim).toISOString() : undefined,
    };

    upsert('banners', novoBanner);
    recarregarBanners();

    // Reset
    setTituloBanner('');
    setSubtituloBanner('');
    setImagemUrl('');
    alert('Banner salvo com sucesso!');
  };

  const handleMoverOrdemBanner = (index: number, direcao: 'cima' | 'baixo') => {
    const copy = [...banners];
    const targetIndex = direcao === 'cima' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= copy.length) return;

    const temp = copy[index].ordem;
    copy[index].ordem = copy[targetIndex].ordem;
    copy[targetIndex].ordem = temp;

    upsert('banners', copy[index]);
    upsert('banners', copy[targetIndex]);
    recarregarBanners();
  };

  const handleToggleAtivoBanner = (b: Banner) => {
    upsert('banners', { ...b, ativo: !b.ativo });
    recarregarBanners();
  };

  const handleExcluirBanner = (id: string) => {
    if (window.confirm('Excluir este banner?')) {
      deleteRecord('banners', id);
      recarregarBanners();
    }
  };

  // Blocos Home Actions
  const handleToggleBloco = (bloco: BlocoHome) => {
    upsert('blocos_home', { ...bloco, ativo: !bloco.ativo });
    recarregarBlocos();
  };

  const handleMoverBloco = (index: number, direcao: 'cima' | 'baixo') => {
    const copy = [...blocos];
    const targetIndex = direcao === 'cima' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= copy.length) return;

    const temp = copy[index].ordem;
    copy[index].ordem = copy[targetIndex].ordem;
    copy[targetIndex].ordem = temp;

    upsert('blocos_home', copy[index]);
    upsert('blocos_home', copy[targetIndex]);
    recarregarBlocos();
  };

  // Institutional Pages Actions
  const handleCadastrarPagina = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloPagina || !conteudoPagina) {
      alert('Preencha o título e o conteúdo da página.');
      return;
    }

    const slug =
      slugPagina ||
      tituloPagina
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-');

    const novaPagina: PaginaInstitucional = {
      id: `pag-${Date.now()}`,
      titulo: tituloPagina,
      slug,
      conteudo: conteudoPagina,
      exibirNoRodaPe,
      ordem: paginas.length + 1,
    };

    upsert('paginas_institucionais', novaPagina);
    recarregarPaginas();

    setTituloPagina('');
    setSlugPagina('');
    setConteudoPagina('');
    alert('Página institucional cadastrada!');
  };

  const handleExcluirPagina = (id: string) => {
    if (window.confirm('Excluir esta página institucional?')) {
      deleteRecord('paginas_institucionais', id);
      recarregarPaginas();
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* HEADER */}
      <div className="bg-white border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-pg-display text-2xl text-gray-900 uppercase">
            VITRINE & CMS DA LOJA PÚBLICA
          </h1>
          <p className="text-xs text-gray-500">
            Gerencie banners do carrossel, seções da Home e páginas institucionais em tempo real
          </p>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display text-xs px-4 py-2 inline-flex items-center space-x-1.5 shadow-xs"
        >
          <Eye className="w-4 h-4" />
          <span>PRÉ-VISUALIZAR SITE AO VIVO</span>
        </a>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => setActiveTab('banners')}
          className={`px-5 py-3 font-pg-display text-xs uppercase font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'banners'
              ? 'border-pg-red text-pg-red bg-gray-50'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>Banners & Carrossel ({banners.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('blocos')}
          className={`px-5 py-3 font-pg-display text-xs uppercase font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'blocos'
              ? 'border-pg-red text-pg-red bg-gray-50'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>Blocos & Vitrines da Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('institucionais')}
          className={`px-5 py-3 font-pg-display text-xs uppercase font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'institucionais'
              ? 'border-pg-red text-pg-red bg-gray-50'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Páginas Institucionais ({paginas.length})</span>
        </button>
      </div>

      {/* TAB 1: BANNERS & CARROSSEL */}
      {activeTab === 'banners' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORM NOVO BANNER */}
          <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-4">
            <h3 className="font-pg-display text-base text-gray-800 border-b pb-2 uppercase">
              NOVO BANNER DE VITRINE
            </h3>

            <form onSubmit={handleCadastrarBanner} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Título do Banner *</label>
                <input
                  type="text"
                  required
                  value={tituloBanner}
                  onChange={(e) => setTituloBanner(e.target.value)}
                  placeholder="Ex: CHUTEIRAS DE COURO FINTA"
                  className="w-full border border-gray-300 p-2 font-body focus:outline-none focus:border-pg-red"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Subtítulo / Chamada</label>
                <input
                  type="text"
                  value={subtituloBanner}
                  onChange={(e) => setSubtituloBanner(e.target.value)}
                  placeholder="Ex: Alta performance para o seu futebol"
                  className="w-full border border-gray-300 p-2 font-body"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Texto do Botão</label>
                  <input
                    type="text"
                    value={textoBotao}
                    onChange={(e) => setTextoBotao(e.target.value)}
                    className="w-full border border-gray-300 p-2 font-body"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Cor Destaque</label>
                  <input
                    type="color"
                    value={corDestaque}
                    onChange={(e) => setCorDestaque(e.target.value)}
                    className="w-full h-9 border border-gray-300 cursor-pointer p-0.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Posição na Página *</label>
                <select
                  value={posicaoBanner}
                  onChange={(e) => setPosicaoBanner(e.target.value as any)}
                  className="w-full border border-gray-300 p-2 font-body"
                >
                  <option value="hero">Hero Top Banner (Carrossel Principal)</option>
                  <option value="promo_1">Bloco Promocional 1</option>
                  <option value="promo_2">Bloco Promocional 2</option>
                  <option value="promo_3">Bloco Promocional 3</option>
                  <option value="faixa_inferior">Faixa Inferior Rodapé</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Imagem do Banner *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-xs text-gray-500 mb-1"
                />
                <input
                  type="text"
                  value={imagemUrl}
                  onChange={(e) => setImagemUrl(e.target.value)}
                  placeholder="Ou cole a URL da imagem (https://...)"
                  className="w-full border border-gray-300 p-2 font-body"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Link de Destino</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="/categoria/futebol"
                  className="w-full border border-gray-300 p-2 font-body"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Início Exibição</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full border border-gray-300 p-2 font-body"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Fim Exibição</label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full border border-gray-300 p-2 font-body"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-xs py-2.5 px-3 shadow flex items-center justify-center space-x-1 uppercase"
              >
                <Plus className="w-4 h-4" />
                <span>SALVAR BANNER</span>
              </button>
            </form>
          </div>

          {/* LISTAGEM DE BANNERS CADASTRADOS */}
          <div className="lg:col-span-2 bg-white border border-gray-200 p-5 shadow-xs overflow-x-auto space-y-3">
            <h3 className="font-pg-display text-base text-gray-800 border-b pb-3 uppercase">
              BANNERS ATIVOS NA LOJA ({banners.length})
            </h3>

            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 text-gray-700 uppercase font-bold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Imagem</th>
                  <th className="py-2.5 px-3">Título / Subtítulo</th>
                  <th className="py-2.5 px-3">Posição</th>
                  <th className="py-2.5 px-3">Ordem</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-body">
                {banners
                  .sort((a, b) => a.ordem - b.ordem)
                  .map((b, idx) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3">
                        <img
                          src={b.imagemUrl}
                          alt={b.titulo}
                          className="w-16 h-10 object-cover border bg-gray-100"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-gray-900 block uppercase">
                          {b.titulo}
                        </span>
                        {b.subtitulo && (
                          <span className="text-[10px] text-gray-500 block truncate max-w-xs">
                            {b.subtitulo}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-pg-petrol uppercase">
                        {b.posicao}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <div className="flex items-center space-x-1">
                          <span>#{b.ordem}</span>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => handleMoverOrdemBanner(idx, 'cima')}
                              disabled={idx === 0}
                              className="text-gray-500 hover:text-black disabled:opacity-30"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoverOrdemBanner(idx, 'baixo')}
                              disabled={idx === banners.length - 1}
                              className="text-gray-500 hover:text-black disabled:opacity-30"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                            b.ativo
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {b.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          title="Pré-visualizar Banner"
                          onClick={() => setPreviewBannerModal(b)}
                          className="bg-sky-50 text-sky-800 border border-sky-300 p-1 hover:bg-sky-100"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleAtivoBanner(b)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] font-bold font-pg-display px-2 py-1 uppercase border"
                        >
                          {b.ativo ? 'PAUSAR' : 'ATIVAR'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExcluirBanner(b.id)}
                          className="bg-pg-red text-white p-1 hover:bg-opacity-90"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BLOCOS DA HOME */}
      {activeTab === 'blocos' && (
        <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-4">
          <h3 className="font-pg-display text-base text-gray-800 border-b pb-3 uppercase">
            ESTRUTURA E REORDENAÇÃO DA PÁGINA INICIAL (HOME)
          </h3>

          <div className="divide-y divide-gray-200">
            {blocos
              .sort((a, b) => a.ordem - b.ordem)
              .map((bloco, idx) => (
                <div
                  key={bloco.id}
                  className="py-3 flex items-center justify-between hover:bg-gray-50 px-2"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-gray-400">
                      #{bloco.ordem}
                    </span>
                    <div>
                      <h4 className="font-pg-display text-sm text-gray-900 uppercase">
                        {bloco.titulo}
                      </h4>
                      <span className="text-[11px] text-gray-500 font-mono">
                        Tipo: {bloco.tipo}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => handleMoverBloco(idx, 'cima')}
                        disabled={idx === 0}
                        className="bg-gray-100 p-1 border text-gray-600 hover:bg-gray-200 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoverBloco(idx, 'baixo')}
                        disabled={idx === blocos.length - 1}
                        className="bg-gray-100 p-1 border text-gray-600 hover:bg-gray-200 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleBloco(bloco)}
                      className={`px-3 py-1 text-xs font-pg-display font-bold uppercase ${
                        bloco.ativo
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                      }`}
                    >
                      {bloco.ativo ? 'EXIBIDO' : 'OCULTO'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: PÁGINAS INSTITUCIONAIS */}
      {activeTab === 'institucionais' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-4">
            <h3 className="font-pg-display text-base text-gray-800 border-b pb-2 uppercase">
              CADASTRAR PÁGINA INSTITUCIONAL
            </h3>

            <form onSubmit={handleCadastrarPagina} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Título da Página *</label>
                <input
                  type="text"
                  required
                  value={tituloPagina}
                  onChange={(e) => setTituloPagina(e.target.value)}
                  placeholder="Ex: Trocas e Devoluções"
                  className="w-full border border-gray-300 p-2 font-body"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Slug (URL)</label>
                <input
                  type="text"
                  value={slugPagina}
                  onChange={(e) => setSlugPagina(e.target.value)}
                  placeholder="trocas-e-devolucoes"
                  className="w-full border border-gray-300 p-2 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Conteúdo da Página *</label>
                <textarea
                  rows={6}
                  required
                  value={conteudoPagina}
                  onChange={(e) => setConteudoPagina(e.target.value)}
                  placeholder="Digite aqui o texto institucional..."
                  className="w-full border border-gray-300 p-2 font-body text-xs"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rodape"
                  checked={exibirNoRodaPe}
                  onChange={(e) => setExibirNoRodaPe(e.target.checked)}
                  className="w-4 h-4 text-pg-red rounded-none cursor-pointer"
                />
                <label htmlFor="rodape" className="text-xs text-gray-700 cursor-pointer">
                  Exibir link no rodapé da loja pública
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-xs py-2.5 px-3 shadow flex items-center justify-center space-x-1 uppercase"
              >
                <Plus className="w-4 h-4" />
                <span>SALVAR PÁGINA</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white border border-gray-200 p-5 shadow-xs">
            <h3 className="font-pg-display text-base text-gray-800 border-b pb-3 uppercase mb-3">
              PÁGINAS CADASTRADAS ({paginas.length})
            </h3>

            <div className="divide-y divide-gray-200">
              {paginas.map((pag) => (
                <div key={pag.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-pg-display text-sm text-gray-900 uppercase font-bold">
                      {pag.titulo}
                    </h4>
                    <p className="text-gray-500 font-mono text-[11px]">/institucional/{pag.slug}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <a
                      href={`/#/institucional/${pag.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-gray-100 border p-1.5 text-gray-700 hover:bg-gray-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleExcluirPagina(pag.id)}
                      className="bg-pg-red text-white p-1.5 hover:bg-opacity-90"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BANNER PREVIEW MODAL */}
      {previewBannerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full p-5 space-y-4 shadow-2xl border">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-pg-display text-base text-gray-900 uppercase">
                PRÉ-VISUALIZAÇÃO DO BANNER ({previewBannerModal.posicao})
              </h3>
              <button
                type="button"
                onClick={() => setPreviewBannerModal(null)}
                className="text-gray-500 font-bold hover:text-black text-sm"
              >
                ✕
              </button>
            </div>

            <div className="relative overflow-hidden aspect-21/9 border bg-gray-900 flex items-center justify-center text-white p-6">
              <img
                src={previewBannerModal.imagemUrl}
                alt={previewBannerModal.titulo}
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />
              <div className="relative z-10 text-center space-y-2">
                <h2 className="font-pg-display text-2xl uppercase tracking-wider">
                  {previewBannerModal.titulo}
                </h2>
                {previewBannerModal.subtitulo && (
                  <p className="text-xs text-gray-200">{previewBannerModal.subtitulo}</p>
                )}
                <span
                  style={{ backgroundColor: previewBannerModal.corDestaque || '#CC0000' }}
                  className="inline-block px-4 py-1.5 font-pg-display text-xs text-white uppercase tracking-wider shadow-md font-bold"
                >
                  {previewBannerModal.textoBotao || 'VER AGORA'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setPreviewBannerModal(null)}
                className="bg-pg-petrol text-white font-pg-display text-xs px-4 py-2"
              >
                FECHAR PRÉ-VISUALIZAÇÃO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
