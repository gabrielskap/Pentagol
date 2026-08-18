import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useStoreConfig } from '../../contexts/StoreConfigContext';
import { getAll, upsert } from '../../lib/db';
import { useMeta } from '../../lib/meta';
import { cepService, freteService } from '../../services';
import { CarrinhoItem, Frete, Produto, Variacao } from '../../types';

export const ProdutoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { config } = useStoreConfig();
  const { adicionarItem, itens, subtotal, quantidadeTotalItens } = useCart();

  // Product and Variations
  const produto = getAll<Produto>('produtos').find((p) => p.id === id);
  const variacoes = getAll<Variacao>('variacoes').filter((v) => v.produtoId === id && v.ativo);

  useMeta({
    title: produto ? produto.nome : 'Produto não encontrado',
    description: produto ? produto.descricao : undefined,
    ogTitle: produto ? `${produto.nome} - PENTAGOL Esportes` : undefined,
    ogDescription: produto ? produto.descricao : undefined,
    ogImage: produto?.imagens[0],
    ogPriceAmount: produto ? produto.precoBase : undefined,
    ogPriceCurrency: 'BRL',
  });

  const jsonLdData = produto
    ? {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: produto.nome,
        image: produto.imagens,
        description: produto.descricao,
        sku: produto.referencia,
        brand: {
          '@type': 'Brand',
          name: produto.marca,
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'BRL',
          price: produto.precoBase.toFixed(2),
          itemCondition: 'https://schema.org/NewCondition',
          availability: 'https://schema.org/InStock',
        },
      }
    : null;


  // URL pre-selected variation
  const varParam = searchParams.get('var') || searchParams.get('sku') || '';

  // Single variation product check
  const isSingleVariation =
    variacoes.length === 1 &&
    (!variacoes[0].tamanho || variacoes[0].tamanho === 'Único' || variacoes.length === 1);

  // Selected variation state
  const [variacaoSelecionada, setVariacaoSelecionada] = useState<Variacao | null>(() => {
    if (varParam) {
      const matched = variacoes.find(
        (v) =>
          v.id === varParam || v.sku.toLowerCase().trim() === varParam.toLowerCase().trim()
      );
      if (matched) return matched;
    }
    if (isSingleVariation && variacoes.length > 0) {
      return variacoes[0];
    }
    return null;
  });

  // Keep URL synced with selection
  useEffect(() => {
    if (varParam && variacoes.length > 0) {
      const matched = variacoes.find(
        (v) =>
          v.id === varParam || v.sku.toLowerCase().trim() === varParam.toLowerCase().trim()
      );
      if (matched) {
        setVariacaoSelecionada(matched);
      }
    } else if (isSingleVariation && variacoes.length > 0) {
      setVariacaoSelecionada(variacoes[0]);
    }
  }, [varParam, variacoes, isSingleVariation]);

  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Touch Swipe state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Quantity state
  const [quantidade, setQuantidade] = useState(1);

  // Validation Error State
  const [sizeError, setSizeError] = useState<string | null>(null);
  const sizeSelectorRef = useRef<HTMLDivElement>(null);

  // Restock Notice Modal State ("Avise-me quando chegar")
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockVariation, setRestockVariation] = useState<Variacao | null>(null);
  const [restockContact, setRestockContact] = useState('');
  const [restockSuccess, setRestockSuccess] = useState(false);

  // Shipping Calculation state
  const [cepCalculo, setCepCalculo] = useState('');
  const [opcoesFrete, setOpcoesFrete] = useState<Frete[]>([]);
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [erroFrete, setErroFrete] = useState<string | null>(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'descricao' | 'especificacoes' | 'trocas'>('descricao');

  // Mini-cart Drawer State
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CarrinhoItem | null>(null);

  if (!produto) {
    return (
      <div className="bg-white p-12 text-center border border-gray-200 my-8 space-y-4">
        <h2 className="font-pg-display text-2xl text-pg-red font-bold">PRODUTO NÃO ENCONTRADO</h2>
        <p className="text-xs text-gray-500">
          O produto solicitado não está disponível ou foi removido do catálogo.
        </p>
        <Link
          to="/"
          className="inline-block bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display text-xs py-2.5 px-6 uppercase font-bold"
        >
          Voltar para a Home
        </Link>
      </div>
    );
  }

  // Calculate final price
  const precoFinal = produto.precoBase + (variacaoSelecionada?.precoAdicional || 0);

  // Handle Desktop Zoom Lens
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  // Touch Swipe Handlers for Mobile Gallery
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swipe left -> next image
        setSelectedImageIndex((prev) => (prev + 1) % produto.imagens.length);
      } else {
        // Swipe right -> prev image
        setSelectedImageIndex((prev) => (prev - 1 + produto.imagens.length) % produto.imagens.length);
      }
    }
    setTouchStartX(null);
  };

  // Size Selection Handler
  const handleSelectVariation = (v: Variacao) => {
    if (v.estoque <= 0) {
      // Out of stock -> open restock notice modal
      setRestockVariation(v);
      setRestockSuccess(false);
      setRestockModalOpen(true);
      return;
    }
    setVariacaoSelecionada(v);
    setSizeError(null);

    // Reset quantity if exceeds selected variation stock
    if (quantidade > v.estoque) {
      setQuantidade(1);
    }
  };

  // ADD TO CART HANDLER WITH MANDATORY VALIDATION
  const handleAddToCart = () => {
    // 1. Mandatory Scope Rule: Must validate that a variation is selected
    if (!variacaoSelecionada) {
      setSizeError('Selecione um tamanho para continuar');
      if (sizeSelectorRef.current) {
        sizeSelectorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus first available size button if available
        const firstBtn = sizeSelectorRef.current.querySelector('button') as HTMLButtonElement | null;
        if (firstBtn) firstBtn.focus();
      }
      return;
    }

    // 2. Validate quantity doesn't exceed stock
    const maxQty = Math.max(1, variacaoSelecionada.estoque);
    const qtyToAdd = Math.min(quantidade, maxQty);

    const itemToAdd: CarrinhoItem = {
      variacaoId: variacaoSelecionada.id,
      produtoId: produto.id,
      nome: produto.nome,
      sku: variacaoSelecionada.sku,
      tamanho: variacaoSelecionada.tamanho,
      cor: variacaoSelecionada.cor,
      imagem: produto.imagens[0],
      precoUnit: precoFinal,
      quantidade: qtyToAdd,
      pesoKg: produto.pesoKg,
      dimensoes: {
        alturaCm: produto.alturaCm,
        larguraCm: produto.larguraCm,
        comprimentoCm: produto.comprimentoCm,
      },
    };

    // Add to cart state
    adicionarItem(itemToAdd);
    setLastAddedItem(itemToAdd);

    // Open slide-over mini-cart drawer without page reload or alert
    setMiniCartOpen(true);
  };

  // Restock Notice Submission
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockContact.trim()) return;

    // Save intention log in database
    upsert('logs', {
      id: `log-aviso-${Date.now()}`,
      tipo: 'aviso_estoque',
      detalhes: `Solicitação de aviso para "${restockContact}" sobre produto "${produto.nome}" (Ref: ${produto.referencia}, Tam: ${restockVariation?.tamanho || restockVariation?.sku})`,
      sucesso: true,
      criadoEm: new Date().toISOString(),
    });

    setRestockSuccess(true);
    setTimeout(() => {
      setRestockModalOpen(false);
      setRestockContact('');
      setRestockSuccess(false);
    }, 2500);
  };

  // CEP Masking Utility
  const handleCepInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.substring(0, 8);
    if (val.length > 5) {
      val = `${val.substring(0, 5)}-${val.substring(5)}`;
    }
    setCepCalculo(val);
  };

  // Calculate Shipping Handler
  const handleSimularFrete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroFrete(null);
    setOpcoesFrete([]);

    const cleanCep = cepCalculo.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setErroFrete('Digite um CEP válido com 8 dígitos.');
      return;
    }

    setCalculandoFrete(true);
    try {
      // Query CEP info and calculate shipping
      await cepService.consultarCep(cleanCep);
      const fretes = await freteService.calcularFrete(
        cleanCep,
        produto.pesoKg * quantidade,
        precoFinal * quantidade
      );
      setOpcoesFrete(fretes);
    } catch (err: any) {
      setErroFrete(err.message || 'Não foi possível calcular o frete para este CEP.');
    } finally {
      setCalculandoFrete(false);
    }
  };

  // Related products from same modality/category
  const produtosRelacionados = getAll<Produto>('produtos')
    .filter(
      (p) =>
        p.id !== produto.id &&
        p.ativo &&
        (p.modalidades.some((m) => produto.modalidades.includes(m)) ||
          p.categoriaIds.some((c) => produto.categoriaIds.includes(c)))
    )
    .slice(0, 4);

  // WhatsApp Pre-filled message
  const whatsappPhone = config.whatsapp.replace(/\D/g, '');
  const whatsappMessage = `Olá! Gostaria de comprar o produto: ${produto.nome} (Ref: ${
    produto.referencia
  }${
    variacaoSelecionada?.tamanho
      ? `, Tamanho: ${variacaoSelecionada.tamanho}`
      : ''
  }) no valor de R$ ${precoFinal.toFixed(2).replace('.', ',')}. Podem me ajudar?`;

  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <div className="space-y-8 pb-12 font-body select-none">
      {jsonLdData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      )}
      {/* BREADCRUMB */}
      <nav className="text-xs text-gray-500 flex items-center space-x-1.5 flex-wrap">
        <Link to="/" className="hover:text-pg-red font-medium">
          Home
        </Link>
        <span>/</span>
        <Link to="/categoria/produtos" className="hover:text-pg-red font-medium">
          Produtos
        </Link>
        <span>/</span>
        <span className="text-gray-400">{produto.marca}</span>
        <span>/</span>
        <span className="text-pg-ink font-bold truncate max-w-[200px] sm:max-w-xs">
          {produto.nome}
        </span>
      </nav>

      {/* MAIN CONTAINER: LEFT GALLERY + RIGHT PURCHASE BLOCK */}
      <div className="bg-white border border-gray-200 p-4 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: GALLERY (7 COLS ON DESKTOP) */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row gap-4">
            {/* THUMBNAILS LIST (Vertical on Desktop / Horizontal on Mobile) */}
            <div className="order-2 sm:order-1 flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto max-h-[460px] shrink-0 pb-2 sm:pb-0">
              {produto.imagens.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 border-2 p-1 transition-all overflow-hidden shrink-0 ${
                    selectedImageIndex === index
                      ? 'border-pg-red shadow-xs'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${produto.nome} - Foto ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>

            {/* MAIN DISPLAY IMAGE WITH DESKTOP ZOOM & MOBILE TOUCH SWIPE */}
            <div className="order-1 sm:order-2 flex-1 relative bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center p-4 min-h-[320px] sm:min-h-[440px]">
              {/* DESKTOP HOVER ZOOM CONTAINER */}
              <div
                className="relative w-full h-full flex items-center justify-center cursor-zoom-in"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={produto.imagens[selectedImageIndex] || produto.imagens[0]}
                  alt={produto.nome}
                  className={`max-h-[400px] max-w-full object-contain transition-transform duration-100 ${
                    isZoomed ? 'opacity-0 lg:opacity-0' : 'opacity-100'
                  }`}
                />

                {/* ZOOM LENS MAGNIFIER ON HOVER (DESKTOP ONLY) */}
                {isZoomed && (
                  <div
                    className="hidden lg:block absolute inset-0 pointer-events-none bg-no-repeat bg-gray-50 z-20"
                    style={{
                      backgroundImage: `url(${produto.imagens[selectedImageIndex] || produto.imagens[0]})`,
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      backgroundSize: '250%',
                    }}
                  />
                )}
              </div>

              {/* BADGES TOP LEFT */}
              <div className="absolute top-3 left-3 flex flex-col space-y-1 z-10">
                {produto.novidade && (
                  <span className="bg-pg-orange text-white font-pg-display text-[11px] font-bold italic uppercase px-2 py-0.5 tracking-wider shadow-xs">
                    NOVO
                  </span>
                )}
                {produto.destaque && (
                  <span className="bg-pg-petrol text-white font-pg-display text-[11px] font-bold uppercase px-2 py-0.5 tracking-wider shadow-xs">
                    DESTAQUE
                  </span>
                )}
              </div>

              {/* GALLERY NAVIGATION ARROWS (MOBILE / TOUCH) */}
              {produto.imagens.length > 1 && (
                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-10 lg:hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImageIndex(
                        (prev) => (prev - 1 + produto.imagens.length) % produto.imagens.length
                      )
                    }
                    className="pointer-events-auto bg-black/40 text-white p-2 rounded-full hover:bg-black/70"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImageIndex((prev) => (prev + 1) % produto.imagens.length)
                    }
                    className="pointer-events-auto bg-black/40 text-white p-2 rounded-full hover:bg-black/70"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: BRAND, TITLE, PRICE, VARIATIONS, CART CTA (5 COLS ON DESKTOP) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-bold text-pg-petrol uppercase tracking-widest block mb-1">
                {produto.marca}
              </span>
              <h1 className="font-pg-display font-bold italic uppercase text-[28px] sm:text-[30px] leading-tight text-pg-ink">
                {produto.nome}
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-1">
                Ref: <span className="font-bold text-gray-800">{produto.referencia}</span>
              </p>
            </div>

            {/* PRICE BLOCK */}
            <div className="bg-gray-50 border border-gray-200 p-4 space-y-1">
              <div className="flex items-baseline space-x-3 flex-wrap">
                <span className="font-body text-3xl font-extrabold text-pg-red">
                  R$ {precoFinal.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-xs font-bold bg-pg-yellow text-pg-ink px-2 py-0.5 uppercase">
                  5% OFF no PIX
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                À vista no PIX com despacho imediato via ERP SupraSoft
              </p>
            </div>

            {/* VARIATIONS / SIZE SELECTOR (ONLY SHOWN IF MULTIPLE VARIATIONS EXIST) */}
            {!isSingleVariation && (
              <div
                ref={sizeSelectorRef}
                className={`p-3 border transition-colors space-y-2.5 ${
                  sizeError ? 'border-2 border-pg-red bg-red-50/40' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="font-pg-display text-xs font-bold uppercase text-gray-800">
                    Selecione o Tamanho: <span className="text-pg-red">*</span>
                  </label>
                  {variacaoSelecionada && (
                    <span className="text-xs font-mono text-gray-500 font-bold">
                      Estoque: {variacaoSelecionada.estoque} un.
                    </span>
                  )}
                </div>

                {sizeError && (
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-pg-red animate-pulse">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{sizeError}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {variacoes.map((v) => {
                    const isSelected = variacaoSelecionada?.id === v.id;
                    const semEstoque = v.estoque <= 0;

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectVariation(v)}
                        className={`px-3.5 py-2 text-xs font-mono font-bold border transition-all ${
                          isSelected
                            ? 'bg-pg-red text-white border-pg-red shadow-xs'
                            : semEstoque
                            ? 'bg-gray-100 text-gray-400 border-gray-200 line-through cursor-pointer hover:bg-red-100 hover:text-pg-red hover:border-pg-red'
                            : 'bg-white text-gray-800 border-gray-300 hover:border-pg-red'
                        }`}
                        title={semEstoque ? 'Sem estoque - Clique para ser avisado' : undefined}
                      >
                        {v.tamanho || v.sku}
                        {v.precoAdicional > 0 && ` (+R$ ${v.precoAdicional})`}
                      </button>
                    );
                  })}
                </div>

                {variacoes.some((v) => v.estoque <= 0) && (
                  <p className="text-[10px] text-gray-500 italic">
                    Tamanhos riscados estão esgotados. Clique no tamanho para receber um aviso no WhatsApp quando chegar!
                  </p>
                )}
              </div>
            )}

            {/* QUANTITY SELECTOR & ADD TO CART BUTTON */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-3">
                <div className="flex items-center border border-gray-300 bg-white">
                  <button
                    type="button"
                    disabled={quantidade <= 1}
                    onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 font-bold text-sm disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-xs font-bold font-mono w-10 text-center">
                    {quantidade}
                  </span>
                  <button
                    type="button"
                    disabled={
                      variacaoSelecionada
                        ? quantidade >= variacaoSelecionada.estoque
                        : false
                    }
                    onClick={() => setQuantidade((q) => q + 1)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 font-bold text-sm disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                {/* ADD TO CART BUTTON */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-sm font-bold uppercase py-3.5 px-6 shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>ADICIONAR AO CARRINHO</span>
                </button>
              </div>

              {/* BUY VIA WHATSAPP LINK */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-pg-display text-xs font-bold uppercase py-2.5 px-4 flex items-center justify-center space-x-2 transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Comprar pelo WhatsApp</span>
              </a>
            </div>

            {/* FRETE CONSULTATION IN PRODUCT PAGE */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <label htmlFor="cep-input" className="font-pg-display text-xs text-gray-800 font-bold uppercase flex items-center space-x-1.5">
                <Truck className="w-4 h-4 text-pg-petrol" />
                <span>Calcular Frete e Prazo de Entrega:</span>
              </label>

              <form onSubmit={handleSimularFrete} className="flex space-x-2 max-w-sm">
                <input
                  id="cep-input"
                  type="text"
                  placeholder="00000-000"
                  value={cepCalculo}
                  onChange={handleCepInput}
                  maxLength={9}
                  className="w-full bg-white border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:border-pg-red font-mono"
                />
                <button
                  type="submit"
                  disabled={calculandoFrete}
                  className="bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display text-xs uppercase font-bold px-4 py-1.5 whitespace-nowrap shrink-0"
                >
                  {calculandoFrete ? 'CALCULANDO...' : 'CALCULAR'}
                </button>
              </form>

              {erroFrete && (
                <p className="text-xs text-pg-red font-medium">{erroFrete}</p>
              )}

              {opcoesFrete.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {opcoesFrete.map((f) => (
                    <div
                      key={f.servico}
                      className="text-xs bg-gray-50 border border-gray-200 p-2.5 flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800">{f.transportadora}</span>
                        <span className="text-[11px] text-gray-500">
                          Entrega em até {f.prazoDias} dia(s) úteis
                        </span>
                      </div>
                      <span className="font-body text-sm font-bold text-pg-red">
                        {f.valor === 0 ? 'FRETE GRÁTIS' : `R$ ${f.valor.toFixed(2).replace('.', ',')}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STORE ASSURANCES */}
            <div className="border-t border-gray-200 pt-4 grid grid-cols-2 gap-3 text-[11px] text-gray-600 font-medium">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Produto 100% Original PENTAGOL</span>
              </div>
              <div className="flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-pg-red shrink-0" />
                <span>Desconto automático no PIX</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* LOWER TABS: DESCRIÇÃO, ESPECIFICAÇÕES, TROCAS E DEVOLUÇÕES */}
      <div className="bg-white border border-gray-200 p-4 sm:p-8 shadow-xs space-y-6">
        {/* TABS HEADER BUTTONS */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('descricao')}
            className={`font-pg-display text-sm uppercase font-bold py-3 px-6 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'descricao'
                ? 'border-pg-red text-pg-red bg-gray-50'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Descrição do Produto
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('especificacoes')}
            className={`font-pg-display text-sm uppercase font-bold py-3 px-6 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'especificacoes'
                ? 'border-pg-red text-pg-red bg-gray-50'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Especificações Técnicas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trocas')}
            className={`font-pg-display text-sm uppercase font-bold py-3 px-6 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'trocas'
                ? 'border-pg-red text-pg-red bg-gray-50'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Trocas e Devoluções
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="text-xs text-gray-700 leading-relaxed font-body">
          {activeTab === 'descricao' && (
            <div className="space-y-3 max-w-4xl">
              <p className="text-sm text-gray-800 leading-relaxed">
                {produto.descricao}
              </p>
              <p className="text-xs text-gray-500">
                Garantia de fabricação de fábrica e suporte especializado diretamente na nossa loja física de Belo Horizonte / MG.
              </p>
            </div>
          )}

          {activeTab === 'especificacoes' && (
            <div className="max-w-2xl border border-gray-200">
              <table className="w-full text-left divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-100">
                  <tr className="bg-gray-50">
                    <td className="p-3 font-bold uppercase text-gray-600 w-1/3">Marca</td>
                    <td className="p-3 font-medium text-gray-800">{produto.marca}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold uppercase text-gray-600">Referência (SKU Pai)</td>
                    <td className="p-3 font-mono font-medium text-gray-800">{produto.referencia}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 font-bold uppercase text-gray-600">Peso Bruto</td>
                    <td className="p-3 font-medium text-gray-800">{produto.pesoKg} kg</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold uppercase text-gray-600">Dimensões (A x L x C)</td>
                    <td className="p-3 font-medium text-gray-800">
                      {produto.alturaCm}cm x {produto.larguraCm}cm x {produto.comprimentoCm}cm
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 font-bold uppercase text-gray-600">Modalidades</td>
                    <td className="p-3 font-medium text-gray-800">
                      {produto.modalidades.join(', ') || 'Multiesporte'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'trocas' && (
            <div className="space-y-3 max-w-3xl">
              <h3 className="font-pg-display text-sm font-bold uppercase text-pg-ink">
                Política de Troca e Devolução PENTAGOL
              </h3>
              <p>
                Visando garantir a total satisfação de nossos clientes, a PENTAGOL Esportes possui uma política transparente de trocas e devoluções em conformidade com o Código de Defesa do Consumidor:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Direito de Arrependimento:</strong> Você tem até 7 (sete) dias corridos a partir da data de recebimento para solicitar a devolução sem qualquer custo.
                </li>
                <li>
                  <strong>Defeito de Fabricação:</strong> Garantia legal de 90 dias contra defeitos de fabricação em artigos esportivos e calçados.
                </li>
                <li>
                  <strong>Condições do Produto:</strong> O item deve ser devolvido em sua embalagem original, acompanhado de etiquetas e da Nota Fiscal Eletrônica (NF-e).
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* "PRODUTOS RELACIONADOS" SECTION */}
      {produtosRelacionados.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-pg-red pb-2">
            <h2 className="font-pg-display font-bold italic uppercase text-xl text-pg-ink tracking-wide">
              PRODUTOS RELACIONADOS
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {produtosRelacionados.map((rel) => (
              <Link
                key={rel.id}
                to={`/produto/${rel.id}`}
                className="bg-white border border-gray-200 p-3 flex flex-col justify-between hover:border-pg-red transition-all group shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="aspect-square bg-gray-50 mb-3 overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={rel.imagens[0]}
                      alt={rel.nome}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">
                    {rel.marca}
                  </span>
                  <h3 className="font-pg-display text-xs sm:text-sm text-gray-800 line-clamp-2 uppercase mb-2 group-hover:text-pg-red transition-colors font-bold">
                    {rel.nome}
                  </h3>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="font-body text-sm font-bold text-pg-red">
                    R$ {rel.precoBase.toFixed(2).replace('.', ',')}
                  </p>
                  <span className="text-[10px] text-gray-500">no PIX</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* RESTOCK NOTICE MODAL ("AVISE-ME QUANDO CHEGAR") */}
      {restockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full border-2 border-pg-red shadow-2xl p-6 relative space-y-4">
            <button
              type="button"
              onClick={() => setRestockModalOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-pg-red">
              <Bell className="w-6 h-6" />
              <h3 className="font-pg-display text-lg uppercase font-bold">
                AVISE-ME QUANDO CHEGAR
              </h3>
            </div>

            <p className="text-xs text-gray-600">
              O tamanho <span className="font-bold text-gray-900">{restockVariation?.tamanho || restockVariation?.sku}</span> do produto <span className="font-bold text-gray-900">{produto.nome}</span> está temporariamente esgotado. Informe seu e-mail ou WhatsApp para avisarmos assim que houver reposição!
            </p>

            {restockSuccess ? (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs p-3 font-bold text-center">
                Solicitação registrada com sucesso! Avisaremos você em breve.
              </div>
            ) : (
              <form onSubmit={handleRestockSubmit} className="space-y-3">
                <div>
                  <label htmlFor="restock-contact" className="text-[11px] font-bold text-gray-700 uppercase block mb-1">
                    Seu E-mail ou WhatsApp:
                  </label>
                  <input
                    id="restock-contact"
                    type="text"
                    required
                    placeholder="email@exemplo.com ou (31) 99999-9999"
                    value={restockContact}
                    onChange={(e) => setRestockContact(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-xs focus:border-pg-red focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-pg-red hover:bg-opacity-90 text-white font-pg-display text-xs py-3 uppercase font-bold transition-colors shadow-xs"
                >
                  Registar Interesse de Reposição
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MINI-CART SLIDE-OVER DRAWER */}
      {miniCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div>
              <div className="bg-pg-red text-white p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-pg-yellow" />
                  <span className="font-pg-display text-sm uppercase font-bold tracking-wide">
                    PRODUTO ADICIONADO AO CARRINHO
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMiniCartOpen(false)}
                  className="p-1 hover:bg-white/20 rounded text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Just Added Item Box */}
              {lastAddedItem && (
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex space-x-3 items-center">
                  <img
                    src={lastAddedItem.imagem}
                    alt={lastAddedItem.nome}
                    className="w-16 h-16 object-contain bg-white border border-gray-200 p-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-pg-display text-xs font-bold text-gray-900 truncate uppercase">
                      {lastAddedItem.nome}
                    </p>
                    {lastAddedItem.tamanho && (
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        Tamanho: <span className="font-bold text-gray-800">{lastAddedItem.tamanho}</span>
                      </p>
                    )}
                    <p className="text-[11px] text-gray-500">
                      Qtd: <span className="font-bold">{lastAddedItem.quantidade}</span> x R${' '}
                      {lastAddedItem.precoUnit.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-body text-sm font-extrabold text-pg-red">
                      R$ {(lastAddedItem.precoUnit * lastAddedItem.quantidade).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              )}

              {/* Current Cart Summary */}
              <div className="p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center text-gray-600 font-medium">
                  <span>Itens no Carrinho ({quantidadeTotalItens}):</span>
                  <span className="font-bold text-gray-800">
                    {itens.length} produto(s)
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold border-t border-gray-100 pt-2">
                  <span>Subtotal:</span>
                  <span className="font-body text-lg font-bold text-pg-red">
                    R$ {subtotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>

            {/* Drawer Action Footer: 2 Required Buttons */}
            <div className="p-4 bg-white border-t border-gray-200 space-y-2">
              <button
                type="button"
                onClick={() => setMiniCartOpen(false)}
                className="w-full bg-white hover:bg-gray-100 text-pg-petrol border-2 border-pg-petrol font-pg-display text-xs py-3 uppercase font-bold transition-colors"
              >
                Continuar Comprando
              </button>
              <button
                type="button"
                onClick={() => {
                  setMiniCartOpen(false);
                  navigate('/carrinho');
                }}
                className="w-full bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-xs py-3.5 uppercase font-bold shadow-md transition-colors flex items-center justify-center space-x-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Finalizar Compra</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
