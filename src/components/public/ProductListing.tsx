import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  MessageCircle,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useStoreConfig } from '../../contexts/StoreConfigContext';
import { getAll } from '../../lib/db';
import { matchesSearchQuery, normalizeSearchTerm } from '../../lib/searchUtils';
import { Categoria, Produto, Variacao } from '../../types';

interface ProductListingProps {
  categorySlug?: string;
  searchQueryProp?: string;
}

export const ProductListing: React.FC<ProductListingProps> = ({
  categorySlug,
  searchQueryProp,
}) => {
  const { config } = useStoreConfig();
  const [searchParams, setSearchParams] = useSearchParams();

  // State for mobile bottom sheet
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // State for skeleton loading simulation
  const [isLoading, setIsLoading] = useState(false);

  // Read state from URL Search Params
  const queryParam = searchParams.get('q') || searchQueryProp || '';
  const modalidadeParam = searchParams.get('modalidade') || '';
  const tamanhoParam = searchParams.get('tamanho') || '';
  const marcaParam = searchParams.get('marca') || '';
  const generoParam = searchParams.get('genero') || '';
  const minPrecoParam = searchParams.get('minPreco') || '';
  const maxPrecoParam = searchParams.get('maxPreco') || '';
  const emEstoqueParam = searchParams.get('emEstoque') === 'true';
  const ordemParam = searchParams.get('ordem') || 'relevancia';
  const pageParam = parseInt(searchParams.get('pagina') || '1', 10);

  // Fetch data
  const produtos = useMemo(() => getAll<Produto>('produtos').filter((p) => p.ativo), []);
  const variacoes = useMemo(() => getAll<Variacao>('variacoes').filter((v) => v.ativo), []);
  const categorias = useMemo(() => getAll<Categoria>('categorias').filter((c) => c.ativo), []);

  // Determine Category / Title / Scope
  const currentCategory = useMemo(() => {
    if (!categorySlug) return null;
    return categorias.find((c) => c.slug.toLowerCase() === categorySlug.toLowerCase()) || null;
  }, [categorySlug, categorias]);

  // Display Title & Breadcrumb
  const pageTitle = useMemo(() => {
    if (currentCategory) {
      return currentCategory.nome.toUpperCase();
    }
    if (categorySlug) {
      return categorySlug.replace(/-/g, ' ').toUpperCase();
    }
    if (queryParam) {
      return `BUSCA: "${queryParam.toUpperCase()}"`;
    }
    return 'CATÁLOGO DE PRODUTOS';
  }, [currentCategory, categorySlug, queryParam]);

  // Base Products Dataset before applying filters
  const baseProducts = useMemo(() => {
    let result = [...produtos];

    // Category Filter
    if (currentCategory) {
      const catNameNorm = normalizeSearchTerm(currentCategory.nome);
      result = result.filter(
        (p) =>
          p.categoriaIds.includes(currentCategory.id) ||
          p.modalidades.some((m) => normalizeSearchTerm(m) === catNameNorm)
      );
    } else if (categorySlug && !queryParam) {
      const slugNorm = normalizeSearchTerm(categorySlug.replace(/-/g, ' '));
      result = result.filter(
        (p) =>
          p.categoriaIds.some((id) => id.toLowerCase().includes(categorySlug.toLowerCase())) ||
          p.modalidades.some((m) => normalizeSearchTerm(m).includes(slugNorm)) ||
          normalizeSearchTerm(p.marca).includes(slugNorm)
      );
    }

    // Search Query Filter
    if (queryParam) {
      result = result.filter((p) => matchesSearchQuery(p, variacoes, queryParam));
    }

    return result;
  }, [produtos, variacoes, currentCategory, categorySlug, queryParam]);

  // Dynamic Filter Options derived from Base Products Dataset
  const availableModalidades = useMemo(() => {
    const modMap = new Map<string, number>();
    baseProducts.forEach((p) => {
      p.modalidades.forEach((m) => {
        modMap.set(m, (modMap.get(m) || 0) + 1);
      });
    });
    return Array.from(modMap.entries()).map(([nome, count]) => ({ nome, count }));
  }, [baseProducts]);

  const availableTamanhos = useMemo(() => {
    const baseProdIds = new Set(baseProducts.map((p) => p.id));
    const sizeSet = new Set<string>();

    variacoes.forEach((v) => {
      if (baseProdIds.has(v.produtoId) && v.tamanho && v.tamanho.trim()) {
        sizeSet.add(v.tamanho.trim());
      }
    });

    // Custom sort sizes
    return Array.from(sizeSet).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [baseProducts, variacoes]);

  const availableMarcas = useMemo(() => {
    const marcaMap = new Map<string, number>();
    baseProducts.forEach((p) => {
      if (p.marca) {
        marcaMap.set(p.marca, (marcaMap.get(p.marca) || 0) + 1);
      }
    });
    return Array.from(marcaMap.entries()).map(([nome, count]) => ({ nome, count }));
  }, [baseProducts]);

  const basePriceRange = useMemo(() => {
    if (baseProducts.length === 0) return { min: 0, max: 500 };
    const prices = baseProducts.map((p) => p.precoBase);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [baseProducts]);

  // Parse arrays from parameters
  const selectedModalidades = useMemo(
    () => (modalidadeParam ? modalidadeParam.split(',') : []),
    [modalidadeParam]
  );
  const selectedTamanhos = useMemo(
    () => (tamanhoParam ? tamanhoParam.split(',') : []),
    [tamanhoParam]
  );
  const selectedMarcas = useMemo(
    () => (marcaParam ? marcaParam.split(',') : []),
    [marcaParam]
  );
  const selectedGeneros = useMemo(
    () => (generoParam ? generoParam.split(',') : []),
    [generoParam]
  );

  // Map product stock & sizes
  const productExtraInfo = useMemo(() => {
    const map = new Map<string, { totalEstoque: number; tamanhos: string[] }>();
    produtos.forEach((p) => {
      const pVars = variacoes.filter((v) => v.produtoId === p.id);
      const totalEstoque = pVars.reduce((sum, v) => sum + v.estoque, 0);
      const tamanhos = Array.from(
        new Set<string>(pVars.map((v) => v.tamanho).filter((t): t is string => Boolean(t)))
      );
      map.set(p.id, { totalEstoque, tamanhos });
    });
    return map;
  }, [produtos, variacoes]);

  // Apply active filters to base products
  const filteredProducts = useMemo(() => {
    return baseProducts.filter((p) => {
      // Modalidade filter
      if (selectedModalidades.length > 0) {
        const matchesMod = p.modalidades.some((m) => selectedModalidades.includes(m));
        if (!matchesMod) return false;
      }

      // Size / Variation filter
      if (selectedTamanhos.length > 0) {
        const info = productExtraInfo.get(p.id);
        if (!info || !info.tamanhos.some((t) => selectedTamanhos.includes(t))) {
          return false;
        }
      }

      // Brand filter
      if (selectedMarcas.length > 0) {
        if (!selectedMarcas.includes(p.marca)) return false;
      }

      // Gender / Public filter
      if (selectedGeneros.length > 0) {
        // Check category IDs
        const genderMatch = selectedGeneros.some((g) => {
          const gLower = g.toLowerCase();
          if (gLower === 'masculino') return p.categoriaIds.includes('cat-masculino');
          if (gLower === 'feminino') return p.categoriaIds.includes('cat-feminino');
          if (gLower === 'infantil') return p.categoriaIds.includes('cat-infantil');
          return true;
        });
        if (!genderMatch) return false;
      }

      // Price Filter
      if (minPrecoParam) {
        const minVal = parseFloat(minPrecoParam);
        if (!isNaN(minVal) && p.precoBase < minVal) return false;
      }
      if (maxPrecoParam) {
        const maxVal = parseFloat(maxPrecoParam);
        if (!isNaN(maxVal) && p.precoBase > maxVal) return false;
      }

      // Only in stock filter
      if (emEstoqueParam) {
        const info = productExtraInfo.get(p.id);
        if (!info || info.totalEstoque <= 0) return false;
      }

      return true;
    });
  }, [
    baseProducts,
    selectedModalidades,
    selectedTamanhos,
    selectedMarcas,
    selectedGeneros,
    minPrecoParam,
    maxPrecoParam,
    emEstoqueParam,
    productExtraInfo,
  ]);

  // Sort Filtered Products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (ordemParam) {
      case 'preco_asc':
        return list.sort((a, b) => a.precoBase - b.precoBase);
      case 'preco_desc':
        return list.sort((a, b) => b.precoBase - a.precoBase);
      case 'lancamentos':
        return list.sort(
          (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
        );
      case 'nome_asc':
        return list.sort((a, b) => a.nome.localeCompare(b.nome));
      case 'relevancia':
      default:
        // Featured & Novidade first
        return list.sort((a, b) => {
          if (a.destaque && !b.destaque) return -1;
          if (!a.destaque && b.destaque) return 1;
          if (a.novidade && !b.novidade) return -1;
          if (!a.novidade && b.novidade) return 1;
          return 0;
        });
    }
  }, [filteredProducts, ordemParam]);

  // Pagination calculation
  const ITEMS_PER_PAGE = 12;
  const totalItems = sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  // Clamp current page if overflow
  const currentPage = useMemo(() => {
    if (pageParam > totalPages) return 1;
    return Math.max(1, pageParam);
  }, [pageParam, totalPages]);

  // Paginated Products
  const paginatedProducts = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProducts.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [sortedProducts, currentPage]);

  // Helper to update query parameters in URL
  const updateUrlParams = (newParams: Record<string, string | null>) => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 200);

    const current = new URLSearchParams(searchParams);

    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === '') {
        current.delete(key);
      } else {
        current.set(key, val);
      }
    });

    setSearchParams(current);
  };

  // Filter Toggle Handlers (resets page to 1)
  const handleToggleModalidade = (mod: string) => {
    const next = selectedModalidades.includes(mod)
      ? selectedModalidades.filter((m) => m !== mod)
      : [...selectedModalidades, mod];
    updateUrlParams({
      modalidade: next.length > 0 ? next.join(',') : null,
      pagina: '1',
    });
  };

  const handleToggleTamanho = (tam: string) => {
    const next = selectedTamanhos.includes(tam)
      ? selectedTamanhos.filter((t) => t !== tam)
      : [...selectedTamanhos, tam];
    updateUrlParams({
      tamanho: next.length > 0 ? next.join(',') : null,
      pagina: '1',
    });
  };

  const handleToggleMarca = (marca: string) => {
    const next = selectedMarcas.includes(marca)
      ? selectedMarcas.filter((m) => m !== marca)
      : [...selectedMarcas, marca];
    updateUrlParams({
      marca: next.length > 0 ? next.join(',') : null,
      pagina: '1',
    });
  };

  const handleToggleGenero = (genero: string) => {
    const next = selectedGeneros.includes(genero)
      ? selectedGeneros.filter((g) => g !== genero)
      : [...selectedGeneros, genero];
    updateUrlParams({
      genero: next.length > 0 ? next.join(',') : null,
      pagina: '1',
    });
  };

  const handleToggleEmEstoque = () => {
    updateUrlParams({
      emEstoque: !emEstoqueParam ? 'true' : null,
      pagina: '1',
    });
  };

  const handlePriceChange = (min: string, max: string) => {
    updateUrlParams({
      minPreco: min || null,
      maxPreco: max || null,
      pagina: '1',
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUrlParams({
      ordem: e.target.value,
      pagina: '1',
    });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ pagina: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAllFilters = () => {
    updateUrlParams({
      modalidade: null,
      tamanho: null,
      marca: null,
      genero: null,
      minPreco: null,
      maxPreco: null,
      emEstoque: null,
      pagina: '1',
    });
  };

  // Count active filters
  const activeFiltersCount =
    selectedModalidades.length +
    selectedTamanhos.length +
    selectedMarcas.length +
    selectedGeneros.length +
    (minPrecoParam ? 1 : 0) +
    (maxPrecoParam ? 1 : 0) +
    (emEstoqueParam ? 1 : 0);

  // Top searched categories for empty state
  const topCategories = [
    { nome: 'Futebol', slug: 'futebol' },
    { nome: 'Vôlei', slug: 'volei' },
    { nome: 'Natação', slug: 'natacao' },
    { nome: 'Basquete', slug: 'basquete' },
    { nome: 'Calçados', slug: 'calcados' },
    { nome: 'Vestuário', slug: 'vestuario' },
    { nome: 'Equipamentos', slug: 'equipamentos' },
  ];

  const whatsappPhone = config.whatsapp.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    `Olá! Procurei por "${queryParam || pageTitle}" na PENTAGOL e gostaria de ajuda para encontrar produtos.`
  )}`;

  // Filter Sidebar Element Content
  const renderSidebarFilters = () => (
    <div className="space-y-6 text-xs text-gray-800">
      {/* 1. Modalidade Esportiva */}
      {availableModalidades.length > 0 && (
        <div className="border-b border-gray-200 pb-4">
          <h3 className="font-pg-display text-sm font-bold uppercase text-pg-ink mb-3 flex items-center justify-between">
            <span>Modalidade</span>
            <span className="text-[10px] text-gray-400 font-mono font-normal">({availableModalidades.length})</span>
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {availableModalidades.map((m) => {
              const isChecked = selectedModalidades.includes(m.nome);
              return (
                <label key={m.nome} className="flex items-center justify-between cursor-pointer group hover:text-pg-red">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleModalidade(m.nome)}
                      className="rounded border-gray-300 text-pg-red focus:ring-pg-red w-4 h-4"
                    />
                    <span className={`text-xs ${isChecked ? 'font-bold text-pg-red' : 'text-gray-700'}`}>
                      {m.nome}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">({m.count})</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Tamanhos (Only sizes existing in current base product dataset) */}
      {availableTamanhos.length > 0 && (
        <div className="border-b border-gray-200 pb-4">
          <h3 className="font-pg-display text-sm font-bold uppercase text-pg-ink mb-3 flex items-center justify-between">
            <span>Tamanho / Variação</span>
            <span className="text-[10px] text-gray-400 font-mono font-normal">({availableTamanhos.length})</span>
          </h3>
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
            {availableTamanhos.map((tam) => {
              const isChecked = selectedTamanhos.includes(tam);
              return (
                <button
                  key={tam}
                  type="button"
                  onClick={() => handleToggleTamanho(tam)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold border transition-colors ${
                    isChecked
                      ? 'bg-pg-red text-white border-pg-red'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-pg-red'
                  }`}
                >
                  {tam}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Marcas */}
      {availableMarcas.length > 0 && (
        <div className="border-b border-gray-200 pb-4">
          <h3 className="font-pg-display text-sm font-bold uppercase text-pg-ink mb-3 flex items-center justify-between">
            <span>Marca</span>
            <span className="text-[10px] text-gray-400 font-mono font-normal">({availableMarcas.length})</span>
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {availableMarcas.map((m) => {
              const isChecked = selectedMarcas.includes(m.nome);
              return (
                <label key={m.nome} className="flex items-center justify-between cursor-pointer group hover:text-pg-red">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleMarca(m.nome)}
                      className="rounded border-gray-300 text-pg-red focus:ring-pg-red w-4 h-4"
                    />
                    <span className={`text-xs ${isChecked ? 'font-bold text-pg-red' : 'text-gray-700'}`}>
                      {m.nome}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">({m.count})</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Gênero / Público */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="font-pg-display text-sm font-bold uppercase text-pg-ink mb-3">
          Público / Gênero
        </h3>
        <div className="space-y-2">
          {[
            { id: 'masculino', label: 'Masculino' },
            { id: 'feminino', label: 'Feminino' },
            { id: 'infantil', label: 'Infantil' },
          ].map((gen) => {
            const isChecked = selectedGeneros.includes(gen.id);
            return (
              <label key={gen.id} className="flex items-center space-x-2 cursor-pointer group hover:text-pg-red">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleGenero(gen.id)}
                  className="rounded border-gray-300 text-pg-red focus:ring-pg-red w-4 h-4"
                />
                <span className={`text-xs ${isChecked ? 'font-bold text-pg-red' : 'text-gray-700'}`}>
                  {gen.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 5. Faixa de Preço */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="font-pg-display text-sm font-bold uppercase text-pg-ink mb-3">
          Faixa de Preço (R$)
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Mínimo</label>
            <input
              type="number"
              placeholder={`R$ ${basePriceRange.min}`}
              value={minPrecoParam}
              onChange={(e) => handlePriceChange(e.target.value, maxPrecoParam)}
              className="w-full border border-gray-300 px-2 py-1 text-xs font-mono focus:border-pg-red focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Máximo</label>
            <input
              type="number"
              placeholder={`R$ ${basePriceRange.max}`}
              value={maxPrecoParam}
              onChange={(e) => handlePriceChange(minPrecoParam, e.target.value)}
              className="w-full border border-gray-300 px-2 py-1 text-xs font-mono focus:border-pg-red focus:outline-none"
            />
          </div>
        </div>

        {/* Price Slider */}
        <input
          type="range"
          min={basePriceRange.min}
          max={basePriceRange.max}
          step="10"
          value={maxPrecoParam ? parseInt(maxPrecoParam, 10) : basePriceRange.max}
          onChange={(e) => handlePriceChange(minPrecoParam, e.target.value)}
          className="w-full accent-pg-red cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
          <span>R$ {basePriceRange.min}</span>
          <span>R$ {basePriceRange.max}</span>
        </div>
      </div>

      {/* 6. Somente em Estoque */}
      <div className="pb-2">
        <label className="flex items-center space-x-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={emEstoqueParam}
            onChange={handleToggleEmEstoque}
            className="rounded border-gray-300 text-pg-red focus:ring-pg-red w-4 h-4"
          />
          <span className={`text-xs font-bold ${emEstoqueParam ? 'text-pg-red' : 'text-gray-800'}`}>
            Somente em estoque
          </span>
        </label>
      </div>

      {/* Clear All Button inside Sidebar */}
      {activeFiltersCount > 0 && (
        <button
          type="button"
          onClick={handleClearAllFilters}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-pg-display text-xs py-2 uppercase font-bold flex items-center justify-center space-x-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Limpar Todos os Filtros</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-12 font-body">
      {/* BREADCRUMB */}
      <nav className="text-xs text-gray-500 flex items-center space-x-1.5 flex-wrap">
        <Link to="/" className="hover:text-pg-red transition-colors font-medium">
          Home
        </Link>
        <span>/</span>
        {currentCategory ? (
          <>
            <span className="text-gray-400">Categorias</span>
            <span>/</span>
            <span className="text-pg-ink font-bold uppercase">{currentCategory.nome}</span>
          </>
        ) : queryParam ? (
          <>
            <span className="text-gray-400">Busca</span>
            <span>/</span>
            <span className="text-pg-ink font-bold">"{queryParam}"</span>
          </>
        ) : (
          <span className="text-pg-ink font-bold uppercase">{pageTitle}</span>
        )}
      </nav>

      {/* HEADER BAR FOR LISTING */}
      <div className="bg-white border border-gray-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-pg-display font-bold italic uppercase text-2xl sm:text-3xl text-pg-ink tracking-wide">
            {pageTitle}
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            <span className="font-bold text-pg-red">{totalItems}</span> produto(s) encontrado(s)
          </p>
        </div>

        {/* ORDER SELECT & MOBILE FILTER BUTTON */}
        <div className="flex items-center space-x-3 self-end md:self-auto w-full md:w-auto justify-between md:justify-end">
          {/* Mobile Filter Trigger Button */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden bg-pg-petrol text-white px-3 py-2 text-xs font-pg-display uppercase font-bold flex items-center space-x-2 hover:bg-opacity-90 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtros {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
          </button>

          {/* Ordering Select Box */}
          <div className="flex items-center space-x-2">
            <label htmlFor="ordem-select" className="text-xs text-gray-500 font-bold uppercase whitespace-nowrap hidden sm:inline">
              Ordenar por:
            </label>
            <select
              id="ordem-select"
              value={ordemParam}
              onChange={handleSortChange}
              className="bg-white border border-gray-300 text-xs text-gray-800 font-medium px-3 py-2 focus:border-pg-red focus:outline-none cursor-pointer"
            >
              <option value="relevancia">Relevância</option>
              <option value="preco_asc">Menor Preço</option>
              <option value="preco_desc">Maior Preço</option>
              <option value="lancamentos">Lançamentos</option>
              <option value="nome_asc">Nome (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ACTIVE FILTER CHIPS */}
      {activeFiltersCount > 0 && (
        <div className="bg-gray-50 border border-gray-200 p-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-pg-display text-gray-500 uppercase font-bold text-[11px] mr-1">
            Filtros Ativos:
          </span>

          {selectedModalidades.map((m) => (
            <button
              key={`chip-mod-${m}`}
              type="button"
              onClick={() => handleToggleModalidade(m)}
              className="bg-white border border-pg-red text-pg-red px-2.5 py-1 text-[11px] font-bold flex items-center space-x-1.5 hover:bg-pg-red hover:text-white transition-colors"
            >
              <span>Modalidade: {m}</span>
              <X className="w-3 h-3" />
            </button>
          ))}

          {selectedTamanhos.map((t) => (
            <button
              key={`chip-tam-${t}`}
              type="button"
              onClick={() => handleToggleTamanho(t)}
              className="bg-white border border-pg-red text-pg-red px-2.5 py-1 text-[11px] font-bold flex items-center space-x-1.5 hover:bg-pg-red hover:text-white transition-colors"
            >
              <span>Tam: {t}</span>
              <X className="w-3 h-3" />
            </button>
          ))}

          {selectedMarcas.map((m) => (
            <button
              key={`chip-marca-${m}`}
              type="button"
              onClick={() => handleToggleMarca(m)}
              className="bg-white border border-pg-red text-pg-red px-2.5 py-1 text-[11px] font-bold flex items-center space-x-1.5 hover:bg-pg-red hover:text-white transition-colors"
            >
              <span>Marca: {m}</span>
              <X className="w-3 h-3" />
            </button>
          ))}

          {selectedGeneros.map((g) => (
            <button
              key={`chip-gen-${g}`}
              type="button"
              onClick={() => handleToggleGenero(g)}
              className="bg-white border border-pg-red text-pg-red px-2.5 py-1 text-[11px] font-bold flex items-center space-x-1.5 hover:bg-pg-red hover:text-white transition-colors capitalize"
            >
              <span>{g}</span>
              <X className="w-3 h-3" />
            </button>
          ))}

          {minPrecoParam && (
            <button
              type="button"
              onClick={() => handlePriceChange('', maxPrecoParam)}
              className="bg-white border border-pg-red text-pg-red px-2.5 py-1 text-[11px] font-bold flex items-center space-x-1.5 hover:bg-pg-red hover:text-white transition-colors"
            >
              <span>Mín: R$ {minPrecoParam}</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {maxPrecoParam && (
            <button
              type="button"
              onClick={() => handlePriceChange(minPrecoParam, '')}
              className="bg-white border border-pg-red text-pg-red px-2.5 py-1 text-[11px] font-bold flex items-center space-x-1.5 hover:bg-pg-red hover:text-white transition-colors"
            >
              <span>Máx: R$ {maxPrecoParam}</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {emEstoqueParam && (
            <button
              type="button"
              onClick={handleToggleEmEstoque}
              className="bg-white border border-pg-red text-pg-red px-2.5 py-1 text-[11px] font-bold flex items-center space-x-1.5 hover:bg-pg-red hover:text-white transition-colors"
            >
              <span>Somente em estoque</span>
              <X className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={handleClearAllFilters}
            className="text-xs text-pg-red underline font-bold hover:text-pg-ink ml-auto"
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* MAIN CONTAINER: SIDEBAR (DESKTOP) + PRODUCTS GRID */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* DESKTOP SIDEBAR (260px) */}
        <aside className="hidden lg:block w-[260px] shrink-0 bg-white border border-gray-200 p-4 shadow-xs self-start">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
            <h2 className="font-pg-display text-base font-bold uppercase text-pg-ink flex items-center space-x-2">
              <Filter className="w-4 h-4 text-pg-red" />
              <span>FILTROS</span>
            </h2>
            {activeFiltersCount > 0 && (
              <span className="bg-pg-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          {renderSidebarFilters()}
        </aside>

        {/* PRODUCTS GRID / EMPTY STATE AREA */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* SKELETON LOADING STATE */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 p-3 animate-pulse space-y-3">
                  <div className="aspect-square bg-gray-200" />
                  <div className="h-3 bg-gray-200 w-1/2" />
                  <div className="h-4 bg-gray-200 w-3/4" />
                  <div className="h-5 bg-gray-200 w-1/3" />
                </div>
              ))}
            </div>
          ) : paginatedProducts.length > 0 ? (
            /* PRODUCT CARDS GRID (4 cols desktop / 3 cols tablet / 2 cols mobile) */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedProducts.map((produto) => {
                const info = productExtraInfo.get(produto.id);
                const isEsgotado = !info || info.totalEstoque <= 0;
                const tamanhosDisponiveis = info ? info.tamanhos : [];

                return (
                  <Link
                    key={produto.id}
                    to={`/produto/${produto.id}`}
                    className="bg-white border border-gray-200 p-3 flex flex-col justify-between hover:border-pg-red transition-all duration-200 group shadow-xs hover:shadow-md relative"
                  >
                    <div>
                      {/* IMAGE CONTAINER & BADGES */}
                      <div className="aspect-square bg-gray-50 mb-3 overflow-hidden flex items-center justify-center p-2 relative">
                        <img
                          src={produto.imagens[0]}
                          alt={produto.nome}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                        />

                        {/* BADGES TOP LEFT */}
                        <div className="absolute top-2 left-2 flex flex-col space-y-1 z-10">
                          {produto.novidade && (
                            <span className="bg-pg-orange text-white font-pg-display text-[10px] font-bold italic uppercase px-1.5 py-0.5 tracking-wider shadow-xs">
                              NOVO
                            </span>
                          )}
                          {isEsgotado && (
                            <span className="bg-gray-500 text-white font-pg-display text-[10px] font-bold uppercase px-1.5 py-0.5 shadow-xs">
                              ESGOTADO
                            </span>
                          )}
                        </div>
                      </div>

                      {/* BRAND & NAME */}
                      <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5 tracking-wider">
                        {produto.marca}
                      </span>
                      <h3 className="font-pg-display text-xs sm:text-sm text-gray-800 line-clamp-2 uppercase mb-2 group-hover:text-pg-red transition-colors font-bold leading-tight">
                        {produto.nome}
                      </h3>

                      {/* DISCRETE SIZE LIST */}
                      {tamanhosDisponiveis.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1 text-[10px] text-gray-500 font-mono">
                          <span className="text-gray-400">Tam:</span>
                          {tamanhosDisponiveis.slice(0, 5).map((t) => (
                            <span
                              key={t}
                              className="bg-gray-100 px-1 py-0.2 border border-gray-200 text-gray-700 font-bold"
                            >
                              {t}
                            </span>
                          ))}
                          {tamanhosDisponiveis.length > 5 && (
                            <span className="text-gray-400 text-[9px] align-middle">
                              +{tamanhosDisponiveis.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* PRICE BLOCK */}
                    <div className="pt-2 border-t border-gray-100">
                      <p className="font-body text-sm sm:text-base font-bold text-pg-red">
                        R$ {produto.precoBase.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        à vista no PIX com 5% OFF
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* EMPTY STATE WHEN NO PRODUCTS MATCH */
            <div className="bg-white border border-gray-200 p-8 sm:p-12 text-center space-y-6 shadow-xs">
              <div className="max-w-md mx-auto space-y-2">
                <p className="font-pg-display text-xl sm:text-2xl text-pg-ink uppercase font-bold">
                  Nenhum produto para {queryParam ? `"${queryParam}"` : pageTitle}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Não encontramos nenhum item com os critérios ou filtros selecionados. Tente remover alguns filtros ou busque por termos mais genéricos.
                </p>
              </div>

              {/* SUGGESTION OF TOP CATEGORIES */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs font-bold uppercase text-gray-700 mb-3">
                  Categorias mais buscadas:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {topCategories.map((cat) => (
                    <Link
                      key={cat.slug}
                      to={`/categoria/${cat.slug}`}
                      className="bg-gray-100 hover:bg-pg-red hover:text-white text-gray-800 text-xs font-pg-display uppercase px-3 py-1.5 transition-colors border border-gray-200"
                    >
                      {cat.nome}
                    </Link>
                  ))}
                </div>
              </div>

              {/* WHATSAPP ATTENDANT BUTTON */}
              <div className="pt-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-pg-display text-xs sm:text-sm uppercase font-bold px-5 py-3 shadow-md transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Procurar com um Atendente no WhatsApp</span>
                </a>
              </div>
            </div>
          )}

          {/* SQUARE PAGINATION CONTROLS */}
          {totalPages > 1 && !isLoading && (
            <div className="flex items-center justify-center space-x-2 pt-6 border-t border-gray-200">
              {/* Previous Button */}
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className={`w-9 h-9 flex items-center justify-center font-bold text-xs uppercase transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-pg-petrol text-white hover:bg-opacity-90'
                }`}
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Number Square Buttons */}
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 flex items-center justify-center font-pg-display font-bold text-xs transition-colors ${
                      isActive
                        ? 'bg-pg-red text-white shadow-xs'
                        : 'bg-pg-petrol text-white hover:bg-opacity-90'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className={`w-9 h-9 flex items-center justify-center font-bold text-xs uppercase transition-colors ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-pg-petrol text-white hover:bg-opacity-90'
                }`}
                aria-label="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET FOR FILTERS (< 1024px) */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end lg:hidden">
          <div className="bg-white w-full max-h-[85vh] flex flex-col shadow-2xl rounded-t-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-pg-petrol text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-pg-yellow" />
                <span className="font-pg-display text-base uppercase font-bold">FILTRAR PRODUTOS</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 hover:bg-white/20 rounded text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 overflow-y-auto flex-1">
              {renderSidebarFilters()}
            </div>

            {/* Fixed Action Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center space-x-3">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-pg-display text-xs py-3 uppercase font-bold transition-colors"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-[2] bg-pg-red hover:bg-opacity-90 text-white font-pg-display text-xs py-3 uppercase font-bold transition-colors shadow-md flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Ver {totalItems} produto(s)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
