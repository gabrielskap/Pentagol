import { CarrinhoItem, Frete } from '../types';
import { IFreteService } from './types';
import { consolidarEmbalagem } from '../lib/embalagem';
import { getConfigLoja } from '../lib/db';

export type FreteDevScenario = 'normal' | 'erro_webservice' | 'cep_nao_atendido' | 'prazo_indisponivel';

let currentDevScenario: FreteDevScenario = 'normal';

export function setFreteDevScenario(scenario: FreteDevScenario) {
  currentDevScenario = scenario;
  localStorage.setItem('pentagol_frete_dev_scenario', scenario);
}

export function getFreteDevScenario(): FreteDevScenario {
  const saved = localStorage.getItem('pentagol_frete_dev_scenario') as FreteDevScenario;
  if (saved) currentDevScenario = saved;
  return currentDevScenario;
}

export class MockFreteService implements IFreteService {
  async calcularFrete(
    cepDestino: string,
    pesoTotalKg: number,
    subtotal: number,
    itens?: CarrinhoItem[]
  ): Promise<Frete[]> {
    // Artificial 800ms delay to simulate real web service lookup
    await new Promise((resolve) => setTimeout(resolve, 800));

    const scenario = getFreteDevScenario();

    if (scenario === 'erro_webservice') {
      throw new Error('Não foi possível conectar com o serviço de frete dos Correios. Tente novamente.');
    }
    if (scenario === 'cep_nao_atendido') {
      throw new Error('CEP não atendido pela transportadora para esta modalidade de entrega.');
    }
    if (scenario === 'prazo_indisponivel') {
      throw new Error('Prazo de entrega indisponível para o CEP informado.');
    }

    const clean = cepDestino.replace(/\D/g, '');
    if (clean.length !== 8) {
      throw new Error('CEP inválido. Deve conter 8 dígitos.');
    }

    const embalagem = itens ? consolidarEmbalagem(itens) : null;
    const pesoEfetivoKg = embalagem ? embalagem.pesoConsideradoKg : Math.max(0.3, pesoTotalKg);

    const configLoja = getConfigLoja();
    const prazoAdicional = configLoja?.prazoAdicionalDias || 2;
    const freteGratisThreshold = configLoja?.freteGratisAcimaDe || 299.9;

    // Region Faixas based on CEP prefixes
    const prefix = parseInt(clean.substring(0, 2), 10);
    let basePac = 22.90;
    let baseSedex = 38.90;
    let diasPac = 5;
    let diasSedex = 2;
    let regiaoNome = 'Brasil Outras Regiões';

    if (prefix >= 30 && prefix <= 39) {
      // Minas Gerais (BH / Interior)
      basePac = 16.90;
      baseSedex = 22.50;
      diasPac = 2;
      diasSedex = 1;
      regiaoNome = 'MG (Sudeste)';
    } else if ((prefix >= 1 && prefix <= 29)) {
      // Sudeste (SP / RJ / ES)
      basePac = 21.90;
      baseSedex = 34.50;
      diasPac = 4;
      diasSedex = 2;
      regiaoNome = 'Sudeste (SP/RJ/ES)';
    } else if ((prefix >= 70 && prefix <= 99)) {
      // Sul e Centro-Oeste
      basePac = 26.50;
      baseSedex = 44.90;
      diasPac = 6;
      diasSedex = 3;
      regiaoNome = 'Sul / Centro-Oeste';
    } else if (prefix >= 40 && prefix <= 65) {
      // Nordeste
      basePac = 32.90;
      baseSedex = 58.90;
      diasPac = 8;
      diasSedex = 4;
      regiaoNome = 'Nordeste';
    } else {
      // Norte
      basePac = 39.90;
      baseSedex = 69.90;
      diasPac = 10;
      diasSedex = 5;
      regiaoNome = 'Norte';
    }

    // Additional price per kg over 1kg
    const extraKg = Math.max(0, pesoEfetivoKg - 1);
    const taxaPac = Number((basePac + extraKg * 4.50).toFixed(2));
    const taxaSedex = Number((baseSedex + extraKg * 8.00).toFixed(2));

    // Check free shipping condition for PAC
    const isPacGratis = subtotal >= freteGratisThreshold;
    const valorPacFinal = isPacGratis ? 0 : taxaPac;

    return [
      {
        servico: 'PAC',
        valor: valorPacFinal,
        prazoDias: diasPac + prazoAdicional,
        transportadora: `Correios PAC (${regiaoNome})`,
      },
      {
        servico: 'SEDEX',
        valor: taxaSedex,
        prazoDias: diasSedex + prazoAdicional,
        transportadora: `Correios SEDEX Express (${regiaoNome})`,
      },
    ];
  }
}

export class HttpFreteService implements IFreteService {
  async calcularFrete(
    cepDestino: string,
    pesoTotalKg: number,
    subtotal: number,
    itens?: CarrinhoItem[]
  ): Promise<Frete[]> {
    /*
     * TODO: Endpoint real para cálculo de frete via Correios / Frenet / Melhor Envio.
     * 
     * Chamada via servidor backend:
     * POST /api/frete/calcular
     * Request Body:
     * {
     *   cepOrigem: "30110-000",
     *   cepDestino: "30130-010",
     *   pesoTotalKg: 1.25,
     *   subtotal: 250.00,
     *   itens: [ ... ]
     * }
     * 
     * MOTIVO DA IMPLEMENTAÇÃO SERVER-SIDE:
     * A API oficial dos Correios (ou provedores como Frenet / Melhor Envio) exige credenciais
     * privadas (Código de Contrato, Senha/Token de API) que não devem ser expostas no navegador.
     * Além disso, as requisições diretas aos servidores dos Correios via client-side sofrem bloqueio de CORS.
     */
    console.warn('HttpFreteService: Chamada ao servidor de frete em ambiente de desenvolvimento fallback para MockFreteService.');
    const mock = new MockFreteService();
    return mock.calcularFrete(cepDestino, pesoTotalKg, subtotal, itens);
  }
}
