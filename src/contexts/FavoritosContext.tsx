import React, { createContext, useContext, useEffect, useState } from 'react';

interface FavoritosContextData {
  favoritos: string[];
  isFavorito: (produtoId: string) => boolean;
  toggleFavorito: (produtoId: string) => void;
  removerFavorito: (produtoId: string) => void;
  quantidadeFavoritos: number;
}

const FAVORITOS_STORAGE_KEY = 'pentagol_favoritos_v1';

const FavoritosContext = createContext<FavoritosContextData>({} as FavoritosContextData);

export const FavoritosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoritos, setFavoritos] = useState<string[]>(() => {
    const raw = localStorage.getItem(FAVORITOS_STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    } catch {
      return [];
    }
  });

  // Persist favorites to localStorage
  useEffect(() => {
    localStorage.setItem(FAVORITOS_STORAGE_KEY, JSON.stringify(favoritos));
  }, [favoritos]);

  const isFavorito = (produtoId: string) => favoritos.includes(produtoId);

  const toggleFavorito = (produtoId: string) => {
    if (!produtoId) return;
    setFavoritos((prev) =>
      prev.includes(produtoId) ? prev.filter((id) => id !== produtoId) : [...prev, produtoId]
    );
  };

  const removerFavorito = (produtoId: string) => {
    setFavoritos((prev) => prev.filter((id) => id !== produtoId));
  };

  return (
    <FavoritosContext.Provider
      value={{
        favoritos,
        isFavorito,
        toggleFavorito,
        removerFavorito,
        quantidadeFavoritos: favoritos.length,
      }}
    >
      {children}
    </FavoritosContext.Provider>
  );
};

export const useFavoritos = () => useContext(FavoritosContext);
