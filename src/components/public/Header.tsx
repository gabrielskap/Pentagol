import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Heart,
  LogOut,
  Mail,
  Menu,
  Package,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFavoritos } from '../../contexts/FavoritosContext';
import { getAll } from '../../lib/db';
import { Produto, Variacao } from '../../types';
import { findExactSkuMatch, matchesSearchQuery } from '../../lib/searchUtils';
import PentagolLogo from '../PentagolLogo';

/** Badge numérico reaproveitado pelo carrinho e pelos favoritos */
const IconBadge: React.FC<{ valor: number }> = ({ valor }) =>
  valor > 0 ? (
    <span className="absolute -top-1 -right-1 bg-pg-yellow text-pg-ink font-bold text-[10px] min-w-4 h-4 px-1 rounded-full ring-2 ring-pg-red flex items-center justify-center">
      {valor > 99 ? '99+' : valor}
    </span>
  ) : null;

/** Bloco utilitário de 2 linhas com ícone circular (conta / favoritos / carrinho) */
const UtilItem: React.FC<{
  to: string;
  icon: React.ReactNode;
  linhaTopo: string;
  linhaBase: string;
  badge?: number;
}> = ({ to, icon, linhaTopo, linhaBase, badge }) => (
  <Link
    to={to}
    className="group flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-white hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-white"
  >
    <span className="relative shrink-0 grid place-items-center w-10 h-10 rounded-full ring-1 ring-white/40 group-hover:ring-white/80 transition-all">
      {icon}
      {badge !== undefined && <IconBadge valor={badge} />}
    </span>
    <span className="hidden xl:flex flex-col leading-tight text-left">
      <span className="text-[11px] text-white/80">{linhaTopo}</span>
      <span className="font-pg-display text-sm">{linhaBase}</span>
    </span>
  </Link>
);

export const Header: React.FC = () => {
  const { quantidadeTotalItens } = useCart();
  const { quantidadeFavoritos } = useFavoritos();
  const { cliente, logado, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [contaMenuOpen, setContaMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const searchContainerRef = useRef<HTMLFormElement>(null);
  const contaMenuRef = useRef<HTMLDivElement>(null);

  // Close search suggestions / account menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setShowSuggestions(false);
      }
      if (contaMenuRef.current && !contaMenuRef.current.contains(target)) {
        setContaMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close every overlay with Escape
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMegaMenuOpen(false);
      setContaMenuOpen(false);
      setShowSuggestions(false);
      setMobileDrawerOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileDrawerOpen]);

  // Fetch products and variations for suggestions
  const produtos = getAll<Produto>('produtos').filter((p) => p.ativo);
  const variacoes = getAll<Variacao>('variacoes').filter((v) => v.ativo);

  // Filter suggestions when query >= 3 characters
  const trimmedQuery = searchQuery.trim();
  const suggestions =
    trimmedQuery.length >= 3
      ? produtos
          .filter((p) => matchesSearchQuery(p, variacoes, trimmedQuery))
          .slice(0, 6)
      : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedQuery) return;

    setShowSuggestions(false);

    // Check if query matches an EXACT SKU or Reference
    const exactMatch = findExactSkuMatch(produtos, variacoes, trimmedQuery);
    if (exactMatch) {
      const varParam = exactMatch.variacao ? `?var=${exactMatch.variacao.id}` : '';
      navigate(`/produto/${exactMatch.produto.id}${varParam}`);
      return;
    }

    // Standard Search Page Navigation
    navigate(`/busca?q=${encodeURIComponent(trimmedQuery)}`);
  };

  const handleSelectSuggestion = (prod: Produto) => {
    setShowSuggestions(false);
    navigate(`/produto/${prod.id}`);
  };

  const esportesLinks = [
    { nome: 'Academia e Treino', slug: 'academia-e-treino' },
    { nome: 'Artes Marciais', slug: 'artes-marciais' },
    { nome: 'Basquete', slug: 'basquete' },
    { nome: 'Bicicleta', slug: 'bicicleta' },
    { nome: 'Corrida', slug: 'corrida' },
    { nome: 'Futebol', slug: 'futebol' },
    { nome: 'Natação', slug: 'natacao' },
    { nome: 'Vôlei', slug: 'volei' },
  ];

  const categoriasLinks = [
    { nome: 'MASCULINO', slug: 'masculino' },
    { nome: 'FEMININO', slug: 'feminino' },
    { nome: 'INFANTIL', slug: 'infantil' },
    { nome: 'CALÇADOS', slug: 'calcados' },
    { nome: 'VESTUÁRIO', slug: 'vestuario' },
    { nome: 'EQUIPAMENTOS', slug: 'equipamentos' },
  ];

  const isCategoriaAtiva = (slug: string) => pathname === `/categoria/${slug}`;
  const esportesAtivo = esportesLinks.some((esp) => isCategoriaAtiva(esp.slug));
  const primeiroNome = cliente?.nomeCompleto?.trim().split(' ')[0] || '';

  const fecharDrawer = () => setMobileDrawerOpen(false);

  return (
    <header className="w-full font-body select-none sticky top-0 z-50 shadow-md">
      {/* 1) FAIXA PRINCIPAL VERMELHA (ALTA) */}
      <div className="bg-pg-red text-white py-3 lg:py-4 px-4">
        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-6">

          {/* Top Line in Mobile / Left in Desktop */}
          <div className="flex items-center justify-between">
            {/* LOGO PENTAGOL */}
            <Link
              to="/"
              className="group flex items-center rounded-lg focus-visible:ring-2 focus-visible:ring-white p-0.5"
            >
              <PentagolLogo
                variant="plain"
                priority
                className="h-11 sm:h-14 lg:h-16 w-auto transition-transform duration-200 group-hover:scale-[1.03]"
              />
            </Link>

            {/* Mobile Action Icons */}
            <div className="flex items-center gap-1 lg:hidden">
              <Link
                to="/favoritos"
                aria-label="Meus favoritos"
                className="relative grid place-items-center w-11 h-11 rounded-full text-white hover:bg-white/10 transition-colors"
              >
                <Heart className="w-6 h-6" />
                <IconBadge valor={quantidadeFavoritos} />
              </Link>
              <Link
                to="/carrinho"
                aria-label="Meu carrinho"
                className="relative grid place-items-center w-11 h-11 rounded-full text-white hover:bg-white/10 transition-colors"
              >
                <ShoppingBag className="w-6 h-6" />
                <IconBadge valor={quantidadeTotalItens} />
              </Link>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="grid place-items-center w-11 h-11 rounded-full text-white hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Abrir menu"
              >
                <Menu className="w-7 h-7" />
              </button>
            </div>
          </div>

          {/* SEARCH BAR (Center) */}
          <form
            ref={searchContainerRef}
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-2xl relative"
            role="search"
          >
            <div className="flex w-full items-center bg-white rounded-full shadow-sm ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-white/80 pl-5 pr-1.5 py-1 transition-shadow">
              <input
                type="text"
                placeholder="Buscar por produto, marca ou código/SKU"
                aria-label="Buscar produtos"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="flex-1 min-w-0 bg-transparent text-pg-ink placeholder-gray-400 text-sm py-1.5 focus:outline-none border-none font-body"
              />
              <div className="w-px h-5 bg-gray-200 mx-2 shrink-0" />
              <button
                type="submit"
                className="bg-pg-petrol hover:bg-pg-petrol/90 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-white shrink-0"
                aria-label="Buscar produtos"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* LIVE SUGGESTIONS DROPDOWN */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl ring-1 ring-black/10 shadow-2xl z-50 text-gray-800 max-h-96 overflow-y-auto pg-fade-in">
                <div className="p-2.5 bg-pg-surface border-b border-pg-border flex items-center justify-between text-[11px] text-gray-500 uppercase font-bold rounded-t-2xl">
                  <span>Sugestões de Produtos ({suggestions.length})</span>
                  <span className="hidden sm:inline">Pressione Enter para ver todos</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full p-2.5 flex items-center space-x-3 hover:bg-pg-surface text-left transition-colors group"
                    >
                      <img
                        src={item.imagens[0]}
                        alt={item.nome}
                        className="w-11 h-11 object-contain bg-pg-surface rounded-lg p-1 shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-pg-display text-xs font-bold text-gray-900 truncate uppercase group-hover:text-pg-red">
                          {item.nome}
                        </p>
                        <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-mono">
                          <span className="font-bold text-pg-petrol uppercase">{item.marca}</span>
                          <span>•</span>
                          <span>Ref: {item.referencia}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-body text-xs font-bold text-pg-red">
                          R$ {item.precoBase.toFixed(2).replace('.', ',')}
                        </p>
                        <span className="text-[9px] text-gray-400 block">no PIX</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* RIGHT SIDE: Conta + Favoritos + Carrinho (Desktop) */}
          <div className="hidden lg:flex items-center gap-1 shrink-0">
            {/* CONTA */}
            {logado ? (
              <div className="relative" ref={contaMenuRef}>
                <button
                  type="button"
                  onClick={() => setContaMenuOpen((v) => !v)}
                  aria-expanded={contaMenuOpen}
                  aria-haspopup="true"
                  className="group flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-white hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-white"
                >
                  <span className="shrink-0 grid place-items-center w-10 h-10 rounded-full ring-1 ring-white/40 group-hover:ring-white/80 transition-all">
                    <User className="w-5 h-5" />
                  </span>
                  <span className="hidden xl:flex flex-col leading-tight text-left">
                    <span className="text-[11px] text-white/80">Olá, {primeiroNome}</span>
                    <span className="font-pg-display text-sm flex items-center gap-1">
                      Minha conta
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          contaMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </span>
                </button>

                {contaMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden z-50 pg-fade-in">
                    <Link
                      to="/minha-conta"
                      onClick={() => setContaMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-pg-ink hover:bg-pg-surface transition-colors"
                    >
                      <User className="w-4 h-4 text-pg-petrol" />
                      Minha conta
                    </Link>
                    <Link
                      to="/meus-pedidos"
                      onClick={() => setContaMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-pg-ink hover:bg-pg-surface transition-colors border-t border-pg-border"
                    >
                      <Package className="w-4 h-4 text-pg-petrol" />
                      Meus pedidos
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setContaMenuOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-pg-red font-semibold hover:bg-pg-surface transition-colors border-t border-pg-border"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <UtilItem
                to="/login"
                icon={<User className="w-5 h-5" />}
                linhaTopo="Entre ou cadastre-se"
                linhaBase="Acompanhe seu pedido"
              />
            )}

            <UtilItem
              to="/favoritos"
              icon={<Heart className="w-5 h-5" />}
              linhaTopo="Seus produtos"
              linhaBase="Favoritos"
              badge={quantidadeFavoritos}
            />

            <UtilItem
              to="/carrinho"
              icon={<ShoppingBag className="w-5 h-5" />}
              linhaTopo="Carrinho"
              linhaBase="Meu Carrinho"
              badge={quantidadeTotalItens}
            />
          </div>

        </div>
      </div>

      {/* 2) FAIXA DE MENU NA NAVEGAÇÃO (DESKTOP) */}
      <div className="hidden lg:block bg-pg-red border-t border-white/15 relative">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center gap-8 py-2.5 text-sm text-white">

          {/* ESPORTES WITH MEGA-MENU TOGGLE */}
          <div
            className="relative"
            onMouseEnter={() => setMegaMenuOpen(true)}
            onMouseLeave={() => setMegaMenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => setMegaMenuOpen(!megaMenuOpen)}
              aria-expanded={megaMenuOpen}
              aria-haspopup="true"
              className={`relative font-pg-display text-base tracking-wider flex items-center gap-1.5 py-1 transition-colors focus-visible:ring-2 focus-visible:ring-white after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-full after:bg-white after:origin-left after:transition-transform after:duration-200 hover:after:scale-x-100 ${
                esportesAtivo || megaMenuOpen
                  ? 'text-white after:scale-x-100'
                  : 'text-white/90 hover:text-white after:scale-x-0'
              }`}
            >
              <span>ESPORTES</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* MEGA-MENU PANEL */}
            {megaMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-[420px] bg-white rounded-2xl shadow-2xl ring-1 ring-black/10 p-6 text-gray-800 z-50 pg-fade-in">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {esportesLinks.map((esp) => (
                    <Link
                      key={esp.slug}
                      to={`/categoria/${esp.slug}`}
                      className={`font-body font-medium text-sm transition-colors block py-0.5 ${
                        isCategoriaAtiva(esp.slug)
                          ? 'text-pg-red font-bold'
                          : 'text-pg-link hover:text-pg-red'
                      }`}
                      onClick={() => setMegaMenuOpen(false)}
                    >
                      {esp.nome}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {categoriasLinks.map((cat) => (
            <Link
              key={cat.slug}
              to={`/categoria/${cat.slug}`}
              className={`relative font-pg-display text-base tracking-wider py-1 transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-full after:bg-white after:origin-left after:transition-transform after:duration-200 hover:after:scale-x-100 ${
                isCategoriaAtiva(cat.slug)
                  ? 'text-white after:scale-x-100'
                  : 'text-white/90 hover:text-white after:scale-x-0'
              }`}
            >
              {cat.nome}
            </Link>
          ))}

          {/* FALE CONOSCO (alinhado à direita) */}
          <Link
            to="/fale-conosco"
            className="ml-auto flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-white"
          >
            <Mail className="w-4 h-4" />
            <span>Fale Conosco</span>
          </Link>

        </div>
      </div>

      {/* MOBILE DRAWER (< 1024px) */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex justify-start lg:hidden pg-fade-in"
          onClick={fecharDrawer}
        >
          <div
            className="w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-y-auto pg-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-pg-red text-white p-4 flex items-center justify-between">
              <span className="font-pg-display text-xl">MENU PENTAGOL</span>
              <button
                type="button"
                onClick={fecharDrawer}
                className="p-1 hover:bg-white/20 rounded-full text-white"
                aria-label="Fechar menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* CONTA NO DRAWER */}
            <div className="bg-pg-surface px-4 py-3 border-b border-pg-border">
              {logado ? (
                <div className="space-y-2">
                  <p className="font-pg-display text-sm text-pg-ink">Olá, {primeiroNome}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <Link to="/minha-conta" className="text-pg-link hover:text-pg-red" onClick={fecharDrawer}>
                      Minha conta
                    </Link>
                    <Link to="/meus-pedidos" className="text-pg-link hover:text-pg-red" onClick={fecharDrawer}>
                      Meus pedidos
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        fecharDrawer();
                        logout();
                        navigate('/');
                      }}
                      className="text-pg-red font-semibold"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/login" onClick={fecharDrawer} className="flex items-center gap-3 text-pg-ink">
                  <span className="grid place-items-center w-10 h-10 rounded-full bg-white ring-1 ring-pg-border shrink-0">
                    <User className="w-5 h-5 text-pg-petrol" />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[11px] text-gray-500">Entre ou cadastre-se</span>
                    <span className="font-pg-display text-sm">Acompanhe seu pedido</span>
                  </span>
                </Link>
              )}
            </div>

            <div className="p-4 space-y-4">
              <Link
                to="/favoritos"
                onClick={fecharDrawer}
                className="flex items-center gap-2 text-sm font-pg-display text-pg-ink hover:text-pg-red border-b pb-3 w-full"
              >
                <Heart className="w-4 h-4 text-pg-red" />
                FAVORITOS
                {quantidadeFavoritos > 0 && (
                  <span className="ml-auto bg-pg-yellow text-pg-ink text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {quantidadeFavoritos}
                  </span>
                )}
              </Link>

              <div className="border-b pb-3">
                <p className="font-pg-display text-pg-red text-sm mb-2">ESPORTES</p>
                <div className="pl-2 space-y-2">
                  {esportesLinks.map((esp) => (
                    <Link
                      key={esp.slug}
                      to={`/categoria/${esp.slug}`}
                      className="block text-sm text-pg-link hover:text-pg-red"
                      onClick={fecharDrawer}
                    >
                      {esp.nome}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-2 font-pg-display text-base border-b pb-3">
                {categoriasLinks.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/categoria/${cat.slug}`}
                    className={`block hover:text-pg-red ${
                      isCategoriaAtiva(cat.slug) ? 'text-pg-red' : 'text-gray-800'
                    }`}
                    onClick={fecharDrawer}
                  >
                    {cat.nome}
                  </Link>
                ))}
              </div>

              <div className="pt-2 space-y-2 text-sm text-gray-700">
                <Link
                  to="/institucional/a-pentagol"
                  className="block text-pg-link hover:underline"
                  onClick={fecharDrawer}
                >
                  A Pentagol
                </Link>
                <Link
                  to="/fale-conosco"
                  className="block text-pg-link hover:underline"
                  onClick={fecharDrawer}
                >
                  Fale Conosco
                </Link>
                <Link
                  to="/admin"
                  className="block text-pg-red font-semibold hover:underline"
                  onClick={fecharDrawer}
                >
                  Acesso Painel Admin
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
