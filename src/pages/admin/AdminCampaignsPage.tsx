import React, { useState } from 'react';
import {
  AlertCircle,
  BarChart2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  FileText,
  Filter,
  Image,
  Layers,
  Megaphone,
  Paperclip,
  Pause,
  Play,
  Plus,
  Search,
  Send,
  Smartphone,
  Trash2,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { MOCK_CAMPAIGNS, MOCK_INSTANCES } from '../../data/mockAdminData';
import { Campaign, CampaignStatus, WhatsAppInstance } from '../../types';

export const AdminCampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [instances] = useState<WhatsAppInstance[]>(MOCK_INSTANCES);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<CampaignStatus | 'all'>('all');

  // Multi-step Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [novaCampanha, setNovaCampanha] = useState<{
    name: string;
    instanceName: string;
    targetTag: string;
    scheduledFor: string;
    messageTemplate: string;
    delaySeconds: number;
    attachedMedia?: string;
  }>({
    name: '',
    instanceName: 'Atendimento Matriz',
    targetTag: 'VIP',
    scheduledFor: '2026-08-25 14:00',
    messageTemplate: 'Olá {nome}! Temos uma oferta especial para você hoje no WhatsApp!',
    delaySeconds: 15,
  });

  // Report Modal State
  const [reportCampaign, setReportCampaign] = useState<Campaign | null>(null);

  const filteredCampaigns = campaigns.filter((c) => {
    const matchBusca =
      c.name.toLowerCase().includes(busca.toLowerCase()) ||
      c.targetTag.toLowerCase().includes(busca.toLowerCase());
    if (!matchBusca) return false;
    if (filtroStatus !== 'all') return c.status === filtroStatus;
    return true;
  });

  const handleTogglePause = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const newStatus = c.status === 'running' ? 'paused' : 'running';
          return { ...c, status: newStatus };
        }
        return c;
      })
    );
  };

  const handleDeleteCampaign = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta campanha?')) {
      setCampaigns(campaigns.filter((c) => c.id !== id));
    }
  };

  const handleCreateCampaign = () => {
    const created: Campaign = {
      id: `camp-${Date.now()}`,
      name: novaCampanha.name || 'Nova Campanha de Disparo',
      instanceName: novaCampanha.instanceName,
      targetTag: novaCampanha.targetTag,
      scheduledFor: novaCampanha.scheduledFor,
      sentCount: 0,
      totalCount: 450,
      deliveredCount: 0,
      readCount: 0,
      failedCount: 0,
      status: 'scheduled',
      messageTemplate: novaCampanha.messageTemplate,
      delaySeconds: novaCampanha.delaySeconds,
    };

    setCampaigns([created, ...campaigns]);
    setIsWizardOpen(false);
    setWizardStep(1);
  };

  return (
    <div className="space-y-6 font-body">
      
      {/* HEADER & TOP ACTION BUTTON */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Megaphone className="w-7 h-7 text-indigo-600" />
            <span>Campanhas de Disparo em Massa</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Gerencie transmissões segmentadas via WhatsApp com agendamento e análise de métricas.
          </p>
        </div>

        <button
          onClick={() => {
            setIsWizardOpen(true);
            setWizardStep(1);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center space-x-2 transition-colors shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nova Campanha</span>
        </button>
      </div>

      {/* STATS METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-medium uppercase">Total Enviado</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">12.450</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-medium uppercase">Entregues</span>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">98.2%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-medium uppercase">Taxa de Leitura</span>
            <p className="text-xl font-bold text-blue-600 mt-0.5">84.5%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-medium uppercase">Taxa de Falhas</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">1.3%</p>
          </div>
        </div>
      </div>

      {/* CAMPAIGNS MAIN TABLE CONTAINER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar campanha por nome ou tag..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as any)}
              className="bg-white border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Todas as Campanhas</option>
              <option value="running">Em Andamento</option>
              <option value="scheduled">Agendadas</option>
              <option value="completed">Concluídas</option>
              <option value="paused">Pausadas</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <th className="p-3.5">Nome da Campanha</th>
                <th className="p-3.5">Instância</th>
                <th className="p-3.5">Público-Alvo</th>
                <th className="p-3.5">Data / Agendamento</th>
                <th className="p-3.5">Progresso de Envio</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCampaigns.map((camp) => {
                const percent = Math.round((camp.sentCount / (camp.totalCount || 1)) * 100);

                return (
                  <tr key={camp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">{camp.name}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">ID: {camp.id}</span>
                    </td>

                    <td className="p-3.5 text-slate-700 font-medium">{camp.instanceName}</td>

                    <td className="p-3.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Tag: #{camp.targetTag}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-600 font-mono text-[11px]">{camp.scheduledFor}</td>

                    <td className="p-3.5 w-48">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-bold text-slate-700">
                          {camp.sentCount} / {camp.totalCount}
                        </span>
                        <span className="text-slate-500 font-mono">{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            camp.status === 'completed'
                              ? 'bg-emerald-500'
                              : camp.status === 'running'
                              ? 'bg-indigo-600 animate-pulse'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                          camp.status === 'running'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                            : camp.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : camp.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </td>

                    <td className="p-3.5 text-right space-x-1">
                      {camp.status === 'running' || camp.status === 'paused' ? (
                        <button
                          onClick={() => handleTogglePause(camp.id)}
                          className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                          title={camp.status === 'running' ? 'Pausar Envio' : 'Retomar Envio'}
                        >
                          {camp.status === 'running' ? (
                            <Pause className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Play className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>
                      ) : null}

                      <button
                        onClick={() => setReportCampaign(camp)}
                        className="p-1.5 rounded hover:bg-slate-200 text-indigo-600 font-semibold"
                        title="Ver Relatório Detalhado"
                      >
                        <BarChart2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteCampaign(camp.id)}
                        className="p-1.5 rounded hover:bg-slate-200 text-rose-600"
                        title="Excluir Campanha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL WIZARD: NOVA CAMPANHA (4 PASSOS) */}
      {/* ======================================================== */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header Wizard */}
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Megaphone className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Criar Nova Campanha de Disparo</h3>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Steps Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-around text-xs font-semibold">
              <div className={`flex items-center space-x-2 ${wizardStep >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <span>Configurações</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />

              <div className={`flex items-center space-x-2 ${wizardStep >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <span>Público-Alvo</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />

              <div className={`flex items-center space-x-2 ${wizardStep >= 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <span>Mensagem & Preview</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />

              <div className={`flex items-center space-x-2 ${wizardStep >= 4 ? 'text-indigo-600' : 'text-slate-400'}`}>
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  4
                </span>
                <span>Agendamento</span>
              </div>
            </div>

            {/* Content Body per Step */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              
              {/* PASSO 1 */}
              {wizardStep === 1 && (
                <div className="space-y-4 text-xs max-w-lg mx-auto">
                  <h4 className="font-bold text-slate-900 text-sm">Passo 1: Dados Gerais da Campanha</h4>
                  
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nome da Campanha</label>
                    <input
                      type="text"
                      placeholder="Ex: Promoção de Primavera - Clientes Sumidos"
                      value={novaCampanha.name}
                      onChange={(e) => setNovaCampanha({ ...novaCampanha, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Instância WhatsApp de Disparo</label>
                    <select
                      value={novaCampanha.instanceName}
                      onChange={(e) => setNovaCampanha({ ...novaCampanha, instanceName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      {instances.map((i) => (
                        <option key={i.id} value={i.name}>
                          {i.name} ({i.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* PASSO 2 */}
              {wizardStep === 2 && (
                <div className="space-y-4 text-xs max-w-lg mx-auto">
                  <h4 className="font-bold text-slate-900 text-sm">Passo 2: Seleção do Público Destinatário</h4>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Segmentação por Tag</label>
                    <select
                      value={novaCampanha.targetTag}
                      onChange={(e) => setNovaCampanha({ ...novaCampanha, targetTag: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="VIP">Tag #VIP (450 contatos)</option>
                      <option value="Retorno">Tag #Retorno (230 contatos)</option>
                      <option value="Novo Cliente">Tag #Novo Cliente (1.200 contatos)</option>
                      <option value="Geral">Base Completa (3.500 contatos)</option>
                    </select>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="block font-bold text-slate-700 mb-1">Ou Importe uma lista via CSV:</span>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">Clique para enviar arquivo CSV</p>
                      <p className="text-[10px] text-slate-400 mt-1">Formato: nome, telefone, email</p>
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 3: MENSAGEM & PREVIEW REAL-TIME WHATSAPP */}
              {wizardStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  
                  {/* Left: Message Editor */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm">Passo 3: Editor de Mensagem</h4>
                    <p className="text-slate-500 text-[11px]">
                      Utilize tags dinâmicas para personalizar o envio para cada cliente.
                    </p>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() =>
                          setNovaCampanha({
                            ...novaCampanha,
                            messageTemplate: novaCampanha.messageTemplate + ' {nome}',
                          })
                        }
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700"
                      >
                        + &#123;nome&#125;
                      </button>
                      <button
                        onClick={() =>
                          setNovaCampanha({
                            ...novaCampanha,
                            messageTemplate: novaCampanha.messageTemplate + ' {data}',
                          })
                        }
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700"
                      >
                        + &#123;data&#125;
                      </button>
                    </div>

                    <textarea
                      rows={6}
                      value={novaCampanha.messageTemplate}
                      onChange={(e) => setNovaCampanha({ ...novaCampanha, messageTemplate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                    />

                    <div>
                      <span className="block font-bold text-slate-700 mb-1">Anexo de Mídia (Opcional):</span>
                      <button className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md font-semibold text-slate-700 flex items-center space-x-1 hover:bg-slate-200">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Anexar Imagem ou PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: WhatsApp Mobile Frame Mock Preview */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-64 bg-slate-900 rounded-[32px] p-3 shadow-2xl border-4 border-slate-800">
                      <div className="w-full bg-[#efeae2] rounded-[24px] overflow-hidden h-80 flex flex-col">
                        {/* Mock Phone Header */}
                        <div className="bg-slate-900 text-white p-2 flex items-center space-x-2 text-[10px]">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-bold">Pré-visualização WhatsApp</span>
                        </div>

                        {/* Chat Body */}
                        <div className="flex-1 p-3 overflow-y-auto">
                          <div className="bg-emerald-700 text-white p-2.5 rounded-lg text-[10px] shadow-xs">
                            <p className="whitespace-pre-wrap">
                              {novaCampanha.messageTemplate.replace('{nome}', 'Carlos Eduardo').replace('{data}', '22/08')}
                            </p>
                            <span className="text-[8px] text-emerald-200 block text-right mt-1">10:45</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* PASSO 4 */}
              {wizardStep === 4 && (
                <div className="space-y-4 text-xs max-w-lg mx-auto">
                  <h4 className="font-bold text-slate-900 text-sm">Passo 4: Cadência e Agendamento</h4>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Data e Hora de Disparo</label>
                    <input
                      type="datetime-local"
                      value={novaCampanha.scheduledFor.replace(' ', 'T')}
                      onChange={(e) => setNovaCampanha({ ...novaCampanha, scheduledFor: e.target.value.replace('T', ' ') })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Intervalo (Delay) entre Mensagens: {novaCampanha.delaySeconds}s
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={60}
                      value={novaCampanha.delaySeconds}
                      onChange={(e) => setNovaCampanha({ ...novaCampanha, delaySeconds: Number(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Proteção anti-bloqueio: Recomendado manter acima de 15 segundos.
                    </span>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                disabled={wizardStep === 1}
                onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 font-bold text-xs rounded-lg transition-colors"
              >
                Voltar
              </button>

              {wizardStep < 4 ? (
                <button
                  onClick={() => setWizardStep((prev) => (prev + 1) as any)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors"
                >
                  Próximo Passo
                </button>
              ) : (
                <button
                  onClick={handleCreateCampaign}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                >
                  Confirmar e Agendar Disparo
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETALHES / RELATÓRIO DA CAMPANHA */}
      {/* ======================================================== */}
      {reportCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Relatório Detalhado</h3>
              <button onClick={() => setReportCampaign(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-indigo-600 text-sm">{reportCampaign.name}</h4>
              <p className="text-slate-500">Instância: {reportCampaign.instanceName}</p>

              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-3 bg-slate-50 rounded-lg border">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Enviados</span>
                  <span className="font-bold text-slate-900 text-sm">{reportCampaign.sentCount}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-emerald-600 block uppercase font-bold">Entregues</span>
                  <span className="font-bold text-emerald-700 text-sm">{reportCampaign.deliveredCount || 0}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-[10px] text-blue-600 block uppercase font-bold">Lidos</span>
                  <span className="font-bold text-blue-700 text-sm">{reportCampaign.readCount || 0}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setReportCampaign(null)}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-lg text-xs"
            >
              Fechar Relatório
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
