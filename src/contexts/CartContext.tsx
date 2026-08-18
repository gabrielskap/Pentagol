import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAll } from '../lib/db';
import { CarrinhoItem, Cupom, Frete, Variacao } from '../types';

interface CartContextData {
  itens: CarrinhoItem[];
  subtotal: number;
  desconto: number;
  cupom: Cupom | null;
  frete: Frete | null;
  total: number;
  isUpdating: boolean;
  adicionarItem: (item: CarrinhoItem) => void;
  removerItem: (variacaoId: string) => void;
  atualizarQuantidade: (variacaoId: string, quantidade: number) => void;
  trocarVariacao: (variacaoIdAntiga: string, novaVariacao: Variacao, novoPrecoUnit: number) => void;
  aplicarCupom: (codigo: string) => { sucesso: boolean; mensagem: string };
  removerCupom: () => void;
  selecionarFrete: (frete: Frete | null) => void;
  limparCarrinho: () => void;
  quantidadeTotalItens: number;
  mesclarCarrinhoAoLogar: (clienteId: string) => void;
}

const CART_STORAGE_KEY = 'pentagol_carrinho_v1';

const CartContext = createContext<CartContextData>({} as CartContextData);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [itens, setItens] = useState<CarrinhoItem[]>(() => {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  });

  const [cupom, setCupom] = useState<Cupom | null>(null);
  const [frete, setFrete] = useState<Frete | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Persist items to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(itens));
  }, [itens]);

  const subtotal = itens.reduce((acc, item) => acc + item.precoUnit * item.quantidade, 0);

  // Automatic coupon application check if active
  useEffect(() => {
    if (!cupom) {
      const cupons = getAll<Cupom>('cupons');
      const autoCupom = cupons.find(
        (c) => c.ativo && c.automatico && (!c.valorMinimoPedido || subtotal >= c.valorMinimoPedido)
      );
      if (autoCupom) {
        setCupom(autoCupom);
      }
    } else if (cupom.valorMinimoPedido && subtotal < cupom.valorMinimoPedido && cupom.automatico) {
      setCupom(null);
    }
  }, [subtotal, cupom]);

  const desconto = cupom ? (subtotal * cupom.percentual) / 100 : 0;
  const valorFrete = frete ? frete.valor : 0;
  const total = Math.max(0, subtotal - desconto + valorFrete);

  const quantidadeTotalItens = itens.reduce((sum, i) => sum + i.quantidade, 0);

  // Helper trigger for micro-updating indicator
  const triggerUpdating = () => {
    setIsUpdating(true);
    setTimeout(() => setIsUpdating(false), 300);
  };

  const adicionarItem = (novoItem: CarrinhoItem) => {
    triggerUpdating();
    setItens((prev) => {
      const idx = prev.findIndex((i) => i.variacaoId === novoItem.variacaoId);
      if (idx >= 0) {
        const clonado = [...prev];
        const novaQtd = clonado[idx].quantidade + novoItem.quantidade;
        clonado[idx] = {
          ...clonado[idx],
          quantidade: novaQtd,
        };
        return clonado;
      }
      return [...prev, novoItem];
    });
  };

  const removerItem = (variacaoId: string) => {
    triggerUpdating();
    setItens((prev) => prev.filter((i) => i.variacaoId !== variacaoId));
  };

  const atualizarQuantidade = (variacaoId: string, quantidade: number) => {
    triggerUpdating();
    if (quantidade <= 0) {
      removerItem(variacaoId);
      return;
    }
    setItens((prev) =>
      prev.map((i) => (i.variacaoId === variacaoId ? { ...i, quantidade } : i))
    );
  };

  const trocarVariacao = (
    variacaoIdAntiga: string,
    novaVariacao: Variacao,
    novoPrecoUnit: number
  ) => {
    triggerUpdating();
    setItens((prev) => {
      const targetIndex = prev.findIndex((i) => i.variacaoId === variacaoIdAntiga);
      if (targetIndex === -1) return prev;

      const itemExistente = prev[targetIndex];
      // Check if target new variation is ALREADY in cart
      const existingInCartIndex = prev.findIndex((i) => i.variacaoId === novaVariacao.id);

      // Max stock for new variation
      const maxStock = Math.max(1, novaVariacao.estoque);

      if (existingInCartIndex >= 0 && existingInCartIndex !== targetIndex) {
        // Merge quantities into existing item with new variation
        const result = [...prev];
        const combinedQty = Math.min(
          maxStock,
          result[existingInCartIndex].quantidade + itemExistente.quantidade
        );
        result[existingInCartIndex] = {
          ...result[existingInCartIndex],
          quantidade: combinedQty,
        };
        // Remove old item
        return result.filter((_, idx) => idx !== targetIndex);
      }

      // Update existing line
      const updated = [...prev];
      updated[targetIndex] = {
        ...itemExistente,
        variacaoId: novaVariacao.id,
        sku: novaVariacao.sku,
        tamanho: novaVariacao.tamanho,
        cor: novaVariacao.cor,
        precoUnit: novoPrecoUnit,
        quantidade: Math.min(itemExistente.quantidade, maxStock),
      };
      return updated;
    });
  };

  const mesclarCarrinhoAoLogar = (clienteId: string) => {
    if (!clienteId) return;
    const userCartKey = `pentagol_carrinho_user_${clienteId}`;
    const rawUserCart = localStorage.getItem(userCartKey);
    let userItens: CarrinhoItem[] = [];

    if (rawUserCart) {
      try {
        userItens = JSON.parse(rawUserCart);
      } catch {
        userItens = [];
      }
    }

    if (itens.length === 0) {
      if (userItens.length > 0) {
        setItens(userItens);
      }
      return;
    }

    // Merge current anonymous items with user items
    const merged = [...userItens];

    itens.forEach((anonItem) => {
      const idx = merged.findIndex((u) => u.variacaoId === anonItem.variacaoId);
      if (idx >= 0) {
        merged[idx].quantidade += anonItem.quantidade;
      } else {
        merged.push(anonItem);
      }
    });

    setItens(merged);
    localStorage.setItem(userCartKey, JSON.stringify(merged));
  };

  const aplicarCupom = (codigo: string): { sucesso: boolean; mensagem: string } => {
    triggerUpdating();
    const cupons = getAll<Cupom>('cupons');
    const codigoClean = codigo.trim().toUpperCase();
    const encontrado = cupons.find(
      (c) => c.ativo && c.codigo.toUpperCase() === codigoClean
    );

    if (!encontrado) {
      return { sucesso: false, mensagem: 'Cupom inválido ou expirado.' };
    }

    const agora = new Date().toISOString();
    if (encontrado.validadeInicio && encontrado.validadeInicio > agora) {
      return { sucesso: false, mensagem: 'Cupom inválido ou expirado.' };
    }
    if (encontrado.validadeFim && encontrado.validadeFim < agora) {
      return { sucesso: false, mensagem: 'Cupom inválido ou expirado.' };
    }
    if (encontrado.usosMaximos !== undefined && encontrado.usos >= encontrado.usosMaximos) {
      return { sucesso: false, mensagem: 'Cupom inválido ou expirado.' };
    }

    if (encontrado.valorMinimoPedido && subtotal < encontrado.valorMinimoPedido) {
      return {
        sucesso: false,
        mensagem: `Este cupom é válido para compras acima de R$ ${encontrado.valorMinimoPedido.toFixed(
          2
        )}.`,
      };
    }

    // Check automatic coupon if active
    const autoCupom = cupons.find(
      (c) => c.ativo && c.automatico && (!c.valorMinimoPedido || subtotal >= c.valorMinimoPedido)
    );

    if (autoCupom && autoCupom.id !== encontrado.id) {
      if (encontrado.percentual < autoCupom.percentual) {
        setCupom(autoCupom);
        return {
          sucesso: true,
          mensagem: `O cupom automático ${autoCupom.codigo} foi mantido por oferecer maior desconto (${autoCupom.percentual}%) que o cupom digitado.`,
        };
      }
    }

    setCupom(encontrado);
    return {
      sucesso: true,
      mensagem: `Cupom ${encontrado.codigo} aplicado com sucesso (${encontrado.percentual}% de desconto)!`,
    };
  };

  const removerCupom = () => {
    triggerUpdating();
    setCupom(null);
  };

  const selecionarFrete = (novoFrete: Frete | null) => {
    triggerUpdating();
    setFrete(novoFrete);
  };

  const limparCarrinho = () => {
    triggerUpdating();
    setItens([]);
    setCupom(null);
    setFrete(null);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  return (
    <CartContext.Provider
      value={{
        itens,
        subtotal,
        desconto,
        cupom,
        frete,
        total,
        isUpdating,
        adicionarItem,
        removerItem,
        atualizarQuantidade,
        trocarVariacao,
        aplicarCupom,
        removerCupom,
        selecionarFrete,
        limparCarrinho,
        quantidadeTotalItens,
        mesclarCarrinhoAoLogar,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
