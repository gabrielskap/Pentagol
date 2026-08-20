import React, { useState } from 'react';
import { X, RefreshCw, Database, QrCode, Truck, FileText, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStoreConfig } from '../contexts/StoreConfigContext';
import { popular30PedidosExemplo, getAll, saveConfigLoja, getConfigLoja } from '../lib/db';
import { Pedido } from '../types';
import { processarConfirmacaoPagamento } from '../lib/orderProcessor';
import { cepService, freteService, processarFila } from '../services';
import { formatarMoeda } from '../lib/format';

interface DemoPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoPanelModal: React.FC<DemoPanelModalProps> = ({ isOpen, onClose }) => {
  const { config, restaurarDadosDemonstracao, updateConfig } = useStoreConfig();
  const [activeTab, setActiveTab] = useState<'dados' | 'simuladores' | 'servicos'>('dados');
  const [msg, setMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Simulator states
  const [pixPedidoId, setPixPedidoId] = useState('');
  const [simCep, setSimCep] = useState('30110-000');
  const [simFreteRes, setSimFreteRes] = useState<any>(null);
  const [loadingFrete, setLoadingFrete] = useState(false);

  if (!isOpen) return null;

  const pedidos = getAll<Pedido>('pedidos');
  const pedidosAguardandoPix = pedidos.filter((p) => p.status === 'aguardando_pix');

  const handleRestore = () => {
    if (window.confirm('Confirma a restauração dos dados iniciais de demonstração?')) {
      restaurarDadosDemonstracao();
      setMsg({ tipo: 'sucesso', texto: 'Dados restaurados com sucesso!' });
    }
  };

  const handlePopular30 = () => {
    const qtd = popular30PedidosExemplo();
    setMsg({ tipo: 'sucesso', texto: `${qtd} pedidos de exemplo gerados em diversos status!` });
  };

  const handleSimularPix = () => {
    if (!pixPedidoId) {
      setMsg({ tipo: 'erro', texto: 'Selecione um pedido aguardando Pix.' });
      return;
    }
    const ped = pedidos.find((p) => p.id === pixPedidoId);
    if (!ped) return;

    processarConfirmacaoPagamento(ped.id);
    setMsg({ tipo: 'sucesso', texto: `Pagamento Pix do pedido ${ped.numero} confirmado e enviado para a fila ERP/NF-e!` });
    setPixPedidoId('');
  };

  const handleTestarFrete = async () => {
    setLoadingFrete(true);
    setSimFreteRes(null);
    try {
      const end = await cepService.consultarCep(simCep);
      const res = await freteService.calcularFrete(simCep, 0.8, 150);
      setSimFreteRes({ endereco: end, opcoes: res });
    } catch (err: any) {
      setMsg({ tipo: 'erro', texto: 'Erro ao simular frete: ' + err.message });
    } finally {
      setLoadingFrete(false);
    }
  };

  const handleProcessarFila = () => {
    processarFila();
    setMsg({ tipo: 'sucesso', texto: 'Fila de integração acionada manualmente!' });
  };

  const toggleModoServico = (servico: keyof NonNullable<typeof config.modoServicos>) => {
    const atual = config.modoServicos || { viacep: 'demo', correios: 'demo', pix: 'demo', erp: 'demo', nfe: 'demo' };
    const novoValor = atual[servico] === 'prod' ? 'demo' : 'prod';
    const novoModo = { ...atual, [servico]: novoValor };
    updateConfig({ ...config, modoServicos: novoModo });
    setMsg({ tipo: 'sucesso', texto: `Modo do serviço ${String(servico).toUpperCase()} alterado para ${novoValor.toUpperCase()}.` });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white text-gray-900 w-full max-w-2xl rounded-none shadow-2xl overflow-hidden border-t-4 border-pg-orange max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-pg-petrol text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-pg-yellow" />
            <h2 className="font-pg-display text-lg tracking-wider">PAINEL DE DEMONSTRAÇÃO & SIMULADORES</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-pg-yellow p-1"
            aria-label="Fechar painel"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Feedback Msg */}
        {msg && (
          <div
            className={`px-6 py-3 text-xs font-semibold flex items-center justify-between ${
              msg.tipo === 'sucesso' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              {msg.tipo === 'sucesso' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{msg.texto}</span>
            </div>
            <button onClick={() => setMsg(null)} className="underline hover:opacity-80">
              OK
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('dados')}
            className={`flex-1 py-3 px-4 text-xs font-pg-display text-center border-b-2 transition-colors ${
              activeTab === 'dados' ? 'border-pg-orange text-pg-orange font-bold bg-white' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Database className="w-4 h-4 inline mr-1.5" />
            GERENCIAR DADOS
          </button>
          <button
            onClick={() => setActiveTab('simuladores')}
            className={`flex-1 py-3 px-4 text-xs font-pg-display text-center border-b-2 transition-colors ${
              activeTab === 'simuladores' ? 'border-pg-orange text-pg-orange font-bold bg-white' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <QrCode className="w-4 h-4 inline mr-1.5" />
            SIMULADORES PIX & FRETE
          </button>
          <button
            onClick={() => setActiveTab('servicos')}
            className={`flex-1 py-3 px-4 text-xs font-pg-display text-center border-b-2 transition-colors ${
              activeTab === 'servicos' ? 'border-pg-orange text-pg-orange font-bold bg-white' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Server className="w-4 h-4 inline mr-1.5" />
            MODO SERVIÇOS & FILA
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'dados' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-relaxed">
                <p className="font-semibold mb-1">Controle de Dados em Tempo de Execução</p>
                <p>Alterne entre a semente limpa original da loja ou popule instantaneamente 30 pedidos de teste em múltiplos estados para visualizar os relatórios e métricas do painel admin.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-gray-200 p-4 hover:border-pg-orange transition-colors">
                  <RefreshCw className="w-6 h-6 text-pg-orange mb-2" />
                  <h3 className="font-pg-display text-sm font-bold text-gray-900">Restaurar Seed Inicial</h3>
                  <p className="text-xs text-gray-600 mt-1 mb-4">Reset completo do banco local (limpa pedidos, restaura catálogo padrão).</p>
                  <button
                    onClick={handleRestore}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white font-pg-display text-xs py-2 px-3 transition-colors"
                  >
                    RESTAURAR LOJA
                  </button>
                </div>

                <div className="border border-gray-200 p-4 hover:border-pg-orange transition-colors">
                  <Database className="w-6 h-6 text-emerald-600 mb-2" />
                  <h3 className="font-pg-display text-sm font-bold text-gray-900">Popular 30 Pedidos</h3>
                  <p className="text-xs text-gray-600 mt-1 mb-4">Gera 30 pedidos em status variados (Aguardando Pix, Pago, Separação, Enviado, Entregue, etc).</p>
                  <button
                    onClick={handlePopular30}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-pg-display text-xs py-2 px-3 transition-colors"
                  >
                    POPULAR 30 PEDIDOS
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'simuladores' && (
            <div className="space-y-6">
              {/* Pix Simulator */}
              <div className="border border-gray-200 p-4">
                <h3 className="font-pg-display text-sm font-bold text-gray-900 flex items-center space-x-2">
                  <QrCode className="w-4 h-4 text-pg-orange" />
                  <span>Simulador de Webhook Pix Banco Central</span>
                </h3>
                <p className="text-xs text-gray-600 mt-1 mb-3">
                  Simula o callback de confirmação de pagamento emitido pelo banco.
                </p>

                {pedidosAguardandoPix.length === 0 ? (
                  <p className="text-xs text-gray-500 italic bg-gray-100 p-2">
                    Nenhum pedido aguardando Pix no momento. Crie um novo pedido na loja pública ou popular pedidos de teste.
                  </p>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={pixPedidoId}
                      onChange={(e) => setPixPedidoId(e.target.value)}
                      className="flex-1 text-xs border border-gray-300 p-2 focus:ring-1 focus:ring-pg-orange focus:outline-none"
                    >
                      <option value="">Selecione um pedido em 'aguardando_pix'...</option>
                      {pedidosAguardandoPix.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.numero} - {p.snapshotCliente.nomeCompleto} ({formatarMoeda(p.total)})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleSimularPix}
                      className="bg-pg-orange hover:bg-pg-orange-dark text-white font-pg-display text-xs px-4 py-2 transition-colors whitespace-nowrap"
                    >
                      CONFIRMAR PAGAMENTO
                    </button>
                  </div>
                )}
              </div>

              {/* Shipping Simulator */}
              <div className="border border-gray-200 p-4">
                <h3 className="font-pg-display text-sm font-bold text-gray-900 flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-pg-petrol" />
                  <span>Simulador de Frete ViaCEP / Correios</span>
                </h3>
                <p className="text-xs text-gray-600 mt-1 mb-3">
                  Consulte prazos e valores reais para qualquer CEP do Brasil.
                </p>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={simCep}
                    onChange={(e) => setSimCep(e.target.value)}
                    placeholder="CEP Ex: 30110-000"
                    className="border border-gray-300 p-2 text-xs w-40 focus:ring-1 focus:ring-pg-orange focus:outline-none"
                  />
                  <button
                    onClick={handleTestarFrete}
                    disabled={loadingFrete}
                    className="bg-pg-petrol text-white font-pg-display text-xs px-4 py-2 hover:bg-opacity-90 disabled:opacity-50"
                  >
                    {loadingFrete ? 'CONSULTANDO...' : 'CALCULAR FRETE'}
                  </button>
                </div>

                {simFreteRes && (
                  <div className="p-3 bg-gray-50 text-xs border border-gray-200 space-y-2">
                    {simFreteRes.endereco && (
                      <p className="text-gray-700">
                        <strong>Endereço:</strong> {simFreteRes.endereco.rua || simFreteRes.endereco.logradouro}, {simFreteRes.endereco.bairro} - {simFreteRes.endereco.cidade || simFreteRes.endereco.localidade}/{simFreteRes.endereco.uf}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {simFreteRes.opcoes.map((f: any) => (
                        <div key={f.servico} className="p-2 border border-gray-300 bg-white">
                          <p className="font-bold text-pg-petrol">{f.servico}</p>
                          <p className="text-gray-900">{formatarMoeda(f.valor)}</p>
                          <p className="text-gray-500 text-[11px]">{f.prazoDias} dias úteis</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'servicos' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                <p className="font-semibold mb-1">Status das Integrações Externas</p>
                <p>Alterne o modo de operação de cada integração entre 'Simulação Demo' e 'Produção'. Em modo 'demo', respostas com sucesso são garantidas sem depender de chaves de API ativas.</p>
              </div>

              <div className="divide-y divide-gray-200 border border-gray-200">
                {(['viacep', 'correios', 'pix', 'erp', 'nfe'] as const).map((s) => {
                  const m = config.modoServicos?.[s] || 'demo';
                  return (
                    <div key={s} className="p-3 flex items-center justify-between bg-white text-xs">
                      <div>
                        <span className="font-bold text-gray-900 uppercase">{s === 'viacep' ? 'ViaCEP (Endereços)' : s === 'correios' ? 'Correios (Frete)' : s === 'pix' ? 'Pix (Banco Central)' : s === 'erp' ? 'SupraSoft ERP' : 'Sefaz NF-e'}</span>
                        <p className="text-gray-500 text-[11px]">Modo atual: <strong className={m === 'prod' ? 'text-emerald-600' : 'text-blue-600'}>{m.toUpperCase()}</strong></p>
                      </div>
                      <button
                        onClick={() => toggleModoServico(s)}
                        className={`font-pg-display text-[11px] px-3 py-1 transition-colors ${
                          m === 'prod' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                        }`}
                      >
                        ALTERAR PARA {m === 'prod' ? 'DEMO' : 'PROD'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="border border-gray-200 p-4">
                <h3 className="font-pg-display text-sm font-bold text-gray-900 mb-1">Processador de Fila Sequencial</h3>
                <p className="text-xs text-gray-600 mb-3">Força a execução imediata dos jobs pendentes na fila de eventos (Envio ERP e Emissão de NF-e).</p>
                <button
                  onClick={handleProcessarFila}
                  className="bg-gray-900 hover:bg-black text-white font-pg-display text-xs px-4 py-2 transition-colors"
                >
                  PROCESSAR FILA AGORA
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-3 border-t border-gray-200 text-right">
          <button
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-900 text-white font-pg-display text-xs px-5 py-2 transition-colors"
          >
            FECHAR PAINEL
          </button>
        </div>

      </div>
    </div>
  );
};
