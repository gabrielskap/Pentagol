import { CarrinhoItem } from '../types';

export interface ConsolidaçãoEmbalagem {
  pesoRealKg: number;
  pesoCubadoKg: number;
  pesoConsideradoKg: number;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
  volumétricoCm3: number;
}

/**
 * Consolidates dimensions and total weight for shipping calculations (PAC/SEDEX Correios).
 * - Sums real weight across all items & quantities
 * - Stacks heights (sum of height * quantity)
 * - Finds max width and max length across items
 * - Enforces Correios minimum box bounds (16 x 11 x 2 cm)
 * - Calculates cubage weight (L x W x H / 6000)
 * - Considers max(pesoReal, pesoCubado)
 */
export function consolidarEmbalagem(itens: CarrinhoItem[]): ConsolidaçãoEmbalagem {
  if (!itens || itens.length === 0) {
    return {
      pesoRealKg: 0.3,
      pesoCubadoKg: 0.058,
      pesoConsideradoKg: 0.3,
      alturaCm: 2,
      larguraCm: 11,
      comprimentoCm: 16,
      volumétricoCm3: 352,
    };
  }

  let pesoTotalReal = 0;
  let alturaEmpilhada = 0;
  let larguraMax = 0;
  let comprimentoMax = 0;

  for (const item of itens) {
    const qtd = Math.max(1, item.quantidade || 1);
    const pesoUnit = item.pesoKg && item.pesoKg > 0 ? item.pesoKg : 0.5;
    pesoTotalReal += pesoUnit * qtd;

    const altUnit = item.dimensoes?.alturaCm && item.dimensoes.alturaCm > 0 ? item.dimensoes.alturaCm : 5;
    const largUnit = item.dimensoes?.larguraCm && item.dimensoes.larguraCm > 0 ? item.dimensoes.larguraCm : 15;
    const compUnit = item.dimensoes?.comprimentoCm && item.dimensoes.comprimentoCm > 0 ? item.dimensoes.comprimentoCm : 20;

    alturaEmpilhada += altUnit * qtd;
    if (largUnit > larguraMax) larguraMax = largUnit;
    if (compUnit > comprimentoMax) comprimentoMax = compUnit;
  }

  // Correios minimum dimensions
  const alturaFinal = Math.max(alturaEmpilhada, 2);
  const larguraFinal = Math.max(larguraMax, 11);
  const comprimentoFinal = Math.max(comprimentoMax, 16);

  const volumétrico = alturaFinal * larguraFinal * comprimentoFinal;
  // Correios cubage formula: (C x L x A) / 6000
  const pesoCubadoKg = Number((volumétrico / 6000).toFixed(3));
  const pesoConsideradoKg = Number(Math.max(pesoTotalReal, pesoCubadoKg).toFixed(3));

  return {
    pesoRealKg: Number(pesoTotalReal.toFixed(3)),
    pesoCubadoKg,
    pesoConsideradoKg,
    alturaCm: Math.round(alturaFinal),
    larguraCm: Math.round(larguraFinal),
    comprimentoCm: Math.round(comprimentoFinal),
    volumétricoCm3: Math.round(volumétrico),
  };
}

/* -------------------------------------------------------------------------- */
/* TESTES DE EXEMPLO (CONSOLIDACAO DE EMBALAGEM)                             */
/* -------------------------------------------------------------------------- */
/*
// Teste 1: Item unico - Chuteira (0.75kg, 12x20x32 cm)
// Entrada: [{ pesoKg: 0.75, quantidade: 1, dimensoes: { alturaCm: 12, larguraCm: 20, comprimentoCm: 32 } }]
// Resultado esperado:
// - pesoRealKg: 0.750 kg
// - dimensoes: 12x20x32 cm -> volume: 7680 cm3 -> pesoCubadoKg: 7680 / 6000 = 1.280 kg
// - pesoConsideradoKg: max(0.750, 1.280) = 1.280 kg (cubado e maior)

// Teste 2: Múltiplos itens pequenos (2 meias 0.15kg, 5x12x20 cm)
// Entrada: [{ pesoKg: 0.15, quantidade: 2, dimensoes: { alturaCm: 5, larguraCm: 12, comprimentoCm: 20 } }]
// Resultado esperado:
// - pesoRealKg: 0.300 kg
// - alturaEmpilhada: 5 * 2 = 10 cm, largura: 12 cm, comprimento: 20 cm
// - volume: 10 * 12 * 20 = 2400 cm3 -> pesoCubadoKg: 0.400 kg
// - pesoConsideradoKg: 0.400 kg

// Teste 3: Item abaixo dos minimos Correios (0.05kg, 1x5x10 cm)
// Entrada: [{ pesoKg: 0.05, quantidade: 1, dimensoes: { alturaCm: 1, larguraCm: 5, comprimentoCm: 10 } }]
// Resultado esperado:
// - Aplicacao dos limites minimos Correios: altura -> 2cm, largura -> 11cm, comprimento -> 16cm
// - volume: 2 * 11 * 16 = 352 cm3 -> pesoCubadoKg: 0.058 kg
// - pesoConsideradoKg: max(0.050, 0.058) = 0.058 kg
*/
