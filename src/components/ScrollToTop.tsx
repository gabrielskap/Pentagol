import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initGA, trackPageView } from '../services/analyticsService';
import { getConfigLoja } from '../lib/db';

/**
 * Componente utilitário para resetar a posição de rolagem (scroll)
 * do navegador ao mudar de rota ou parâmetros na URL, e disparar page_view no GA4.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Inicializa GA4 se houver ID configurado
    const config = getConfigLoja();
    initGA(config?.gaMeasurementId);

    // Track SPA page view
    trackPageView(pathname + search);

    // Scroll window to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior,
    });

    // Also reset scroll containers if present in layout
    const mainContainers = document.querySelectorAll('main, .overflow-y-auto');
    mainContainers.forEach((container) => {
      container.scrollTop = 0;
    });
  }, [pathname, search]);

  return null;
};
