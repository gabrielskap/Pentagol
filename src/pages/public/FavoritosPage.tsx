import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import { useFavoritos } from '../../contexts/FavoritosContext';
import { useMeta } from '../../lib/meta';
import { getAll } from '../../lib/db';
import { Produto } from '../../types';

export const FavoritosPage: React.FC = () => {
  const { favoritos, removerFavorito, quantidadeFavoritos } = useFavoritos();

  useMeta({
    title: 'Meus Favoritos',
    description: 'Produtos que você salvou para comprar depois na PENTAGOL.',
  });

  // Mantém a ordem em que foram favoritados e ignora produtos inativos/removidos
  const produtosPorId = new Map(
    getAll<Produto>('produtos')
      .filter((p) => p.ativo)
      .map((p) => [p.id, p] as const)
  );
  const produtos = favoritos
    .map((id) => produtosPorId.get(id))
    .filter((p): p is Produto => Boolean(p));

  return (
    <div className="space-y-6">
      <div className="bg-pg-petrol text-white p-4 shadow-sm flex items-center justify-between">
        <h1 className="font-pg-display text-2xl tracking-wider uppercase flex items-center gap-2">
          <Heart className="w-6 h-6" />
          MEUS FAVORITOS
        </h1>
        <span className="text-xs text-gray-200">{produtos.length} produto(s)</span>
      </div>

      {produtos.length === 0 ? (
        <div className="bg-white border border-gray-200 p-8 sm:p-12 text-center space-y-6 shadow-xs">
          <Heart className="w-16 h-16 mx-auto text-pg-border" strokeWidth={1.5} />
          <div className="max-w-md mx-auto space-y-2">
            <p className="font-pg-display text-xl sm:text-2xl text-pg-ink uppercase font-bold">
              Você ainda não tem favoritos
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Clique no coração dos produtos que você quer guardar para depois. Eles ficam salvos
              neste navegador e aparecem aqui.
            </p>
          </div>
          <Link
            to="/"
            className="inline-block bg-pg-red text-white font-pg-display text-sm px-6 py-3 hover:brightness-110 transition-all"
          >
            VER PRODUTOS
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {produtos.map((produto) => (
            <Link
              key={produto.id}
              to={`/produto/${produto.id}`}
              className="bg-white border border-gray-200 p-3 flex flex-col justify-between hover:border-pg-red transition-all duration-200 group shadow-xs hover:shadow-md relative"
            >
              <div>
                <div className="aspect-square bg-gray-50 mb-3 overflow-hidden flex items-center justify-center p-2 relative">
                  <img
                    src={produto.imagens[0]}
                    alt={produto.nome}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removerFavorito(produto.id);
                    }}
                    aria-label={`Remover ${produto.nome} dos favoritos`}
                    title="Remover dos favoritos"
                    className="absolute top-1 right-1 z-10 grid place-items-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm ring-1 ring-black/5 text-gray-400 hover:text-pg-red transition-transform duration-150 hover:scale-110 active:scale-90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5 tracking-wider">
                  {produto.marca}
                </span>
                <h3 className="font-pg-display text-xs sm:text-sm text-gray-800 line-clamp-2 uppercase mb-2 group-hover:text-pg-red transition-colors font-bold leading-tight">
                  {produto.nome}
                </h3>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="font-body text-sm sm:text-base font-bold text-pg-red">
                  R$ {produto.precoBase.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-[10px] text-gray-500">à vista no PIX com 5% OFF</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {quantidadeFavoritos > produtos.length && (
        <p className="text-[11px] text-gray-500">
          Alguns produtos favoritados não estão mais disponíveis e foram ocultados.
        </p>
      )}
    </div>
  );
};

export default FavoritosPage;
