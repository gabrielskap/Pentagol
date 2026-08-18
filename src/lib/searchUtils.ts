import { Produto, Variacao } from '../types';

/**
 * Normalizes text removing accents, lowercasing, and replacing special characters with spaces
 */
export function normalizeSearchTerm(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if query matches product by name, brand, description, reference OR variation SKU
 */
export function matchesSearchQuery(produto: Produto, variacoes: Variacao[], query: string): boolean {
  if (!query) return true;
  const normQ = normalizeSearchTerm(query);
  if (!normQ) return true;

  // 1. Match product name
  if (normalizeSearchTerm(produto.nome).includes(normQ)) return true;

  // 2. Match brand
  if (normalizeSearchTerm(produto.marca).includes(normQ)) return true;

  // 3. Match reference
  if (normalizeSearchTerm(produto.referencia).includes(normQ)) return true;

  // 4. Match description
  if (normalizeSearchTerm(produto.descricao).includes(normQ)) return true;

  // 5. Match variation SKU or size or color
  const prodVars = variacoes.filter((v) => v.produtoId === produto.id && v.ativo);
  const matchVar = prodVars.some((v) => {
    return (
      normalizeSearchTerm(v.sku).includes(normQ) ||
      normalizeSearchTerm(v.tamanho || '').includes(normQ) ||
      normalizeSearchTerm(v.cor || '').includes(normQ)
    );
  });

  return matchVar;
}

/**
 * Finds an EXACT SKU or reference match across products and variations
 */
export function findExactSkuMatch(
  produtos: Produto[],
  variacoes: Variacao[],
  rawQuery: string
): { produto: Produto; variacao?: Variacao } | null {
  const cleanQ = rawQuery.trim().toLowerCase().replace(/\s+/g, '');
  if (!cleanQ) return null;

  // Check variation exact SKU match first (e.g. FIN-SOC-001-40)
  for (const v of variacoes) {
    if (v.ativo && v.sku.trim().toLowerCase().replace(/\s+/g, '') === cleanQ) {
      const prod = produtos.find((p) => p.id === v.produtoId && p.ativo);
      if (prod) {
        return { produto: prod, variacao: v };
      }
    }
  }

  // Check product exact reference match (e.g. FIN-SOC-001)
  for (const p of produtos) {
    if (p.ativo && p.referencia.trim().toLowerCase().replace(/\s+/g, '') === cleanQ) {
      return { produto: p };
    }
  }

  return null;
}
