interface PentagolLogoProps {
  /**
   * 'boxed'  → marca oficial completa sobre o bloco vermelho (fundos claros/escuros neutros)
   * 'plain'  → apenas o lettering + swoosh em branco, fundo transparente (faixa vermelha)
   */
  variant?: 'boxed' | 'plain';
  className?: string;
  /** Texto alternativo/acessível da marca. */
  title?: string;
  /** Marca acima da dobra deve carregar imediatamente. */
  priority?: boolean;
}

/** Arte oficial exportada em 1000px de largura — ver public/. */
const ARTE = {
  boxed: { src: '/logo-pentagol-box.png', width: 1000, height: 365 },
  plain: { src: '/logo-pentagol.png', width: 1000, height: 329 },
} as const;

/**
 * Marca oficial PENTAGOL.
 * O desenho não é redesenhado em código: as duas variantes são recortes da
 * arte original, então qualquer ajuste aqui é só de tamanho/enquadramento.
 */
export default function PentagolLogo({
  variant = 'boxed',
  className = 'h-12 w-auto',
  title = 'PENTAGOL',
  priority = false,
}: PentagolLogoProps) {
  const { src, width, height } = ARTE[variant];

  return (
    <img
      src={src}
      width={width}
      height={height}
      alt={title}
      className={`max-w-full object-contain ${className}`}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      draggable={false}
    />
  );
}
