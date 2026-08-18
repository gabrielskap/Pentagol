import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Mail, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useStoreConfig } from '../../contexts/StoreConfigContext';
import { getAll } from '../../lib/db';
import { Produto, Variacao } from '../../types';
import { findExactSkuMatch, matchesSearchQuery } from '../../lib/searchUtils';

export const Header: React.FC = () => {
  const { config } = useStoreConfig();
  const { cliente, logado, logout } = useAuth();
  const { quantidadeTotalItens } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const searchContainerRef = useRef<HTMLFormElement>(null);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const primeiroNome = cliente ? cliente.nomeCompleto.split(' ')[0] : '';

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

  return (
    <header className="w-full font-body select-none relative z-50">
      {/* 1) FAIXA BRANCA FINA */}
      <div className="bg-white border-b border-gray-200 text-xs py-1.5 px-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          {/* Esquerda */}
          <div className="flex items-center space-x-6 text-[13px] font-medium">
            <Link to="/institucional/a-pentagol" className="text-pg-link hover:underline focus-visible:ring-1 focus-visible:ring-pg-red">
              A Pentagol
            </Link>
            <Link to="/categoria/produtos" className="text-pg-link hover:underline focus-visible:ring-1 focus-visible:ring-pg-red">
              Produtos
            </Link>
            <Link to="/fale-conosco" className="text-pg-link hover:underline focus-visible:ring-1 focus-visible:ring-pg-red">
              Fale Conosco
            </Link>
          </div>

          {/* Direita */}
          <div className="flex items-center space-x-4">
            <span className="text-pg-red font-bold text-xs sm:text-sm tracking-wide">
              {config.telefone}
            </span>

            {/* User Dropdown Block */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                onBlur={() => setTimeout(() => setUserDropdownOpen(false), 200)}
                className="bg-pg-petrol text-white px-3 py-1 flex items-center space-x-1.5 text-xs font-semibold hover:bg-opacity-90 transition-colors focus-visible:ring-2 focus-visible:ring-pg-red"
                aria-expanded={userDropdownOpen}
              >
                <span>{logado ? `Olá, ${primeiroNome}` : 'Olá visitante'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 shadow-md py-1 z-50 text-xs text-gray-700">
                  {logado ? (
                    <>
                      <Link
                        to="/minha-conta"
                        className="block px-4 py-2 hover:bg-gray-100 text-pg-link font-medium"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Minha Conta
                      </Link>
                      <Link
                        to="/meus-pedidos"
                        className="block px-4 py-2 hover:bg-gray-100 text-pg-link font-medium"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Meus Pedidos
                      </Link>
                      <hr className="my-1 border-gray-200" />
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-pg-red font-medium"
                      >
                        Sair
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block px-4 py-2 hover:bg-gray-100 text-pg-link font-medium"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Entrar na Conta
                      </Link>
                      <Link
                        to="/cadastro"
                        className="block px-4 py-2 hover:bg-gray-100 text-pg-link font-medium"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Criar Cadastro
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2) FAIXA PRINCIPAL VERMELHA (ALTA) */}
      <div className="bg-pg-red text-white py-4 px-4">
        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Top Line in Mobile / Left in Desktop */}
          <div className="flex items-center justify-between">
            {/* LOGO PENTAGOL */}
            <Link to="/" className="group flex flex-col items-start focus-visible:ring-2 focus-visible:ring-white p-0.5">
              <span className="font-pg-display text-3xl sm:text-4xl text-white tracking-wider leading-none">
                PENTAGOL
              </span>
              {/* Swoosh SVG mimicking logo */}
              <svg className="w-32 sm:w-40 h-3 text-white -mt-0.5" viewBox="0 0 160 12" fill="currentColor">
                <path d="M0,2 Q80,12 160,2 Q80,7 0,2 Z" />
              </svg>
            </Link>

            {/* Mobile Hamburger Button */}
            <div className="flex items-center space-x-3 lg:hidden">
              <Link to="/carrinho" className="relative p-2 text-white hover:opacity-80">
                <ShoppingBag className="w-6 h-6" />
                {quantidadeTotalItens > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pg-yellow text-pg-ink font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {quantidadeTotalItens}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="p-2 text-white hover:bg-white/10 rounded focus-visible:ring-2 focus-visible:ring-white"
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
            className="flex-1 max-w-2xl mx-0 lg:mx-6 relative"
          >
            <div className="flex w-full">
              <input
                type="text"
                placeholder="Buscar por produto, marca ou código/SKU..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-white text-gray-800 placeholder-gray-400 px-4 py-2 text-sm focus:outline-none rounded-none border-none font-body"
              />
              <button
                type="submit"
                className="bg-pg-petrol hover:bg-opacity-90 text-white px-4 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-white shrink-0"
                aria-label="Buscar produtos"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* LIVE SUGGESTIONS DROPDOWN */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-pg-red shadow-2xl z-50 text-gray-800 divide-y divide-gray-100 max-h-96 overflow-y-auto">
                <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-[11px] text-gray-500 uppercase font-bold">
                  <span>Sugestões de Produtos ({suggestions.length})</span>
                  <span>Pressione Enter para ver todos</span>
                </div>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full p-2.5 flex items-center space-x-3 hover:bg-gray-50 text-left transition-colors group"
                  >
                    <img
                      src={item.imagens[0]}
                      alt={item.nome}
                      className="w-11 h-11 object-contain bg-gray-50 border border-gray-100 p-1 shrink-0 group-hover:scale-105 transition-transform"
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
            )}
          </form>

          {/* RIGHT SIDE: Fale Conosco + Cart Icon (Desktop) */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link
              to="/fale-conosco"
              className="flex items-center space-x-2 text-white hover:opacity-90 font-medium text-sm focus-visible:ring-2 focus-visible:ring-white"
            >
              <Mail className="w-6 h-6" />
              <span>Fale Conosco</span>
            </Link>

            <Link
              to="/carrinho"
              className="flex items-center space-x-2 text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-white"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {quantidadeTotalItens > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-pg-yellow text-pg-ink font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {quantidadeTotalItens}
                  </span>
                )}
              </div>
              <span className="font-pg-display text-xs">Meu Carrinho</span>
            </Link>
          </div>

        </div>
      </div>

      {/* 3) FAIXA DE MENU NA NAVEGAÇÃO (DESKTOP) */}
      <div className="hidden lg:block bg-pg-red border-t border-white/20 shadow-sm relative">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center space-x-8 py-2 text-sm text-white">

          {/* ESPORTES WITH MEGA-MENU TOGGLE */}
          <div
            className="relative"
            onMouseEnter={() => setMegaMenuOpen(true)}
            onMouseLeave={() => setMegaMenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => setMegaMenuOpen(!megaMenuOpen)}
              className="font-pg-display text-base tracking-wider hover:opacity-90 flex items-center space-x-1.5 py-1 focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>ESPORTES</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* MEGA-MENU PANEL */}
            {megaMenuOpen && (
              <div className="absolute top-full left-0 mt-0 w-[420px] bg-white border-2 border-pg-red shadow-xl p-6 text-gray-800 z-50">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {esportesLinks.map((esp) => (
                    <Link
                      key={esp.slug}
                      to={`/categoria/${esp.slug}`}
                      className="text-pg-link hover:text-pg-red font-body font-medium text-sm transition-colors block py-0.5"
                      onClick={() => setMegaMenuOpen(false)}
                    >
                      {esp.nome}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/categoria/masculino" className="font-pg-display text-base tracking-wider hover:opacity-90 py-1">
            MASCULINO
          </Link>
          <Link to="/categoria/feminino" className="font-pg-display text-base tracking-wider hover:opacity-90 py-1">
            FEMININO
          </Link>
          <Link to="/categoria/infantil" className="font-pg-display text-base tracking-wider hover:opacity-90 py-1">
            INFANTIL
          </Link>
          <Link to="/categoria/calcados" className="font-pg-display text-base tracking-wider hover:opacity-90 py-1">
            CALÇADOS
          </Link>
          <Link to="/categoria/vestuario" className="font-pg-display text-base tracking-wider hover:opacity-90 py-1">
            VESTUÁRIO
          </Link>
          <Link to="/categoria/equipamentos" className="font-pg-display text-base tracking-wider hover:opacity-90 py-1">
            EQUIPAMENTOS
          </Link>

        </div>
      </div>

      {/* MOBILE DRAWER (< 1024px) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-start lg:hidden">
          <div className="w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="bg-pg-red text-white p-4 flex items-center justify-between">
              <span className="font-pg-display text-xl">MENU PENTAGOL</span>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 hover:bg-white/20 rounded text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="border-b pb-3">
                <p className="font-pg-display text-pg-red text-sm mb-2">ESPORTES</p>
                <div className="pl-2 space-y-2">
                  {esportesLinks.map((esp) => (
                    <Link
                      key={esp.slug}
                      to={`/categoria/${esp.slug}`}
                      className="block text-sm text-pg-link hover:text-pg-red"
                      onClick={() => setMobileDrawerOpen(false)}
                    >
                      {esp.nome}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-2 font-pg-display text-base border-b pb-3">
                <Link
                  to="/categoria/masculino"
                  className="block text-gray-800 hover:text-pg-red"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  MASCULINO
                </Link>
                <Link
                  to="/categoria/feminino"
                  className="block text-gray-800 hover:text-pg-red"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  FEMININO
                </Link>
                <Link
                  to="/categoria/infantil"
                  className="block text-gray-800 hover:text-pg-red"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  INFANTIL
                </Link>
                <Link
                  to="/categoria/calcados"
                  className="block text-gray-800 hover:text-pg-red"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  CALÇADOS
                </Link>
                <Link
                  to="/categoria/vestuario"
                  className="block text-gray-800 hover:text-pg-red"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  VESTUÁRIO
                </Link>
                <Link
                  to="/categoria/equipamentos"
                  className="block text-gray-800 hover:text-pg-red"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  EQUIPAMENTOS
                </Link>
              </div>

              <div className="pt-2 space-y-2 text-sm text-gray-700">
                <Link
                  to="/institucional/a-pentagol"
                  className="block text-pg-link hover:underline"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  A Pentagol
                </Link>
                <Link
                  to="/fale-conosco"
                  className="block text-pg-link hover:underline"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  Fale Conosco
                </Link>
                <Link
                  to="/admin"
                  className="block text-pg-red font-semibold hover:underline"
                  onClick={() => setMobileDrawerOpen(false)}
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
