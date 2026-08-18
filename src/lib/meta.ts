import { useEffect } from 'react';

interface MetaOptions {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogPriceAmount?: number;
  ogPriceCurrency?: string;
}

/**
 * Custom Hook to update document title, description, and OpenGraph tags per page
 */
export function useMeta(options: MetaOptions) {
  useEffect(() => {
    const baseTitle = 'PENTAGOL Esportes | Artigos Esportivos em Belo Horizonte/MG';
    const pageTitle = options.title ? `${options.title} | PENTAGOL Esportes` : baseTitle;
    document.title = pageTitle;

    const defaultDesc =
      'PENTAGOL - Artigos Esportivos em Belo Horizonte/MG. Chuteiras, bolas, vestuário, equipamentos de futebol, vôlei, natação e mais.';
    const descContent = options.description || defaultDesc;

    // Helper to update or create meta tags
    const setMetaTag = (selector: string, attributeName: string, attributeVal: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attributeName, attributeVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMetaTag('meta[name="description"]', 'name', 'description', descContent);
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', options.ogTitle || pageTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', options.ogDescription || descContent);

    if (options.ogImage) {
      setMetaTag('meta[property="og:image"]', 'property', 'og:image', options.ogImage);
    }
    if (options.ogPriceAmount !== undefined) {
      setMetaTag('meta[property="og:price:amount"]', 'property', 'og:price:amount', String(options.ogPriceAmount));
      setMetaTag('meta[property="og:price:currency"]', 'property', 'og:price:currency', options.ogPriceCurrency || 'BRL');
    }
  }, [
    options.title,
    options.description,
    options.ogTitle,
    options.ogDescription,
    options.ogImage,
    options.ogPriceAmount,
    options.ogPriceCurrency,
  ]);
}
