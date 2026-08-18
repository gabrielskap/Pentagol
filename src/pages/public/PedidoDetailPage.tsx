import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  MessageCircle,
  PackageCheck,
  QrCode,
  RefreshCw,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { getAll, getConfigLoja, upsert } from '../../lib/db';
import { processarConfirmacaoPagamento, processarExpiracaoPix } from '../../lib/orderProcessor';
import { pixService } from '../../services';
import { Pedido } from '../../types';
import { PixPaymentWidget } from '../../components/PixPaymentWidget';

export const PedidoDetailPage: React.FC = () => {
  const { numero } = useParams<{ numero: string }>();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const config = getConfigLoja();

  const recarregarPedido = () => {
    const todos = getAll<Pedido>('pedidos');
    const p = todos.find((item) => item.numero === numero || item.id === numero);
    if (p) setPedido(p);
  };

  useEffect(() => {
    recarregarPedido();
  }, [numero]);

  if (!pedido) {
    return (
      <div className="bg-white p-12 text-center border border-gray-200 max-w-lg mx-auto my-12 shadow-xs space-y-4 font-body">
        <AlertCircle className="w-12 h-12 text-pg-red mx-auto" />
        <h2 className="font-pg-display text-2xl font-bold uppercase text-pg-red italic">
          PEDIDO NÃO ENCONTRADO
        </h2>
        <p className="text-xs text-gray-600">
          Não localizamos o pedido com o número: <span className="font-mono font-bold">{numero}</span>.
        </p>
        <Link
          to="/"
          className="inline-block bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display text-xs font-bold uppercase px-6 py-3"
        >
          VOLTAR PARA A LOJA
        </Link>
      </div>
    );
  }

  // Handle regenerated PIX on expiration
  const handleRegenerarPix = async () => {
    try {
      const novopix = await pixService.criarCobranca({
        pedidoId: pedido.id,
        valorTotal: pedido.total,
        cpfPagador: pedido.snapshotCliente.cpf,
        nomePagador: pedido.snapshotCliente.nomeCompleto,
        expiraEmMinutos: config?.pixExpiracaoMinutos || 30,
      });

      const pAtualizado: Pedido = {
        ...pedido,
        status: 'aguardando_pix',
        pix: {
          txid: novopix.txid,
          qrCodeImagem: novopix.qrCodeImagem,
          copiaECola: novopix.copiaECola,
          expiraEm: novopix.expiraEm,
        },
        timeline: [
          ...pedido.timeline,
          {
            em: new Date().toISOString(),
            evento: 'Nova Chave PIX Gerada',
            detalhe: `Novo TXID: ${novopix.txid}`,
          },
        ],
      };

      upsert('pedidos', pAtualizado);
      setPedido(pAtualizado);
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar nova chave Pix.');
    }
  };

  const getBadgeStatus = (status: string) => {
    switch (status) {
      case 'pago':
        return { label: 'Pagamento Confirmado', color: 'bg-emerald-600 text-white' };
      case 'aguardando_pix':
        return { label: 'Aguardando Pagamento PIX', color: 'bg-amber-500 text-white' };
      case 'pix_expirado':
        return { label: 'PIX Expirado', color: 'bg-pg-red text-white' };
      case 'enviado':
        return { label: 'Pedido Enviado', color: 'bg-blue-600 text-white' };
      case 'entregue':
        return { label: 'Entregue ao Cliente', color: 'bg-emerald-700 text-white' };
      default:
        return { label: status.toUpperCase().replace('_', ' '), color: 'bg-gray-600 text-white' };
    }
  };

  const badge = getBadgeStatus(pedido.status);
  const linkWhatsapp = `https://wa.me/55${(config?.whatsapp || '31999999999').replace(/\D/g, '')}?text=${encodeURIComponent(
    `Olá! Gostaria de informações sobre o meu Pedido #${pedido.numero}`
  )}`;

  return (
    <div className="space-y-6 pb-16 font-body">
      
      {/* TOP BAR */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <Link
          to="/"
          className="text-xs font-pg-display font-bold uppercase text-pg-petrol hover:text-pg-red flex items-center space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Loja</span>
        </Link>
        <span className="text-xs font-mono text-gray-500">
          ID Interno: {pedido.id}
        </span>
      </div>

      {/* HEADER BANNER */}
      <div className="bg-pg-petrol text-white p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className={`font-pg-display text-[11px] font-bold px-2.5 py-0.5 uppercase italic ${badge.color}`}>
              {badge.label}
            </span>
            {pedido.erp?.idExterno && (
              <span className="bg-white/10 text-gray-200 font-mono text-[10px] px-2 py-0.5 border border-white/20">
                ERP: {pedido.erp.idExterno}
              </span>
            )}
          </div>
          <h1 className="font-pg-display text-2xl sm:text-3xl font-bold tracking-wider uppercase italic">
            PEDIDO #{pedido.numero}
          </h1>
          <p className="text-xs text-gray-300 mt-0.5 font-mono">
            Realizado em: {new Date(pedido.criadoEm).toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="text-left md:text-right border-t md:border-t-0 border-white/20 pt-3 md:pt-0 w-full md:w-auto">
          <p className="text-xs text-gray-300">Valor Total do Pedido</p>
          <p className="font-body text-3xl font-extrabold text-white">
            R$ {pedido.total.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PIX & FISCAL & TRACKING */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* PIX PAYMENT WIDGET OR PAID BOX */}
          <div>
            <PixPaymentWidget
              pedido={pedido}
              onPaymentConfirmed={(pAtualizado) => {
                setPedido(pAtualizado);
              }}
              onPixExpired={(pExpirado) => {
                setPedido(pExpirado);
              }}
              onRegeneratePix={handleRegenerarPix}
            />
          </div>

          {/* NOTA FISCAL ELETRÔNICA (NF-E) BLOCK */}
          <div className="bg-white border border-gray-200 p-6 shadow-xs space-y-3">
            <h3 className="font-pg-display text-base font-bold text-gray-900 border-b-2 border-pg-red pb-2 uppercase flex items-center space-x-2">
              <FileText className="w-5 h-5 text-pg-red" />
              <span>NOTA FISCAL ELETRÔNICA (NF-E)</span>
            </h3>

            {pedido.nf?.status === 'emitida' ? (
              <div className="space-y-3 text-xs">
                <div className="bg-emerald-50 border border-emerald-300 p-3 text-emerald-900 font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>NF-e Emitida e Autorizada pela SEFAZ / MG</span>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-gray-50 p-3 border">
                  <div>
                    <span className="text-gray-500">Número da Nota:</span>
                    <p className="font-bold text-gray-900">{pedido.nf.numero || '000.123'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Série:</span>
                    <p className="font-bold text-gray-900">1</p>
                  </div>
                  <div className="col-span-2 pt-1 border-t">
                    <span className="text-gray-500">Chave de Acesso (44 dígitos):</span>
                    <p className="font-mono text-[10px] break-all text-gray-800 font-bold">
                      {pedido.nf.chave}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {pedido.nf.danfeUrl && (
                    <a
                      href={pedido.nf.danfeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display text-xs font-bold uppercase px-4 py-2 flex items-center space-x-1.5 shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>BAIXAR DANFE (PDF)</span>
                    </a>
                  )}

                  {pedido.nf.xmlUrl && (
                    <a
                      href={pedido.nf.xmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-gray-700 hover:bg-gray-800 text-white font-pg-display text-xs font-bold uppercase px-4 py-2 flex items-center space-x-1.5 shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>BAIXAR XML</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-300 p-4 space-y-3 text-xs text-amber-900">
                <div className="flex items-center space-x-2 font-bold">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Sua nota fiscal está em processamento</span>
                </div>
                <p className="text-gray-700">
                  Estamos emitindo a Nota Fiscal Eletrônica referente ao seu pedido. Assim que autorizada pela SEFAZ, ela estará disponível para download aqui e também será enviada para o seu e-mail (<strong>{pedido.snapshotCliente.email}</strong>).
                </p>
                <div className="pt-1">
                  <a
                    href={linkWhatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-pg-display text-[11px] font-bold uppercase px-3 py-2 inline-flex items-center space-x-1.5 shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white text-emerald-600" />
                    <span>DÚVIDAS SOBRE A NOTA FISCAL? FALAR NO WHATSAPP</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* RASTREIO E TRANSPORTADORA */}
          <div className="bg-white border border-gray-200 p-6 shadow-xs space-y-3">
            <h3 className="font-pg-display text-base font-bold text-gray-900 border-b-2 border-pg-red pb-2 uppercase flex items-center space-x-2">
              <Truck className="w-5 h-5 text-pg-red" />
              <span>RASTREAMENTO & ENTREGA</span>
            </h3>

            {pedido.rastreio?.codigo ? (
              <div className="space-y-2 text-xs">
                <p className="text-gray-700">
                  Código de Rastreio Correios ({pedido.frete.servico}):
                </p>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sm bg-gray-100 px-3 py-1.5 border border-gray-300 text-pg-ink">
                    {pedido.rastreio.codigo}
                  </span>
                  <a
                    href={pedido.rastreio.url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-pg-petrol text-white font-pg-display text-xs font-bold uppercase px-3 py-2 flex items-center space-x-1"
                  >
                    <span>RASTREAR CORREIOS</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-600 bg-gray-50 p-3 border border-gray-200">
                Forma de Envio: <strong>{pedido.frete.servico} ({pedido.frete.transportadora})</strong> — Entrega em até <strong>{pedido.frete.prazoDias} dias úteis</strong> após a postagem. O código de rastreamento será disponibilizado assim que a etiqueta for emitida.
              </p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: ITEMS, TOTALS & TIMELINE */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* ITENS DO PEDIDO */}
          <div className="bg-white border border-gray-200 p-6 shadow-xs space-y-4">
            <h3 className="font-pg-display text-base font-bold text-gray-900 border-b-2 border-pg-red pb-2 uppercase flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-pg-red" />
              <span>ITENS COMPRADOS ({pedido.itens.length})</span>
            </h3>

            <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto pr-1">
              {pedido.itens.map((item) => (
                <div key={item.variacaoId} className="py-3 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={item.imagem}
                      alt={item.nome}
                      className="w-12 h-12 object-contain border p-1 bg-gray-50 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{item.nome}</h4>
                      <p className="text-gray-500 text-[11px] font-mono">
                        SKU: {item.sku} | Tam: <strong>{item.tamanho || 'Único'}</strong>
                      </p>
                      <p className="text-gray-600 font-mono">
                        {item.quantidade}x R$ {item.precoUnit.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-gray-900 text-sm shrink-0">
                    R$ {(item.precoUnit * item.quantidade).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>

            {/* TOTALS SUMMARY */}
            <div className="border-t border-gray-200 pt-3 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal dos Produtos:</span>
                <span className="font-mono font-bold">R$ {pedido.subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              {pedido.descontoCupom > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Desconto ({pedido.cupomCodigo || 'Cupom'}):</span>
                  <span className="font-mono">- R$ {pedido.descontoCupom.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Frete ({pedido.frete.servico}):</span>
                <span className="font-mono font-bold">
                  {pedido.frete.valor === 0 ? 'GRÁTIS' : `R$ ${pedido.frete.valor.toFixed(2).replace('.', ',')}`}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-baseline text-left">
                <span className="font-pg-display text-sm font-bold uppercase text-gray-900">
                  TOTAL DO PEDIDO:
                </span>
                <span className="font-body text-xl font-extrabold text-pg-red font-mono">
                  R$ {pedido.total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          {/* ENDEREÇO DE ENTREGA */}
          <div className="bg-white border border-gray-200 p-6 shadow-xs space-y-2 text-xs">
            <h3 className="font-pg-display text-base font-bold text-gray-900 border-b-2 border-pg-red pb-2 uppercase flex items-center space-x-2">
              <Truck className="w-5 h-5 text-pg-red" />
              <span>ENDEREÇO DE ENTREGA DESTA COMPRA</span>
            </h3>
            <p className="font-bold text-gray-900 text-sm">{pedido.snapshotCliente.nomeCompleto}</p>
            <p className="text-gray-600 font-mono">
              CPF: {pedido.snapshotCliente.cpf} | Tel: {pedido.snapshotCliente.telefone}
            </p>
            <p className="text-gray-700">
              {pedido.endereco.rua}, {pedido.endereco.numero} {pedido.endereco.complemento && `- ${pedido.endereco.complemento}`}
            </p>
            <p className="text-gray-700">
              {pedido.endereco.bairro} — {pedido.endereco.cidade} / {pedido.endereco.uf} — CEP {pedido.endereco.cep}
            </p>
          </div>

          {/* HISTÓRICO / TIMELINE */}
          <div className="bg-white border border-gray-200 p-6 shadow-xs space-y-4">
            <h3 className="font-pg-display text-base font-bold text-gray-900 border-b-2 border-pg-red pb-2 uppercase flex items-center space-x-2">
              <PackageCheck className="w-5 h-5 text-pg-red" />
              <span>LINHA DO TEMPO DO PEDIDO (AUDITORIA)</span>
            </h3>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-gray-200 pl-6">
              {pedido.timeline.map((t, idx) => (
                <div key={idx} className="relative space-y-0.5 text-xs">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-pg-red border-2 border-white" />
                  <p className="font-bold text-gray-900">{t.evento}</p>
                  {t.detalhe && <p className="text-gray-600 text-[11px] font-mono">{t.detalhe}</p>}
                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(t.em).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={linkWhatsapp}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-pg-display text-xs font-bold uppercase py-3 px-4 text-center shadow-xs flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
              <span>FALAR NO WHATSAPP</span>
            </a>

            <Link
              to="/minha-conta"
              className="flex-1 bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display text-xs font-bold uppercase py-3 px-4 text-center shadow-xs"
            >
              VER TODOS OS MEUS PEDIDOS
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
};
