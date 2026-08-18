import { PedidoPix } from '../types';
import { IPixService } from './types';
import { getConfigLoja } from '../lib/db';

/**
 * Generates CRC16-CCITT (0x1021) polynomial checksum required by EMV BR Code standard.
 */
function calcularCRC16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    const byte = payload.charCodeAt(i);
    crc ^= byte << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formats EMV BR Code string according to Banco Central do Brasil specifications.
 * DEMO KEY USED: financeiro@pentagol.com.br (Chave Pix E-mail)
 */
function gerarBRCodePayload(txid: string, valorTotal: number): string {
  const chavePixDemo = 'financeiro@pentagol.com.br';
  const nomeBeneficiario = 'PENTAGOL ESPORTES';
  const cidadeBeneficiario = 'BELO HORIZONTE';
  const valorStr = valorTotal.toFixed(2);

  // Field 26: Merchant Account Information - PIX
  const gui = '0014br.gov.bcb.pix';
  const chave = `01${chavePixDemo.length.toString().padStart(2, '0')}${chavePixDemo}`;
  const campo26Conteudo = `${gui}${chave}`;
  const campo26 = `26${campo26Conteudo.length.toString().padStart(2, '0')}${campo26Conteudo}`;

  // Field 52: Merchant Category Code (0000 = General)
  const campo52 = '52040000';
  // Field 53: Transaction Currency (986 = BRL)
  const campo53 = '5303986';
  // Field 54: Transaction Amount
  const campo54 = `54${valorStr.length.toString().padStart(2, '0')}${valorStr}`;
  // Field 58: Country Code
  const campo58 = '5802BR';
  // Field 59: Merchant Name
  const campo59 = `59${nomeBeneficiario.length.toString().padStart(2, '0')}${nomeBeneficiario}`;
  // Field 60: Merchant City
  const campo60 = `60${cidadeBeneficiario.length.toString().padStart(2, '0')}${cidadeBeneficiario}`;
  // Field 62: Additional Data Field Template (txid)
  const campoTxid = `05${txid.length.toString().padStart(2, '0')}${txid}`;
  const campo62 = `62${campoTxid.length.toString().padStart(2, '0')}${campoTxid}`;

  const payloadSemCRC = `000201${campo26}${campo52}${campo53}${campo54}${campo58}${campo59}${campo60}${campo62}6304`;
  const crc = calcularCRC16(payloadSemCRC);

  return `${payloadSemCRC}${crc}`;
}

export class MockPixService implements IPixService {
  async criarCobranca(params: {
    pedidoId: string;
    valorTotal: number;
    cpfPagador?: string;
    nomePagador?: string;
    expiraEmMinutos?: number;
  }): Promise<PedidoPix> {
    const config = getConfigLoja();
    const minutos = params.expiraEmMinutos || config?.pixExpiracaoMinutos || 30;

    const txid = `PGTX${Date.now()}${Math.floor(100 + Math.random() * 899)}`;
    const expiraEm = new Date(Date.now() + minutos * 60 * 1000).toISOString();

    const copiaECola = gerarBRCodePayload(txid, params.valorTotal);
    const qrCodeImagem = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(copiaECola)}`;

    // Set initial status as pending in localStorage
    localStorage.setItem(`pentagol_pix_status_${txid}`, JSON.stringify({ status: 'aguardando', pagoEm: null }));

    return {
      txid,
      qrCodeImagem,
      copiaECola,
      expiraEm,
    };
  }

  async gerarPix(
    pedidoId: string,
    valorTotal: number,
    cpfPagador?: string,
    nomePagador?: string,
    expiraEmMinutos?: number
  ): Promise<PedidoPix> {
    return this.criarCobranca({
      pedidoId,
      valorTotal,
      cpfPagador,
      nomePagador,
      expiraEmMinutos,
    });
  }

  async consultarStatus(txid: string): Promise<{ pago: boolean; pagoEm?: string }> {
    const raw = localStorage.getItem(`pentagol_pix_status_${txid}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.status === 'pago') {
          return { pago: true, pagoEm: parsed.pagoEm || new Date().toISOString() };
        }
      } catch (e) {
        console.error('Error parsing pix status:', e);
      }
    }
    return { pago: false };
  }

  async verificarStatusPix(txid: string): Promise<{ pago: boolean; pagoEm?: string }> {
    return this.consultarStatus(txid);
  }

  async simularConfirmacao(txid: string): Promise<boolean> {
    const pagoEm = new Date().toISOString();
    localStorage.setItem(
      `pentagol_pix_status_${txid}`,
      JSON.stringify({ status: 'pago', pagoEm })
    );
    return true;
  }

  async simularExpiracao(txid: string): Promise<boolean> {
    localStorage.setItem(
      `pentagol_pix_status_${txid}`,
      JSON.stringify({ status: 'expirado', pagoEm: null })
    );
    return true;
  }
}

export class HttpPixService implements IPixService {
  /**
   * TODO: Integração oficial com a API Pix do Banco Central / Gateway PSP (e.g., Gerencianet/Efi, Itaú, Mercado Pago, Santander).
   * 
   * DECLARAÇÃO DE ENDPOINTS HTTP BACKEND:
   * 1. POST /api/pix/cobranca
   *    - Request Body: { pedidoId: string, valorTotal: number, cpfPagador: string, nomePagador: string, expiraEmMinutos: number }
   *    - Response: { txid: string, copiaECola: string, qrCodeImagem: string, expiraEm: string }
   * 
   * 2. GET /api/pix/cobranca/{txid}
   *    - Response: { txid: string, status: 'CONCLUIDA' | 'ATIVA' | 'EXPIRADA', pago: boolean, pagoEm?: string }
   * 
   * REQUISITOS OBRIGATÓRIOS DE SEGURANÇA E INFRAESTRUTURA:
   * - A API oficial do Banco Central exige autenticação mTLS (Certificado Digital .p12/.pem de Produção).
   * - NENHUMA CREDENCIAL (Client ID, Client Secret, Certificados Chave Privada) PODE ESTAR NO FRONTEND DA APLICAÇÃO.
   * - Todas as chamadas ao PSP e recebimento de Webhooks do banco devem ser executadas server-side.
   */
  async criarCobranca(params: {
    pedidoId: string;
    valorTotal: number;
    cpfPagador?: string;
    nomePagador?: string;
    expiraEmMinutos?: number;
  }): Promise<PedidoPix> {
    console.warn('HttpPixService: POST /api/pix/cobranca pendente de servidor backend mTLS.');
    throw new Error('Integração com API Pix do banco exige execução server-side via backend com mTLS.');
  }

  async gerarPix(
    pedidoId: string,
    valorTotal: number,
    cpfPagador?: string,
    nomePagador?: string,
    expiraEmMinutos?: number
  ): Promise<PedidoPix> {
    return this.criarCobranca({ pedidoId, valorTotal, cpfPagador, nomePagador, expiraEmMinutos });
  }

  async consultarStatus(txid: string): Promise<{ pago: boolean; pagoEm?: string }> {
    console.warn('HttpPixService: GET /api/pix/cobranca/{txid} pendente de servidor backend.');
    throw new Error('Serviço HTTP PIX pendente de backend.');
  }

  async verificarStatusPix(txid: string): Promise<{ pago: boolean; pagoEm?: string }> {
    return this.consultarStatus(txid);
  }
}
