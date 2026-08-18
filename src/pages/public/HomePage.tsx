import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, ShoppingCart } from 'lucide-react';
import { getAll } from '../../lib/db';
import { Banner, Categoria, Produto } from '../../types';

export const HomePage: React.FC = () => {
  // State from DB
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  // Hero carousel state
  const [heroIndex, setHeroIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch swipe state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Load DB data on mount & listen for db updates
  useEffect(() => {
    const loadData = () => {
      const bList = getAll<Banner>('banners').filter((b) => b.ativo);
      bList.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      setBanners(bList);

      const cList = getAll<Categoria>('categorias').filter((c) => c.ativo);
      cList.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      setCategorias(cList);

      const pList = getAll<Produto>('produtos').filter((p) => p.ativo);
      setProdutos(pList);
    };

    loadData();

    const handleDbUpdate = () => loadData();
    window.addEventListener('pentagol:db-updated', handleDbUpdate);
    return () => window.removeEventListener('pentagol:db-updated', handleDbUpdate);
  }, []);

  // Hero banners filter
  const heroBanners = banners.filter((b) => b.posicao === 'hero');

  // Check prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // Autoplay 6s for Hero Carousel
  useEffect(() => {
    if (heroBanners.length <= 1 || isPaused || prefersReducedMotion) return;

    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroBanners.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [heroBanners.length, isPaused, prefersReducedMotion]);

  // Touch handlers for swipe on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swipe Left -> Next
      setHeroIndex((prev) => (prev + 1) % heroBanners.length);
    } else if (distance < -minSwipeDistance) {
      // Swipe Right -> Prev
      setHeroIndex((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Promo Banners (posicao promo_1, promo_2, promo_3)
  const promoBanners = banners
    .filter((b) => b.posicao.startsWith('promo_'))
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  // Faixa Inferior Banners
  const faixaInferiorBanners = banners
    .filter((b) => b.posicao === 'faixa_inferior')
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  // Modalidades for Left Column
  const modalidades = categorias.filter((c) => c.tipo === 'modalidade');

  // Novidades Vitrine (6 products with novidade = true)
  const novidades = produtos.filter((p) => p.novidade).slice(0, 6);

  const currentHero = heroBanners[heroIndex] || heroBanners[0];

  return (
    <div className="space-y-8">
      {/* 1. CARROSSEL HERO */}
      {heroBanners.length > 0 && currentHero && (
        <div
          className="relative bg-[#F4F6F8] border border-gray-300 shadow-md overflow-hidden rounded-none group max-w-[1200px] mx-auto w-full"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Hexagon SVG Background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hexagons" width="28" height="49" patternUnits="userSpaceOnUse">
                  <path
                    d="M14 0 L28 8 L28 24 L14 32 L0 24 L0 8 Z M14 49 L28 41 L28 25 L14 17 L0 25 L0 41 Z"
                    fill="none"
                    stroke="#1C2B36"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hexagons)" />
            </svg>
          </div>

          {/* Slide Content: Image on Left, Text Block on Right */}
          <div className="relative z-10 min-h-[320px] sm:min-h-[400px] lg:min-h-[460px] flex flex-col md:flex-row items-center justify-between">
            {/* Image Column */}
            <div className="w-full md:w-1/2 h-[220px] sm:h-[300px] md:h-[460px] relative overflow-hidden bg-gray-900 shrink-0">
              <img
                src={currentHero.imagemUrl}
                alt={currentHero.titulo}
                className="w-full h-full object-cover object-center transition-all duration-700 transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Text Block Column */}
            <div className="w-full md:w-1/2 p-6 sm:p-8 lg:p-12 flex flex-col justify-center items-start text-left bg-white/90 md:bg-transparent backdrop-blur-xs">
              <div className="mb-2">
                <span className="bg-pg-yellow text-pg-ink font-pg-display font-bold italic uppercase text-xs sm:text-sm px-3 py-1 tracking-wider inline-block shadow-xs">
                  DESTAQUE PENTAGOL
                </span>
              </div>

              <h2 className="font-pg-display font-bold italic uppercase text-2xl sm:text-3xl lg:text-4xl text-pg-ink leading-tight mb-3 tracking-wide">
                {currentHero.titulo}
              </h2>

              <p className="font-body text-xs sm:text-sm text-gray-700 mb-6 max-w-md leading-relaxed">
                A melhor seleção de artigos esportivos em Belo Horizonte/MG. Qualidade garantida com frete rápido e pagamento facilitado via Pix.
              </p>

              <Link
                to={currentHero.linkUrl || '/categoria/futebol'}
                className="bg-pg-orange hover:bg-opacity-95 text-white font-pg-display font-bold uppercase text-xs sm:text-sm px-7 py-3 transition-colors shadow-md inline-flex items-center space-x-2 focus-visible:ring-2 focus-visible:ring-pg-yellow"
              >
                <span>CONFIRA AGORA</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Navigation Arrows (Square pg.petrol buttons at lower sides) */}
          {heroBanners.length > 1 && (
            <div className="absolute bottom-12 right-4 sm:right-6 z-20 flex space-x-2">
              <button
                type="button"
                onClick={() =>
                  setHeroIndex((prev) => (prev - 1 + heroBanners.length) % heroBanners.length)
                }
                className="w-9 h-9 bg-pg-petrol hover:bg-pg-petrol/90 text-white flex items-center justify-center transition-colors shadow-md focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Slide anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setHeroIndex((prev) => (prev + 1) % heroBanners.length)}
                className="w-9 h-9 bg-pg-petrol hover:bg-pg-petrol/90 text-white flex items-center justify-center transition-colors shadow-md focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Próximo slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Pagination (Centered at bottom: numbered squares) */}
          {heroBanners.length > 1 && (
            <div className="relative z-20 bg-gray-100/90 border-t border-gray-200 py-2 flex items-center justify-center space-x-1.5">
              {heroBanners.map((_, idx) => {
                const isActive = idx === heroIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setHeroIndex(idx)}
                    className={`w-7 h-7 font-pg-display font-bold text-xs flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-pg-red text-white shadow-md scale-105'
                        : 'bg-pg-petrol text-white hover:bg-opacity-80'
                    }`}
                    aria-label={`Ir para o slide ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. FAIXA DE CONTEÚDO EM DUAS COLUNAS */}
      <div className="flex flex-col lg:flex-row gap-6 max-w-[1200px] mx-auto w-full">
        {/* COLUNA ESQUERDA (285px): Lista de Modalidades */}
        {modalidades.length > 0 && (
          <aside className="w-full lg:w-[285px] shrink-0 space-y-4">
            <div className="bg-white border border-gray-300 shadow-sm overflow-hidden">
              <div className="bg-pg-petrol text-white font-pg-display font-bold italic uppercase text-sm px-4 py-2.5 tracking-wider border-b border-gray-200 flex items-center justify-between">
                <span>MODALIDADES</span>
                <span className="text-[10px] text-pg-yellow">PENTAGOL</span>
              </div>

              <div className="divide-y divide-gray-200">
                {modalidades.map((mod) => (
                  <div key={mod.id} className="p-3 bg-white hover:bg-gray-50/80 transition-colors">
                    {/* Barra pg.petrol da modalidade */}
                    <Link
                      to={`/categoria/${mod.slug}`}
                      className="bg-pg-petrol hover:bg-pg-petrol/90 text-white font-pg-display font-bold italic uppercase text-xs px-3 py-1.5 flex items-center justify-between shadow-xs transition-colors mb-2 group"
                    >
                      <span className="group-hover:text-pg-yellow transition-colors">{mod.nome}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-pg-yellow opacity-80 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    {/* Sublinks por modalidade */}
                    <ul className="pl-2 text-xs space-y-1 text-gray-600 font-medium">
                      <li>
                        <Link
                          to={`/categoria/${mod.slug}`}
                          className="hover:text-pg-red hover:underline block transition-colors"
                        >
                          Equipamentos e Acessórios
                        </Link>
                      </li>
                      <li>
                        <Link
                          to={`/categoria/${mod.slug}`}
                          className="hover:text-pg-red hover:underline block transition-colors"
                        >
                          Vestuário e Calçados
                        </Link>
                      </li>
                      <li>
                        <Link
                          to={`/categoria/${mod.slug}`}
                          className="hover:text-pg-red hover:underline block transition-colors"
                        >
                          Linha Oficial e Treino
                        </Link>
                      </li>
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Info Box */}
            <div className="bg-pg-petrol text-white p-4 border border-gray-300 shadow-xs text-xs space-y-2">
              <div className="flex items-center space-x-2 text-pg-yellow font-pg-display font-bold italic text-sm">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>PAGAMENTO SEGURO</span>
              </div>
              <p className="text-gray-200 leading-relaxed text-[11px]">
                Desconto automático no PIX em compras acima de R$ 100,00. Envio imediato com NF-e emitida pelo ERP SupraSoft.
              </p>
            </div>
          </aside>
        )}

        {/* COLUNA DIREITA: Banners Promocionais & Vitrine */}
        <div className="flex-1 space-y-6">
          {/* 3 Banners Promocionais (promo_1, promo_2, promo_3) */}
          {promoBanners.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {promoBanners.map((banner) => (
                <Link
                  key={banner.id}
                  to={banner.linkUrl || '/'}
                  className="relative h-44 bg-gray-900 border border-gray-300 shadow-sm overflow-hidden group block"
                >
                  <img
                    src={banner.imagemUrl}
                    alt={banner.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-95"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-pg-petrol/90 py-2 px-3 text-center border-t border-pg-yellow/30 transition-colors group-hover:bg-pg-red/90">
                    <span className="font-pg-display font-bold italic uppercase text-white text-xs tracking-wider line-clamp-1">
                      {banner.titulo}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* 3. VITRINE "NOVIDADES" */}
          {novidades.length > 0 && (
            <div className="bg-white p-4 sm:p-6 border border-gray-300 shadow-sm">
              <div className="border-b-2 border-pg-red mb-5 pb-2 flex items-center justify-between">
                <h3 className="font-pg-display font-bold italic uppercase text-xl sm:text-2xl text-pg-ink tracking-wide flex items-center space-x-2">
                  <span className="bg-pg-red text-white text-xs px-2 py-0.5 not-italic font-sans mr-1">NEW</span>
                  <span>NOVIDADES</span>
                </h3>
                <Link
                  to="/categoria/futebol"
                  className="text-xs font-pg-display font-bold uppercase text-pg-red hover:underline flex items-center space-x-1"
                >
                  <span>VER TUDO</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Grid de 6 produtos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {novidades.map((prod) => (
                  <Link
                    key={prod.id}
                    to={`/produto/${prod.id}`}
                    className="bg-white border border-gray-200 hover:border-pg-red p-2 flex flex-col justify-between transition-all duration-200 group hover:shadow-md text-center"
                  >
                    <div className="aspect-square bg-gray-50 mb-2 overflow-hidden flex items-center justify-center p-2 relative">
                      <img
                        src={prod.imagens[0] || 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=400'}
                        alt={prod.nome}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      {prod.marca && (
                        <span className="absolute top-1 left-1 bg-gray-800/80 text-white font-pg-display text-[9px] px-1 py-0.5 uppercase">
                          {prod.marca}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <h4 className="font-pg-display text-xs text-gray-800 font-bold uppercase line-clamp-2 mb-1.5 leading-tight group-hover:text-pg-red transition-colors">
                        {prod.nome}
                      </h4>
                      <div>
                        <p className="font-body text-xs font-bold text-pg-red">
                          R$ {prod.precoBase.toFixed(2).replace('.', ',')}
                        </p>
                        <span className="text-[10px] text-gray-500 block font-body">à vista no Pix</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 4. BANNERS INFERIORES (faixa_inferior) */}
          {faixaInferiorBanners.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faixaInferiorBanners.map((banner) => (
                <Link
                  key={banner.id}
                  to={banner.linkUrl || '/'}
                  className="relative h-44 bg-gray-800 border border-gray-300 shadow-sm overflow-hidden group block"
                >
                  <img
                    src={banner.imagemUrl}
                    alt={banner.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-75 group-hover:opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 flex flex-col justify-end">
                    <span className="bg-pg-yellow text-pg-ink font-pg-display font-bold text-[10px] px-2 py-0.5 uppercase w-max mb-1">
                      DESTAQUE ESPECIAL
                    </span>
                    <h4 className="font-pg-display font-bold italic uppercase text-lg text-white leading-snug group-hover:text-pg-yellow transition-colors">
                      {banner.titulo}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
