import { EnderecoCepResponse, ICepService } from './types';

export class MockCepService implements ICepService {
  async consultarCep(cep: string): Promise<EnderecoCepResponse> {
    const limpo = cep.replace(/\D/g, '');
    if (limpo.length !== 8) {
      throw new Error('CEP inválido. Deve conter 8 dígitos.');
    }

    // Mock responses for common CEPs or generic BH fallback
    if (limpo.startsWith('30') || limpo.startsWith('31')) {
      return {
        cep: `${limpo.substring(0, 5)}-${limpo.substring(5)}`,
        rua: 'Avenida Afonso Pena',
        bairro: 'Centro',
        cidade: 'Belo Horizonte',
        uf: 'MG',
      };
    }

    return {
      cep: `${limpo.substring(0, 5)}-${limpo.substring(5)}`,
      rua: 'Rua das Flores',
      bairro: 'Bairro Central',
      cidade: 'Belo Horizonte',
      uf: 'MG',
    };
  }
}

export class HttpCepService implements ICepService {
  async consultarCep(cep: string): Promise<EnderecoCepResponse> {
    const limpo = cep.replace(/\D/g, '');
    // TODO: Endpoint real da API ViaCEP (https://viacep.com.br/ws/{cep}/json/)
    const response = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
    if (!response.ok) {
      throw new Error('Falha ao consultar CEP no serviço ViaCEP');
    }
    const data = await response.json();
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }
    return {
      cep: data.cep,
      rua: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      uf: data.uf || '',
    };
  }
}
