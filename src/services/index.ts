import { HttpCepService, MockCepService } from './cepService';
import { HttpErpService, MockErpService } from './erpService';
import { HttpFreteService, MockFreteService } from './freteService';
import { HttpNfeService, MockNfeService } from './nfeService';
import { HttpPixService, MockPixService } from './pixService';
import { ICepService, IErpService, IFreteService, INfeService, IPixService } from './types';

// Select implementation based on environment variable VITE_SERVICE_MODE ('http' or default 'mock')
const mode = ((import.meta as any).env?.VITE_SERVICE_MODE || 'mock').toLowerCase();
const isHttp = mode === 'http';

export const cepService: ICepService = isHttp ? new HttpCepService() : new MockCepService();
export const freteService: IFreteService = isHttp ? new HttpFreteService() : new MockFreteService();
export const pixService: IPixService = isHttp ? new HttpPixService() : new MockPixService();
export const nfeService: INfeService = isHttp ? new HttpNfeService() : new MockNfeService();
export const erpService: IErpService = isHttp ? new HttpErpService() : new MockErpService();

export * from './types';
export * from './mapeamentoErp';
export * from './fila';
export { setModoSimulacaoErp, getModoSimulacaoErp } from './erpService';
export type { ErpSimulacaoModo } from './erpService';
export { setModoSimulacaoNfe, getModoSimulacaoNfe, SefazRejeicaoError } from './nfeService';
export type { NfeSimulacaoModo } from './nfeService';
