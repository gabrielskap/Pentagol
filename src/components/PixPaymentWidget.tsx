import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MessageCircle,
  QrCode,
  RefreshCw,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { Pedido } from '../types';
import {
  ErpSimulacaoModo,
  NfeSimulacaoModo,
  pixService,
  setModoSimulacaoErp,
  setModoSimulacaoNfe,
} from '../services';
import { processarConfirmacaoPagamento, processarExpiracaoPix } from '../lib/orderProcessor';
import { getConfigLoja } from '../lib/db';

interface PixPaymentWidgetProps {
  pedido: Pedido;
  onPaymentConfirmed?: (pedidoAtualizado: Pedido) => void;
  onPixExpired?: (pedidoExpirado: Pedido) => void;
  onRegeneratePix?: () => void;
}

export const PixPaymentWidget: React.FC<PixPaymentWidgetProps> = ({
  pedido,
  onPaymentConfirmed,
  onPixExpired,
  onRegeneratePix,}) => {
  const [copiado, setCopiado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState<number>(0);
  const [verificando, setVerificando] = useState(false);
  const [simulandoErroConexao, setSimulandoErroConexao] = useState(false);
  const [painelDevAberto, setPainelDevAberto] = useState(true);
  const config = getConfigLoja();

  // 1. Calculate initial remaining seconds
  useEffect(() => {
    if (!pedido.pix?.expiraEm) return;

    const calcularTempo = () => {
      const expira = new Date(pedido.pix.expiraEm).getTime();
      const agora = Date.now();
      const diffSegundos = Math.max(0, Math.floor((expira - agora) / 1000));
      setTempoRestante(diffSegundos);

      if (diffSegundos === 0 && pedido.status === 'aguardando_pix') {
        const pExpirado = processarExpiracaoPix(pedido.id);
        if (pExpirado && onPixExpired) {
          onPixExpired(pExpirado);
        }
      }
    };

    calcularTempo();
    const timerInterval = setInterval(calcularTempo, 1000);
    return () => clearInterval(timerInterval);
  }, [pedido.pix?.expiraEm, pedido.status, pedido.id]);

  // 2. Polling every 5 seconds while waiting for PIX confirmation
  useEffect(() => {
    if (pedido.status !== 'aguardando_pix' || !pedido.pix?.txid) return;

    const verificarStatus = async () => {
      if (simulandoErroConexao) return;
      setVerificando(true);
      try {
        const res = await pixService.consultarStatus(pedido.pix.txid);
        if (res.pago) {
          const pConfirmado = await processarConfirmacaoPagamento(pedido.id);
          if (pConfirmado && onPaymentConfirmed) {
            onPaymentConfirmed(pConfirmado);
          }
        }
      } catch (err) {
        console.error('Erro ao consultar status do Pix:', err);
      } finally {
        setVerificando(false);
      }
    };

    // Initial check on mount
    verificarStatus();

    const pollingInterval = setInterval(verificarStatus, 5000);
    return () => clearInterval(pollingInterval);
  }, [pedido.status, pedido.pix?.txid, pedido.id, simulandoErroConexao]);

  // Copy Copia e Cola Payload
  const handleCopiarPix = () => {
    if (pedido.pix?.copiaECola) {
      navigator.clipboard.writeText(pedido.pix.copiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  // Format seconds to mm:ss
  const formatarMinutosSegundos = (segundosTotais: number) => {
    const mins = Math.floor(segundosTotais / 60);
    const segs = segundosTotais % 60;
    return `${mins.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  // Dev Simulation Handlers
  const handleSimularConfirmacao = async (
    modoErp: ErpSimulacaoModo = 'sucesso',
    modoNfe: NfeSimulacaoModo = 'sucesso'
  ) => {
    if (!pedido.pix?.txid) return;
    setModoSimulacaoErp(modoErp);
    setModoSimulacaoNfe(modoNfe);
    await pixService.simularConfirmacao(pedido.pix.txid);
    const pConfirmado = await processarConfirmacaoPagamento(pedido.id);
    if (pConfirmado && onPaymentConfirmed) {
      onPaymentConfirmed(pConfirmado);
    }
  };

  const handleSimularExpiracao = async () => {
    if (!pedido.pix?.txid) return;
    await pixService.simularExpiracao(pedido.pix.txid);
    const pExpirado = processarExpiracaoPix(pedido.id);
    if (pExpirado && onPixExpired) {
      onPixExpired(pExpirado);
    }
  };

  // Status: PAID
  if (pedido.status === 'pago') {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-500 p-6 shadow-xs text-center space-y-4 font-body">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <h3 className="font-pg-display text-xl font-bold uppercase text-emerald-950 italic">
            PAGAMENTO PIX CONFIRMADO!
          </h3>
          <p className="text-xs text-emerald-800 mt-1">
            Seu pagamento foi liquidação bancária confirmada em{' '}
            <strong>{pedido.pix?.pagoEm ? new Date(pedido.pix.pagoEm).toLocaleString('pt-BR') : 'agora'}</strong>.
          </p>
        </div>
        <div className="bg-white border border-emerald-200 p-3 text-xs text-gray-700 max-w-md mx-auto space-y-1 text-left font-mono">
          <p>• Transação ID (txid): {pedido.pix?.txid}</p>
          <p>• Valor Pago: R$ {pedido.total.toFixed(2).replace('.', ',')}</p>
          <p>• NF-e: {pedido.nf?.numero ? `Emissão Nº ${pedido.nf.numero}` : 'Em processamento'}</p>
        </div>
      </div>
    );
  }

  // Status: EXPIRED
  if (pedido.status === 'pix_expirado' || tempoRestante === 0) {
    return (
      <div className="bg-red-50 border-2 border-pg-red p-6 shadow-xs text-center space-y-4 font-body">
        <div className="w-16 h-16 bg-red-100 text-pg-red rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10" />
        </div>
        <div>
          <h3 className="font-pg-display text-xl font-bold uppercase text-pg-red italic">
            CHAVE PIX EXPIRADA
          </h3>
          <p className="text-xs text-gray-700 mt-1">
            Esta chave Pix expirou após o limite de tempo de 30 minutos sem confirmação do banco.
          </p>
        </div>

        {onRegeneratePix && (
          <button
            type="button"
            onClick={onRegeneratePix}
            className="bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-xs font-bold uppercase px-6 py-3 shadow-md inline-flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>GERAR NOVO PIX DE PAGAMENTO</span>
          </button>
        )}
      </div>
    );
  }

  // Active Waiting PIX Screen
  const linkWhatsapp = `https://wa.me/55${(config?.whatsapp || '31999999999').replace(/\D/g, '')}?text=${encodeURIComponent(
    `Olá! Preciso de ajuda com o pagamento Pix do Pedido #${pedido.numero} (Valor: R$ ${pedido.total.toFixed(2)})`
  )}`;

  return (
    <div className="bg-white border-2 border-pg-petrol p-6 shadow-md space-y-6 font-body">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <span className="bg-pg-yellow text-pg-ink font-pg-display text-[11px] font-bold px-2.5 py-0.5 uppercase italic">
            AGUARDANDO PAGAMENTO
          </span>
          <h3 className="font-pg-display text-lg sm:text-xl font-bold uppercase text-pg-ink tracking-wide mt-1">
            PAGAMENTO EXCLUSIVO VIA PIX
          </h3>
        </div>

        {/* TIMER COUNTER */}
        <div className="bg-amber-50 border-2 border-amber-400 px-4 py-2 text-center rounded-xs shrink-0">
          <p className="text-[10px] font-pg-display font-bold uppercase text-amber-800 flex items-center justify-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>EXPIRA EM:</span>
          </p>
          <span className="font-mono text-2xl font-extrabold text-amber-900 tracking-wider">
            {formatarMinutosSegundos(tempoRestante)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* QR CODE COL */}
        <div className="md:col-span-5 text-center space-y-3">
          <div className="bg-gray-50 border-2 border-gray-300 p-4 inline-block shadow-xs">
            {pedido.pix?.qrCodeImagem ? (
              <img
                src={pedido.pix.qrCodeImagem}
                alt="QR Code PIX PENTAGOL"
                className="w-52 h-52 object-contain mx-auto"
              />
            ) : (
              <div className="w-52 h-52 bg-gray-200 flex items-center justify-center font-mono text-xs text-gray-500">
                QR Code Indisponível
              </div>
            )}
          </div>
          <p className="text-[11px] text-gray-500 italic">
            Abra o app do seu banco e escaneie a imagem acima
          </p>
        </div>

        {/* DETAILS & COPIA E COLA COL */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-gray-50 p-4 border border-gray-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-500">Valor Total a Pagar:</span>
            <p className="text-3xl font-extrabold text-pg-red font-body">
              R$ {pedido.total.toFixed(2).replace('.', ',')}
            </p>
          </div>

          <div className="space-y-2">
            <label className="font-pg-display text-xs font-bold uppercase text-gray-800 block">
              PIX COPIA E COLA (PAYLOAD BR CODE):
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                readOnly
                value={pedido.pix?.copiaECola || ''}
                className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-xs font-mono text-gray-600 truncate cursor-not-allowed"
              />
              <button
                type="button"
                onClick={handleCopiarPix}
                className="bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-xs font-bold uppercase px-4 py-2 shrink-0 flex items-center space-x-1.5 shadow-xs"
              >
                <Copy className="w-4 h-4" />
                <span>{copiado ? 'CÓDIGO COPIADO!' : 'COPIAR PIX'}</span>
              </button>
            </div>
            {copiado && (
              <p className="text-xs font-bold text-emerald-700 flex items-center space-x-1 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Código Pix copiado para a área de transferência! Cole no app do seu banco.</span>
              </p>
            )}
          </div>

          {/* 3 STEP INSTRUCTIONS */}
          <div className="bg-gray-50 border border-gray-200 p-4 space-y-2 text-xs">
            <p className="font-pg-display font-bold uppercase text-pg-ink">
              INSTRUÇÕES EM 3 PASSOS FÁCEIS:
            </p>
            <ol className="list-decimal pl-4 space-y-1.5 text-gray-700">
              <li>
                Abra o aplicativo do seu banco (Itaú, Bradesco, Nubank, Banco do Brasil, Santander, Caixa, Inter, etc.) e selecione a opção <strong>PIX</strong>.
              </li>
              <li>
                Escolha a opção <strong>Pagar com QR Code</strong> ou <strong>Pix Copia e Cola</strong> e insira o código acima.
              </li>
              <li>
                Confirme as informações do beneficiário (<strong>PENTAGOL ESPORTES</strong>) e conclua o pagamento.
              </li>
            </ol>
          </div>
        </div>

      </div>

      {/* WARNING NOTICE & WHATSAPP SUPPORT */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-gray-200 text-xs">
        <div className="flex items-center space-x-2 text-gray-600">
          <RefreshCw className={`w-4 h-4 text-pg-petrol ${verificando ? 'animate-spin' : ''}`} />
          <span className="font-mono text-[11px]">
            {verificando
              ? 'Verificando liquidação no banco...'
              : 'Pode levar alguns segundos para o banco confirmar a liquidação.'}
          </span>
        </div>

        <a
          href={linkWhatsapp}
          target="_blank"
          rel="noreferrer"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-pg-display text-xs font-bold uppercase px-4 py-2 rounded-xs flex items-center space-x-2 shrink-0 shadow-xs"
        >
          <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
          <span>DÚVIDAS? FALAR NO WHATSAPP</span>
        </a>
      </div>

      {/* DEV SIMULATION PANEL */}
      <div className="border-t-2 border-amber-300 pt-4 space-y-3 bg-amber-50/70 p-4 border text-xs text-amber-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 font-pg-display font-bold uppercase text-amber-900">
            <Settings className="w-4 h-4 text-amber-700" />
            <span>Painel de Simulação Demo — PIX Realtime</span>
          </div>
          <button
            type="button"
            onClick={() => setPainelDevAberto(!painelDevAberto)}
            className="text-[10px] font-mono font-bold text-amber-800 underline uppercase"
          >
            {painelDevAberto ? 'Ocultar Painel' : 'Expandir Painel'}
          </button>
        </div>

        {painelDevAberto && (
          <div className="space-y-3 pt-1">
            <p className="text-[11px] text-amber-900">
              Utilize os botões abaixo para simular os retornos do Banco Central e testar as automações de baixa de estoque e emissão de NF-e:
            </p>

            <div className="flex flex-wrap gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleSimularConfirmacao('sucesso', 'sucesso')}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-pg-display font-bold uppercase px-3 py-2 flex items-center space-x-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>1. Sucesso Total (Pago + ERP + NF-e)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimularConfirmacao('sucesso', 'rejeicao_cpf')}
                className="bg-amber-700 hover:bg-amber-800 text-white font-pg-display font-bold uppercase px-3 py-2 flex items-center space-x-1.5 shadow-xs"
              >
                <AlertCircle className="w-4 h-4" />
                <span>2. Rejeição SEFAZ (CPF Inválido)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimularConfirmacao('sucesso', 'rejeicao_cfop')}
                className="bg-amber-800 hover:bg-amber-900 text-white font-pg-display font-bold uppercase px-3 py-2 flex items-center space-x-1.5 shadow-xs"
              >
                <AlertCircle className="w-4 h-4" />
                <span>3. Rejeição SEFAZ (CFOP)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimularConfirmacao('sucesso', 'timeout_emissor')}
                className="bg-purple-800 hover:bg-purple-900 text-white font-pg-display font-bold uppercase px-3 py-2 flex items-center space-x-1.5 shadow-xs"
              >
                <Clock className="w-4 h-4" />
                <span>4. Timeout Emissor NF-e</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimularConfirmacao('indisponivel', 'sucesso')}
                className="bg-orange-800 hover:bg-orange-900 text-white font-pg-display font-bold uppercase px-3 py-2 flex items-center space-x-1.5 shadow-xs"
              >
                <AlertCircle className="w-4 h-4" />
                <span>5. Indisponibilidade SupraSoft ERP</span>
              </button>

              <button
                type="button"
                onClick={handleSimularExpiracao}
                className="bg-pg-red hover:bg-opacity-90 text-white font-pg-display font-bold uppercase px-3 py-2 flex items-center space-x-1.5 shadow-xs"
              >
                <Clock className="w-4 h-4" />
                <span>Simular Expiração PIX</span>
              </button>

              <button
                type="button"
                onClick={() => setSimulandoErroConexao(!simulandoErroConexao)}
                className={`font-pg-display font-bold uppercase px-3 py-2 flex items-center space-x-1.5 border ${
                  simulandoErroConexao
                    ? 'bg-amber-900 text-white border-amber-950'
                    : 'bg-white text-amber-900 border-amber-400 hover:bg-amber-100'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>
                  {simulandoErroConexao ? 'Reativar Conexão Banco' : 'Simular Falha de Conexão'}
                </span>
              </button>
            </div>

            {simulandoErroConexao && (
              <p className="text-[11px] font-mono text-pg-red font-bold">
                ⚠️ Conexão simulada com o PSP/Banco interrompida. O polling está pausado.
              </p>
            )}

            {/* PRODUCTION WEBHOOK EXPLANATORY NOTE */}
            <div className="bg-white border border-amber-300 p-3 text-[11px] text-gray-700 font-mono space-y-1 rounded-xs">
              <p className="font-bold text-amber-900 font-sans">
                ℹ️ Arquitetura de Produção — Webhooks Banco Central:
              </p>
              <p>
                • O navegador do cliente <strong>NÃO</strong> recebe o webhook do banco diretamente.
              </p>
              <p>
                • O PSP do banco chama a rota backend <code>POST /api/webhooks/pix</code> com certificado mTLS.
              </p>
              <p>
                • O backend valida a assinatura, garante a idempotência por <code>txid</code>, baixa o estoque e notifica a tela via SSE/WebSocket.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
