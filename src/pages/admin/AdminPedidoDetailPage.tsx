import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  FileCode,
  FileText,
  MessageSquare,
  QrCode,
  RefreshCw,
  Send,
  Truck,
  Wrench,
  XCircle,
} from 'lucide-react';
import { getAll, upsert } from '../../lib/db';
import { enfileirarJob, processarFila } from '../../services/fila';
import { Pedido, PedidoStatus, Variacao } from '../../types';

export const AdminPedidoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [copiadoPix, setCopiadoPix] = useState(false);

  useEffect(() => {
    recarregarPedido();
  }, [id]);

  const recarregarPedido = () => {
    const todos = getAll<Pedido>('pedidos');
    const p = todos.find((item) => item.id === id);
    if (p) {
      setPedido(p);
      setCodigoRastreio(p.rastreio?.codigo || p.frete?.codigoRastreio || '');
    }
  };

  if (!pedido) {
    return (
      <div className="bg-white p-8 text-center border border-gray-200">
        <p className="font-pg-display text-lg text-pg-red mb-2">PEDIDO NÃO ENCONTRADO</p>
        <Link
          to="/admin/pedidos"
          className="bg-pg-petrol text-white px-4 py-2 text-xs font-pg-display inline-flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>VOLTAR PARA A LISTA DE PEDIDOS</span>
        </Link>
      </div>
    );
  }

  const handleAtualizarStatus = (novoStatus: PedidoStatus, detalheCustom?: string) => {
    if (!pedido) return;
    const pAtualizado: Pedido = {
      ...pedido,
      status: novoStatus,
      timeline: [
        ...pedido.timeline,
        {
          em: new Date().toISOString(),
          evento: `Status alterado para ${novoStatus.toUpperCase()}`,
          detalhe: detalheCustom || 'Alteração manual de status via Painel Administrativo Pentagol',
        },
      ],
    };

    upsert('pedidos', pAtualizado);
    setPedido(pAtualizado);
    alert(`Status alterado com sucesso para ${novoStatus.toUpperCase()}!`);
  };

  const handleEmitirNFe = async () => {
    if (!pedido) return;
    setProcessando(true);
    try {
      enfileirarJob(pedido.id, 'nfe.emitir');
      await processarFila();
      recarregarPedido();
      alert('Sinal de emissão de NF-e enviado e processado na fila!');
    } catch (err: any) {
      alert(err.message || 'Erro ao emitir NF-e');
    } finally {
      setProcessando(false);
    }
  };

  const handleSincronizarErp = async () => {
    if (!pedido) return;
    setProcessando(true);
    try {
      enfileirarJob(pedido.id, 'erp.enviarPedido');
      await processarFila();
      recarregarPedido();
      alert('Pedido re-sincronizado com o SupraSoft ERP!');
    } catch (err: any) {
      alert(err.message || 'Erro ao sincronizar com ERP');
    } finally {
      setProcessando(false);
    }
  };

  const handleSalvarRastreio = () => {
    if (!pedido || !codigoRastreio) {
      alert('Informe o código de rastreamento dos Correios.');
      return;
    }

    const codigoUpper = codigoRastreio.toUpperCase().trim();
    const urlRastreio = `https://rastreamento.correios.com.br/app/index.php?codigo=${codigoUpper}`;

    const pAtualizado: Pedido = {
      ...pedido,
      status: 'enviado',
      frete: {
        ...pedido.frete,
        codigoRastreio: codigoUpper,
      },
      rastreio: {
        codigo: codigoUpper,
        url: urlRastreio,
      },
      timeline: [
        ...pedido.timeline,
        {
          em: new Date().toISOString(),
          evento: 'Objeto Enviado aos Correios',
          detalhe: `Código de rastreamento informado: ${codigoUpper}. Notificação disparada ao cliente.`,
        },
      ],
    };

    upsert('pedidos', pAtualizado);
    setPedido(pAtualizado);
    alert('Código de rastreio registrado e status atualizado para ENVIADO!');
  };

  const handleCancelarPedido = () => {
    if (!pedido) return;

    // Return stock of items
    const variacoes = getAll<Variacao>('variacoes');
    pedido.itens.forEach((item) => {
      const idx = variacoes.findIndex((v) => v.id === item.variacaoId);
      if (idx >= 0) {
        variacoes[idx].estoque += item.quantidade;
        upsert('variacoes', variacoes[idx]);
      }
    });

    const pAtualizado: Pedido = {
      ...pedido,
      status: 'cancelado',
      timeline: [
        ...pedido.timeline,
        {
          em: new Date().toISOString(),
          evento: 'Pedido Cancelado',
          detalhe: `Motivo: ${motivoCancelamento || 'Cancelamento solicitado pelo gestor'}. Estoque devolvido.`,
        },
      ],
    };

    upsert('pedidos', pAtualizado);
    setPedido(pAtualizado);
    setModalCancelarAberto(false);
    setMotivoCancelamento('');
    alert('Pedido cancelado e estoque devolvido com sucesso!');
  };

  const handleBaixarDanfe = () => {
    const danfeText = `=====================================================
DANFE - DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA
EMISSOR: PENTAGOL ARTIGOS ESPORTIVOS LTDA - CNPJ 12.345.678/0001-90
CHAVE DE ACESSO: ${pedido.nf?.chave || '31260812345678000190550010000001011000000018'}
NÚMERO DA NOTA: ${pedido.nf?.numero || '101'} - SÉRIE 1
DESTINATÁRIO: ${pedido.snapshotCliente.nomeCompleto} - CPF ${pedido.snapshotCliente.cpf}
VALOR TOTAL DO PEDIDO: R$ ${pedido.total.toFixed(2)}
=====================================================`;
    const blob = new Blob([danfeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DANFE_NF_${pedido.nf?.numero || pedido.numero}.txt`;
    a.click();
  };

  const handleBaixarXML = () => {
    const xmlText = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${pedido.nf?.chave || '31260812345678000190550010000001011000000018'}">
      <ide><nNF>${pedido.nf?.numero || '101'}</nNF></ide>
      <emit><CNPJ>12345678000190</CNPJ><xNome>PENTAGOL ESPORTES</xNome></emit>
      <dest><CPF>${pedido.snapshotCliente.cpf}</CPF><xNome>${pedido.snapshotCliente.nomeCompleto}</xNome></dest>
      <total><vNF>${pedido.total.toFixed(2)}</vNF></total>
    </infNFe>
  </NFe>
</nfeProc>`;
    const blob = new Blob([xmlText], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NFE_${pedido.nf?.numero || pedido.numero}.xml`;
    a.click();
  };

  // WhatsApp Link prefilled
  const numTelClean = pedido.snapshotCliente.telefone.replace(/\D/g, '');
  const waNumber = numTelClean.length === 10 || numTelClean.length === 11 ? `55${numTelClean}` : numTelClean;
  const msgWa = encodeURIComponent(
    `Olá ${pedido.snapshotCliente.nomeCompleto}! Aqui é da loja Pentagol referente ao seu Pedido #${pedido.numero}. Status atual: ${pedido.status.toUpperCase()}.`
  );
  const linkWhatsApp = `https://wa.me/${waNumber}?text=${msgWa}`;

  return (
    <div className="space-y-6 font-body">
      {/* HEADER TOP BAR */}
      <div className="bg-white border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Link
              to="/admin/pedidos"
              className="text-gray-500 hover:text-pg-red transition-colors text-xs flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para Pedidos</span>
            </Link>
            <span className="text-gray-300">|</span>
            <span className="bg-pg-yellow text-pg-ink font-pg-display text-[10px] px-2 py-0.5 uppercase font-bold">
              STATUS: {pedido.status.replace('_', ' ')}
            </span>
          </div>
          <h1 className="font-pg-display text-2xl text-gray-900 mt-1 uppercase">
            DETALHES DO PEDIDO #{pedido.numero}
          </h1>
          <p className="text-xs text-gray-500">
            Realizado em: {new Date(pedido.criadoEm).toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-pg-display text-xs px-3.5 py-2 inline-flex items-center space-x-1.5 shadow-xs"
          >
            <MessageSquare className="w-4 h-4" />
            <span>FALAR NO WHATSAPP</span>
          </a>

          {pedido.status !== 'cancelado' && (
            <button
              type="button"
              onClick={() => setModalCancelarAberto(true)}
              className="bg-pg-red hover:bg-opacity-90 text-white font-pg-display text-xs px-3.5 py-2 inline-flex items-center space-x-1 shadow-xs"
            >
              <XCircle className="w-4 h-4" />
              <span>CANCELAR PEDIDO</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA ESQUERDA: CONTROLES OPERACIONAIS E INTEGRAÇÕES */}
        <div className="lg:col-span-1 space-y-6">
          {/* MUDANÇA MANUALLY DE STATUS */}
          <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-3">
            <h3 className="font-pg-display text-base text-gray-900 border-b pb-2 uppercase">
              MUDAR STATUS MANUALMENTE
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleAtualizarStatus('pago')}
                className="bg-emerald-600 text-white font-pg-display p-2 hover:bg-opacity-90 transition-colors"
              >
                PAGO
              </button>
              <button
                type="button"
                onClick={() => handleAtualizarStatus('em_separacao')}
                className="bg-sky-600 text-white font-pg-display p-2 hover:bg-opacity-90 transition-colors"
              >
                EM SEPARAÇÃO
              </button>
              <button
                type="button"
                onClick={() => handleAtualizarStatus('enviado')}
                className="bg-indigo-600 text-white font-pg-display p-2 hover:bg-opacity-90 transition-colors"
              >
                ENVIADO
              </button>
              <button
                type="button"
                onClick={() => handleAtualizarStatus('entregue')}
                className="bg-green-700 text-white font-pg-display p-2 hover:bg-opacity-90 transition-colors"
              >
                ENTREGUE
              </button>
            </div>
          </div>

          {/* FISCAL NF-E (SEFAZ) */}
          <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-3">
            <h3 className="font-pg-display text-base text-gray-900 border-b pb-2 uppercase flex items-center space-x-1.5">
              <FileText className="w-5 h-5 text-pg-petrol" />
              <span>NOTA FISCAL ELETRÔNICA (SEFAZ)</span>
            </h3>

            <div className="text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-bold">Status NF:</span>
                <span className="font-mono font-bold uppercase text-pg-red bg-red-50 px-2 py-0.5 border border-red-200">
                  {pedido.nf?.status || 'nao_emitida'}
                </span>
              </div>

              {pedido.nf?.numero && (
                <p className="text-xs font-mono">
                  <strong>Número:</strong> {pedido.nf.numero}
                </p>
              )}

              {pedido.nf?.chave && (
                <div className="bg-gray-50 border p-2 font-mono text-[10px] break-all">
                  <span className="font-bold text-gray-500 block">CHAVE DE ACESSO:</span>
                  {pedido.nf.chave}
                </div>
              )}

              {pedido.nf?.motivoRejeicao && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-2 text-[11px] font-mono">
                  <strong>Rejeição SEFAZ:</strong> {pedido.nf.motivoRejeicao}
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <button
                  type="button"
                  disabled={processando}
                  onClick={handleEmitirNFe}
                  className="w-full bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display text-xs py-2 px-3 flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${processando ? 'animate-spin' : ''}`} />
                  <span>{processando ? 'TRANSMITINDO...' : 'EMITIR / REEMITIR NF-E'}</span>
                </button>

                {pedido.nf?.status === 'emitida' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleBaixarDanfe}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-pg-display text-[11px] py-1.5 px-2 flex items-center justify-center space-x-1 border"
                    >
                      <Download className="w-3 h-3 text-pg-red" />
                      <span>DANFE PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleBaixarXML}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-pg-display text-[11px] py-1.5 px-2 flex items-center justify-center space-x-1 border"
                    >
                      <FileCode className="w-3 h-3 text-pg-petrol" />
                      <span>XML SEFAZ</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ERP SUPRASOFT */}
          <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-3">
            <h3 className="font-pg-display text-base text-gray-900 border-b pb-2 uppercase flex items-center space-x-1.5">
              <Wrench className="w-5 h-5 text-pg-petrol" />
              <span>INTEGRAÇÃO SUPRASOFT ERP</span>
            </h3>

            <div className="text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-bold">Status ERP:</span>
                <span className="font-mono font-bold uppercase text-sky-800 bg-sky-50 px-2 py-0.5 border border-sky-200">
                  {pedido.erp?.status || 'nao_enviado'}
                </span>
              </div>

              {pedido.erp?.idExterno && (
                <p className="text-xs font-mono">
                  <strong>ID Externo SupraSoft:</strong> {pedido.erp.idExterno}
                </p>
              )}

              <button
                type="button"
                disabled={processando}
                onClick={handleSincronizarErp}
                className="w-full bg-sky-800 hover:bg-opacity-90 text-white font-pg-display text-xs py-2 px-3 flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${processando ? 'animate-spin' : ''}`} />
                <span>FORÇAR RE-SINCRONIZAÇÃO ERP</span>
              </button>
            </div>
          </div>

          {/* CORREIOS E RASTREIO */}
          <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-3">
            <h3 className="font-pg-display text-base text-gray-900 border-b pb-2 uppercase flex items-center space-x-1.5">
              <Truck className="w-5 h-5 text-pg-petrol" />
              <span>CÓDIGO DE RASTREAMENTO CORREIOS</span>
            </h3>

            <div className="text-xs space-y-2">
              <p className="font-bold text-gray-700">
                Modalidade: {pedido.frete?.servico} ({pedido.frete?.prazoDias} dias úteis)
              </p>
              <div>
                <label className="block mb-1 font-bold text-gray-600">Código Objeto (Correios):</label>
                <input
                  type="text"
                  placeholder="Ex: AA123456789BR"
                  value={codigoRastreio}
                  onChange={(e) => setCodigoRastreio(e.target.value.toUpperCase())}
                  className="w-full border border-gray-300 p-2 font-mono uppercase text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleSalvarRastreio}
                className="w-full bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-xs py-2 px-3 flex items-center justify-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>REGISTRAR & NOTIFICAR ENVIADO</span>
              </button>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: DADOS DO COMPRADOR, RESUMO FINANCEIRO, PIX & TIMELINE */}
        <div className="lg:col-span-2 space-y-6">
          {/* DADOS DO COMPRADOR E ENDEREÇO DE ENTREGA */}
          <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-3 text-xs">
            <h3 className="font-pg-display text-base text-gray-900 border-b pb-2 uppercase">
              DADOS DO COMPRADOR & ENDEREÇO
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p>
                  <strong>Nome Completo:</strong> {pedido.snapshotCliente.nomeCompleto}
                </p>
                <p>
                  <strong>CPF (Nota Fiscal):</strong>{' '}
                  <span className="font-mono font-bold text-gray-900">{pedido.snapshotCliente.cpf}</span>
                </p>
                <p>
                  <strong>E-mail:</strong> {pedido.snapshotCliente.email}
                </p>
                <p>
                  <strong>Telefone:</strong> {pedido.snapshotCliente.telefone}
                </p>
              </div>

              <div className="space-y-1 bg-gray-50 p-3 border">
                <p className="font-bold text-gray-800 border-b pb-1">Endereço de Entrega:</p>
                <p>
                  {pedido.endereco?.rua}, {pedido.endereco?.numero}{' '}
                  {pedido.endereco?.complemento ? `(${pedido.endereco?.complemento})` : ''}
                </p>
                <p>
                  Bairro {pedido.endereco?.bairro} - {pedido.endereco?.cidade}/{pedido.endereco?.uf}
                </p>
                <p className="font-mono text-gray-600">CEP: {pedido.endereco?.cep}</p>
              </div>
            </div>
          </div>

          {/* TABELA DE ITENS E RESUMO FINANCEIRO */}
          <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-4">
            <h3 className="font-pg-display text-base text-gray-900 border-b pb-2 uppercase">
              ITENS COMPRADOS & FINANCEIRO
            </h3>

            <div className="divide-y divide-gray-200 text-xs">
              {pedido.itens.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.imagem}
                      alt={item.nome}
                      className="w-12 h-12 object-contain border p-1 bg-white"
                    />
                    <div>
                      <h4 className="font-pg-display text-gray-900 uppercase">{item.nome}</h4>
                      <p className="text-gray-500">
                        SKU: <span className="font-mono font-bold">{item.sku}</span> | Tam:{' '}
                        <span className="font-bold">{item.tamanho || 'Único'}</span>
                        {item.cor ? ` | Cor: ${item.cor}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-gray-500 block">
                      {item.quantidade}x R$ {item.precoUnit.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="font-bold text-pg-red text-sm">
                      R$ {(item.precoUnit * item.quantidade).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* BREAKDOWN SUB-TOTALS */}
            <div className="bg-gray-50 p-4 border border-gray-200 text-xs space-y-1.5 font-body">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal dos Produtos:</span>
                <span>R$ {pedido.subtotal.toFixed(2).replace('.', ',')}</span>
              </div>

              {pedido.descontoCupom > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Desconto Cupom ({pedido.cupomCodigo || 'PROMO'}):</span>
                  <span>- R$ {pedido.descontoCupom.toFixed(2).replace('.', ',')}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Frete ({pedido.frete?.servico || 'PAC'}):</span>
                <span>R$ {pedido.frete?.valor?.toFixed(2).replace('.', ',') || '0,00'}</span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-pg-red border-t pt-2 mt-2">
                <span>VALOR TOTAL DO PEDIDO:</span>
                <span>R$ {pedido.total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          {/* DADOS DO PAGAMENTO PIX BANCO CENTRAL */}
          {pedido.pix && (
            <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-3">
              <h3 className="font-pg-display text-base text-gray-900 border-b pb-2 uppercase flex items-center space-x-1.5">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <span>INFORMAÇÕES DO PIX</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p>
                    <strong>TXID Banco Central:</strong>{' '}
                    <span className="font-mono text-[11px] text-gray-700">{pedido.pix.txid}</span>
                  </p>
                  <p>
                    <strong>Expira em:</strong>{' '}
                    {new Date(pedido.pix.expiraEm).toLocaleString('pt-BR')}
                  </p>
                  {pedido.pix.pagoEm && (
                    <p className="text-emerald-700 font-bold">
                      <strong>Pago em:</strong> {new Date(pedido.pix.pagoEm).toLocaleString('pt-BR')}
                    </p>
                  )}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(pedido.pix.copiaECola);
                        setCopiadoPix(true);
                        setTimeout(() => setCopiadoPix(false), 2000);
                      }}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[11px] p-2 w-full text-left flex items-center justify-between"
                    >
                      <span className="truncate pr-2">{pedido.pix.copiaECola}</span>
                      <Copy className="w-4 h-4 shrink-0" />
                    </button>
                    {copiadoPix && (
                      <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                        Código PIX Copiado!
                      </span>
                    )}
                  </div>
                </div>

                {pedido.pix.qrCodeImagem && (
                  <div className="flex flex-col items-center justify-center border p-2 bg-gray-50">
                    <img
                      src={pedido.pix.qrCodeImagem}
                      alt="QR Code Pix"
                      className="w-28 h-28 object-contain"
                    />
                    <span className="text-[10px] text-gray-500 mt-1">QR Code Pix Dinâmico</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TIMELINE DE EVENTOS DO PEDIDO */}
          <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-3">
            <h3 className="font-pg-display text-base text-gray-900 border-b pb-2 uppercase">
              TIMELINE DE EVENTOS DO PEDIDO
            </h3>

            <div className="space-y-3 text-xs">
              {pedido.timeline.map((t, idx) => (
                <div key={idx} className="border-l-2 border-pg-red pl-3 py-1 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">{t.evento}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(t.em).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {t.detalhe && <p className="text-gray-500 text-[11px]">{t.detalhe}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CANCELAR PEDIDO */}
      {modalCancelarAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 space-y-4 shadow-xl border">
            <h3 className="font-pg-display text-lg text-pg-red uppercase border-b pb-2">
              CANCELAR PEDIDO #{pedido.numero}
            </h3>
            <p className="text-xs text-gray-600">
              Atenção: O cancelamento irá estornar a reserva e devolver as quantidades dos itens ao estoque da loja.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Motivo do Cancelamento:</label>
              <textarea
                rows={3}
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Ex: Desistência do comprador / Falta de pagamento Pix"
                className="w-full border border-gray-300 p-2 text-xs font-body"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setModalCancelarAberto(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-pg-display px-4 py-2"
              >
                VOLTAR
              </button>
              <button
                type="button"
                onClick={handleCancelarPedido}
                className="bg-pg-red hover:bg-opacity-90 text-white text-xs font-pg-display px-4 py-2"
              >
                CONFIRMAR CANCELAMENTO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
