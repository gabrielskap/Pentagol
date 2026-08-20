import React, { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

export const BackToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-40 bg-pg-petrol hover:bg-pg-red text-white p-3 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pg-red/40 border border-white/20 animate-in fade-in zoom-in-75"
      title="Voltar ao topo da página"
      aria-label="Voltar ao topo da página"
    >
      <ChevronUp className="w-5 h-5 stroke-[2.5]" />
    </button>
  );
};
