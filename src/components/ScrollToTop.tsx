import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente utilitário para resetar a posição de rolagem (scroll)
 * do navegador ao mudar de rota ou parâmetros na URL.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
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
