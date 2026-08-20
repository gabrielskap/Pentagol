import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Copy,
  Edit3,
  GitBranch,
  GitFork,
  MessageSquare,
  Play,
  Plus,
  Power,
  RotateCcw,
  Search,
  Settings,
  Sliders,
  Trash2,
  UserCheck,
  Workflow,
  X,
} from 'lucide-react';
import { MOCK_FLOWS } from '../../data/mockAdminData';
import { AutomationFlow, FlowNode, FlowNodeType } from '../../types';

export const AdminFlowsPage: React.FC = () => {
  const [flows, setFlows] = useState<AutomationFlow[]>(MOCK_FLOWS);
  const [activeTab, setActiveTab] = useState<'flows' | 'history'>('flows');
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Visual Builder Modal State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<AutomationFlow | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-start');

  const filteredFlows = flows.filter((f) => {
    const matchBusca =
      f.name.toLowerCase().includes(busca.toLowerCase()) ||
      f.description.toLowerCase().includes(busca.toLowerCase());
    if (!matchBusca) return false;
    if (filtroStatus === 'active') return f.status === 'active';
    if (filtroStatus === 'inactive') return f.status === 'inactive';
    return true;
  });

  const handleToggleStatus = (id: string) => {
    setFlows((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: f.status === 'active' ? 'inactive' : 'active' } : f
      )
    );
  };

  const handleDuplicateFlow = (flow: AutomationFlow) => {
    const novoFluxo: AutomationFlow = {
      ...flow,
      id: `flow-${Date.now()}`,
      name: `${flow.name} (Cópia)`,
      executionsCount: 0,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setFlows([novoFluxo, ...flows]);
  };

  const handleDeleteFlow = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este fluxo?')) {
      setFlows(flows.filter((f) => f.id !== id));
    }
  };

  const handleOpenBuilder = (flow?: AutomationFlow) => {
    if (flow) {
      setEditingFlow(flow);
      setSelectedNodeId(flow.nodes?.[0]?.id || 'node-start');
    } else {
      const novoFluxo: AutomationFlow = {
        id: `flow-${Date.now()}`,
        name: 'Novo Fluxo de Automação',
        description: 'Descrição do fluxo personalizado...',
        trigger: 'Primeira Mensagem',
        status: 'active',
        instanceName: 'Atendimento Matriz',
        executionsCount: 0,
        completionRate: 100,
        updatedAt: new Date().toISOString().split('T')[0],
        nodes: [
          {
            id: 'node-start',
            type: 'start',
            title: 'Início da Conversa',
            content: 'Gatilho: Primeira mensagem recebida no WhatsApp',
            position: { x: 50, y: 100 },
          },
          {
            id: 'node-text-1',
            type: 'text',
            title: 'Mensagem de Resposta',
            content: 'Olá! Seja bem-vindo ao nosso atendimento.',
            position: { x: 340, y: 100 },
          },
        ],
      };
      setEditingFlow(novoFluxo);
      setSelectedNodeId('node-start');
    }
    setIsBuilderOpen(true);
  };

  const handleAddNode = (type: FlowNodeType) => {
    if (!editingFlow) return;

    const newNodeId = `node-${type}-${Date.now()}`;
    const titles: Record<FlowNodeType, string> = {
      start: 'Gatilho Inicial',
      text: 'Enviar Mensagem',
      menu: 'Menu de Opções',
      condition: 'Condição (If/Else)',
      action: 'Executar Ação',
    };

    const contents: Record<FlowNodeType, string> = {
      start: 'Quando cliente enviar mensagem',
      text: 'Escreva a mensagem aqui...',
      menu: 'Selecione uma opção abaixo:',
      condition: 'Verificar se tag = VIP',
      action: 'Criar Agendamento / Atribuir Tag',
    };

    const count = editingFlow.nodes?.length || 0;

    const newNode: FlowNode = {
      id: newNodeId,
      type,
      title: titles[type],
      content: contents[type],
      position: { x: 100 + count * 50, y: 150 + (count % 2) * 80 },
    };

    setEditingFlow({
      ...editingFlow,
      nodes: [...(editingFlow.nodes || []), newNode],
    });
    setSelectedNodeId(newNodeId);
  };

  const handleUpdateSelectedNode = (field: keyof FlowNode, value: any) => {
    if (!editingFlow || !selectedNodeId) return;

    setEditingFlow({
      ...editingFlow,
      nodes: editingFlow.nodes?.map((n) =>
        n.id === selectedNodeId ? { ...n, [field]: value } : n
      ),
    });
  };

  const selectedNode = editingFlow?.nodes?.find((n) => n.id === selectedNodeId);

  return (
    <div className="space-y-6 font-body">
      
      {/* HEADER & TOP METRICS CARDS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Workflow className="w-7 h-7 text-indigo-600" />
            <span>Fluxos de Automação (Chatbot)</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Crie árvores de decisão visuais e automações inteligentes via WhatsApp.
          </p>
        </div>

        <button
          onClick={() => handleOpenBuilder()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center space-x-2 transition-colors shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Criar Novo Fluxo</span>
        </button>
      </div>

      {/* STATS METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-medium uppercase">Total de Fluxos</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{flows.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Power className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-medium uppercase">Fluxos Ativos</span>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">
              {flows.filter((f) => f.status === 'active').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-medium uppercase">Execuções Este Mês</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">3.100</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-medium uppercase">Taxa de Conclusão</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">94%</p>
          </div>
        </div>
      </div>

      {/* TAB SYSTEM */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Navigation Tabs Header */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 pt-3">
          <button
            onClick={() => setActiveTab('flows')}
            className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'flows'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Meus Fluxos ({flows.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Histórico de Execuções (Sessões)
          </button>
        </div>

        {activeTab === 'flows' ? (
          <div className="p-5 space-y-4">
            
            {/* Search & Filters Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar fluxo por nome ou descrição..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Somente Ativos</option>
                  <option value="inactive">Somente Inativos</option>
                </select>
              </div>
            </div>

            {/* Flows Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFlows.map((flow) => (
                <div
                  key={flow.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            flow.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                          }`}
                        />
                        <h3 className="font-bold text-slate-900 text-sm">{flow.name}</h3>
                      </div>

                      <button
                        onClick={() => handleToggleStatus(flow.id)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                          flow.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {flow.status === 'active' ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>

                    <p className="text-slate-500 text-xs mt-1.5 line-clamp-2">{flow.description}</p>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block font-medium">Gatilho:</span>
                        <span className="text-slate-800 font-semibold truncate block">{flow.trigger}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Instância:</span>
                        <span className="text-slate-800 font-semibold truncate block">{flow.instanceName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      Execuções: <strong className="text-slate-700">{flow.executionsCount}</strong>
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenBuilder(flow)}
                        className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold rounded-md transition-colors flex items-center space-x-1"
                        title="Editar no Construtor Visual"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDuplicateFlow(flow)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                        title="Duplicar Fluxo"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFlow(flow.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                        title="Excluir Fluxo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        ) : (
          /* Aba Histórico de Execuções */
          <div className="p-6 text-xs text-slate-600 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Últimas Execuções de Chatbot</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
                    <th className="p-3 border-b">ID Sessão</th>
                    <th className="p-3 border-b">Fluxo</th>
                    <th className="p-3 border-b">Contato</th>
                    <th className="p-3 border-b">Início</th>
                    <th className="p-3 border-b">Passos Executados</th>
                    <th className="p-3 border-b">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-indigo-600 font-bold">#sess-9821</td>
                    <td className="p-3 font-medium text-slate-900">Boas-vindas & Agendamento Automático</td>
                    <td className="p-3">Carlos Eduardo (+55 11 98888-1234)</td>
                    <td className="p-3">20/08/2026 10:38</td>
                    <td className="p-3">5/5 nós executados</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        Concluído
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-indigo-600 font-bold">#sess-9820</td>
                    <td className="p-3 font-medium text-slate-900">Pesquisa de Satisfação NPS</td>
                    <td className="p-3">Mariana Silva (+55 21 97654-3210)</td>
                    <td className="p-3">19/08/2026 16:15</td>
                    <td className="p-3">3/3 nós executados</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        Concluído
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL / SUBTELA: VISUAL FLOW BUILDER */}
      {/* ======================================================== */}
      {isBuilderOpen && editingFlow && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col">
          
          {/* Builder Top Bar */}
          <div className="h-14 bg-slate-900 text-white px-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Workflow className="w-5 h-5 text-indigo-400" />
              <div>
                <input
                  type="text"
                  value={editingFlow.name}
                  onChange={(e) => setEditingFlow({ ...editingFlow, name: e.target.value })}
                  className="bg-transparent font-bold text-sm text-white focus:outline-none border-b border-transparent focus:border-indigo-400"
                />
                <span className="text-[10px] text-slate-400 block">
                  Construtor Visual de Fluxo • Instância: {editingFlow.instanceName}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setFlows((prev) => {
                    const idx = prev.findIndex((f) => f.id === editingFlow.id);
                    if (idx >= 0) {
                      const copia = [...prev];
                      copia[idx] = editingFlow;
                      return copia;
                    }
                    return [editingFlow, ...prev];
                  });
                  setIsBuilderOpen(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors"
              >
                Salvar Alterações
              </button>
              <button
                onClick={() => setIsBuilderOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Builder Main Canvas Area */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Sidebar: Nós Arrastáveis/Adicionáveis */}
            <div className="w-64 bg-slate-900 border-r border-slate-800 p-4 text-white flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
                  Adicionar Nós ao Canvas
                </h3>

                <button
                  onClick={() => handleAddNode('text')}
                  className="w-full p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-2.5 transition-colors text-left"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span>Mensagem de Texto</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Envia texto formatado</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNode('menu')}
                  className="w-full p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-2.5 transition-colors text-left"
                >
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <div>
                    <span>Menu de Opções</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Perguntas com botões</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNode('condition')}
                  className="w-full p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-2.5 transition-colors text-left"
                >
                  <GitFork className="w-4 h-4 text-amber-400" />
                  <div>
                    <span>Condição (If/Else)</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Desvia fluxo por regras</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNode('action')}
                  className="w-full p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-2.5 transition-colors text-left"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span>Ação de Sistema</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Agendar / Tag / Humano</span>
                  </div>
                </button>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-bold text-slate-300">💡 Dica:</p>
                <p>Clique em um nó na tela para editar suas propriedades no painel lateral direito.</p>
              </div>
            </div>

            {/* Dotted Grid Interactive Canvas */}
            <div
              className="flex-1 bg-slate-950 relative overflow-auto p-8"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            >
              {/* Nodes Rendering */}
              <div className="relative min-w-[1200px] min-h-[600px]">
                {editingFlow.nodes?.map((node) => {
                  const isSelected = node.id === selectedNodeId;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      style={{
                        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
                      }}
                      className={`absolute w-64 bg-slate-900 border rounded-xl shadow-xl text-white cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-500/40 z-20'
                          : 'border-slate-800 hover:border-slate-700 z-10'
                      }`}
                    >
                      {/* Node Header */}
                      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 rounded-t-xl">
                        <span className="font-bold text-xs text-indigo-300 flex items-center space-x-1.5">
                          {node.type === 'start' && <Play className="w-3.5 h-3.5 text-emerald-400" />}
                          {node.type === 'text' && <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />}
                          {node.type === 'menu' && <Sliders className="w-3.5 h-3.5 text-purple-400" />}
                          {node.type === 'condition' && <GitFork className="w-3.5 h-3.5 text-amber-400" />}
                          {node.type === 'action' && <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                          <span>{node.title}</span>
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {node.type}
                        </span>
                      </div>

                      {/* Node Body */}
                      <div className="p-3 text-xs text-slate-300 space-y-2">
                        <p className="line-clamp-3 text-[11px] leading-relaxed">{node.content}</p>

                        {node.options && (
                          <div className="space-y-1 pt-1">
                            {node.options.map((opt) => (
                              <div
                                key={opt.id}
                                className="p-1.5 bg-slate-800 rounded text-[10px] font-semibold text-purple-300 flex items-center justify-between"
                              >
                                <span>{opt.label}</span>
                                <ArrowRight className="w-3 h-3 text-purple-400" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Selected Node Properties Inspector */}
            {selectedNode && (
              <div className="w-72 bg-slate-900 border-l border-slate-800 p-4 text-white space-y-4 overflow-y-auto">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h3 className="font-bold text-xs text-indigo-300 uppercase tracking-wider">
                    Propriedades do Nó
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">{selectedNode.id}</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Título do Nó</label>
                    <input
                      type="text"
                      value={selectedNode.title}
                      onChange={(e) => handleUpdateSelectedNode('title', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Conteúdo da Mensagem</label>
                    <textarea
                      value={selectedNode.content}
                      onChange={(e) => handleUpdateSelectedNode('content', e.target.value)}
                      rows={4}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {selectedNode.type === 'action' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Tipo de Ação</label>
                      <select
                        value={selectedNode.actionConfig?.actionType || 'Criar Agendamento'}
                        onChange={(e) =>
                          handleUpdateSelectedNode('actionConfig', {
                            ...selectedNode.actionConfig,
                            actionType: e.target.value,
                          })
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Criar Agendamento">Criar Agendamento</option>
                        <option value="Adicionar Tag">Adicionar Tag ao Cliente</option>
                        <option value="Transferir para Humano">Transferir para Atendente Humano</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
