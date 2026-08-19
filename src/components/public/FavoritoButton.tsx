import React from 'react';
import { Heart } from 'lucide-react';
import { useFavoritos } from '../../contexts/FavoritosContext';

interface FavoritoButtonProps {
  produtoId: string;
  /** 'sm' = ícone flutuante no card | 'md' = botão com rótulo na página de produto */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Botão de favoritar reutilizável.
 * Nos cards de listagem ele vive DENTRO de um <Link>, por isso o handler
 * precisa cancelar a navegação (preventDefault + stopPropagation).
 */
export const FavoritoButton: React.FC<FavoritoButtonProps> = ({
  produtoId,
  size = 'sm',
  className = '',
}) => {
  const { isFavorito, toggleFavorito } = useFavoritos();
  const ativo = isFavorito(produtoId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorito(produtoId);
  };

  const label = ativo ? 'Remover dos favoritos' : 'Adicionar aos favoritos';

  if (size === 'md') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={ativo}
        aria-label={label}
        title={label}
        className={`flex items-center justify-center gap-2 px-4 py-3 border transition-all duration-200 active:scale-95 ${
          ativo
            ? 'border-pg-red text-pg-red bg-pg-red/5'
            : 'border-pg-border text-pg-ink hover:border-pg-red hover:text-pg-red'
        } ${className}`}
      >
        <Heart className={`w-5 h-5 transition-transform ${ativo ? 'fill-pg-red text-pg-red' : ''}`} />
        <span className="font-pg-display text-sm">{ativo ? 'Favoritado' : 'Favoritar'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={ativo}
      aria-label={label}
      title={label}
      className={`grid place-items-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm ring-1 ring-black/5 transition-transform duration-150 hover:scale-110 active:scale-90 ${className}`}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${
          ativo ? 'fill-pg-red text-pg-red' : 'text-gray-400 hover:text-pg-red'
        }`}
      />
    </button>
  );
};

export default FavoritoButton;
