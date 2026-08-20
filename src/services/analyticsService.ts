import { CarrinhoItem, ConfigLoja, Pedido, Produto, Variacao } from '../types';

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

// Memory buffer for event deduplication
const firedEventsCache = new Set<string>();

/**
 * Retrieves configured GA4 Measurement ID from environment variable or store configuration.
 */
export function getGAMeasurementId(config?: ConfigLoja): string {
  const envId = (((import.meta as any).env?.VITE_GA_MEASUREMENT_ID as string) || '');
  if (envId && envId.trim() && envId !== 'G-XXXXXXXXXX') {
    return envId.trim();
  }
  if (config?.gaMeasurementId && config.gaMeasurementId.trim() && config.gaMeasurementId !== 'G-XXXXXXXXXX') {
    return config.gaMeasurementId.trim();
  }
  return '';
}

/**
 * Initializes the Google Analytics 4 script dynamically if Measurement ID is provided.
 */
export function initGA(measurementId?: string): void {
  const mid = measurementId || getGAMeasurementId();
  if (!mid || typeof window === 'undefined') return;

  // Prevent loading duplicate gtag script
  if (document.getElementById('ga-gtag-script')) return;

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', mid, {
    send_page_view: false, // We handle page views manually to prevent duplicates on single page app navigation
  });

  const script = document.createElement('script');
  script.id = 'ga-gtag-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${mid}`;
  document.head.appendChild(script);

  console.log(`[GA4 Analytics] Inicializado com Measurement ID: ${mid}`);
}

/**
 * Helper to dispatch GA4 event with deduplication guard
 */
function sendGAEvent(eventName: string, params: Record<string, any>, eventDedupeKey?: string): void {
  if (eventDedupeKey) {
    if (firedEventsCache.has(eventDedupeKey)) {
      return; // Prevent duplicate execution
    }
    firedEventsCache.add(eventDedupeKey);
    // Keep cache clean by removing dedupe key after 3 seconds
    setTimeout(() => firedEventsCache.delete(eventDedupeKey), 3000);
  }

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
  
  // Console logging for verification during development / demo
  console.log(`[GA4 Event] ${eventName}:`, params);
}

/**
 * Track SPA route page view
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  const mid = getGAMeasurementId();
  sendGAEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
    send_to: mid || undefined,
  }, `page_view_${pagePath}`);
}

/**
 * Track GA4 view_item event when a product is viewed
 */
export function trackViewItem(produto: Produto, variacao?: Variacao | null): void {
  if (!produto) return;
  const preco = variacao?.precoAdicional
    ? (produto.precoPromocional ?? produto.precoBase) + variacao.precoAdicional
    : produto.precoPromocional ?? produto.precoBase;

  sendGAEvent(
    'view_item',
    {
      currency: 'BRL',
      value: preco,
      items: [
        {
          item_id: produto.referencia || produto.id,
          item_name: produto.nome,
          item_category: produto.categoriaIds?.[0] || 'Geral',
          item_brand: produto.marca,
          item_variant: variacao ? (variacao.tamanho || variacao.sku) : undefined,
          price: preco,
          quantity: 1,
        },
      ],
    },
    `view_item_${produto.id}_${variacao?.id || 'main'}`
  );
}

/**
 * Track GA4 add_to_cart event
 */
export function trackAddToCart(item: CarrinhoItem): void {
  if (!item) return;
  const value = item.precoUnit * item.quantidade;

  sendGAEvent(
    'add_to_cart',
    {
      currency: 'BRL',
      value: value,
      items: [
        {
          item_id: item.sku || item.produtoId,
          item_name: item.nome,
          item_variant: item.tamanho || item.cor,
          price: item.precoUnit,
          quantity: item.quantidade,
        },
      ],
    },
    `add_to_cart_${item.variacaoId}_${Date.now()}`
  );
}

/**
 * Track GA4 remove_from_cart event
 */
export function trackRemoveFromCart(item: CarrinhoItem): void {
  if (!item) return;
  const value = item.precoUnit * item.quantidade;

  sendGAEvent(
    'remove_from_cart',
    {
      currency: 'BRL',
      value: value,
      items: [
        {
          item_id: item.sku || item.produtoId,
          item_name: item.nome,
          item_variant: item.tamanho || item.cor,
          price: item.precoUnit,
          quantity: item.quantidade,
        },
      ],
    },
    `remove_from_cart_${item.variacaoId}_${Date.now()}`
  );
}

/**
 * Track GA4 begin_checkout event
 */
export function trackBeginCheckout(items: CarrinhoItem[], total: number): void {
  if (!items || items.length === 0) return;

  sendGAEvent(
    'begin_checkout',
    {
      currency: 'BRL',
      value: total,
      items: items.map((i) => ({
        item_id: i.sku || i.produtoId,
        item_name: i.nome,
        item_variant: i.tamanho || i.cor,
        price: i.precoUnit,
        quantity: i.quantidade,
      })),
    },
    `begin_checkout_${items.length}_${total}`
  );
}

/**
 * Track GA4 purchase event
 */
export function trackPurchase(pedido: Pedido): void {
  if (!pedido) return;

  sendGAEvent(
    'purchase',
    {
      transaction_id: pedido.numero || pedido.id,
      value: pedido.total,
      currency: 'BRL',
      tax: 0,
      shipping: pedido.frete?.valor || 0,
      coupon: pedido.cupomCodigo || undefined,
      items: pedido.itens.map((i) => ({
        item_id: i.sku || i.produtoId,
        item_name: i.nome,
        item_variant: i.tamanho || i.cor,
        price: i.precoUnit,
        quantity: i.quantidade,
      })),
    },
    `purchase_${pedido.id}`
  );
}
