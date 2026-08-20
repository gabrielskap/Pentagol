import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Filter,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  QrCode,
  Search,
  Send,
  Smile,
  Tag,
  User,
  UserCheck,
  Volume2,
  X,
} from 'lucide-react';
import { MOCK_CONVERSATIONS, MOCK_INSTANCES } from '../../data/mockAdminData';
import { ChatMessage, WhatsAppConversation, WhatsAppInstance } from '../../types';

export const AdminConversationsPage: React.FC = () => {
  const [instances] = useState<WhatsAppInstance[]>(MOCK_INSTANCES);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('inst-1');
  const [conversations, setConversations] = useState<WhatsAppConversation[]>(MOCK_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>('conv-1');
  const [filtroRapido, setFiltroRapido] = useState<'todas' | 'nao_lidas' | 'aguardando' | 'agendado'>('todas');
  const [busca, setBusca] = useState('');
  
  // Chat input state
  const [inputMensagem, setInputMensagem] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isInternalNote, setIsInternalNote] = useState(false);

  // CRM Widget State: Quick Schedule
  const [novoServico, setNovoServico] = useState('Consultoria & Avaliação');
  const [novoProfissional, setNovoProfissional] = useState('Diego Armond');
  const [novaData, setNovaData] = useState('2026-08-22');
  const [novoHorario, setNovoHorario] = useState('15:00');
  const [showScheduleSuccess, setShowScheduleSuccess] = useState(false);

  // CRM Widget State: Internal Note Input
  const [novaNotaTexto, setNovaNotaTexto] = useState('');

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];
  const selectedInstance = instances.find((i) => i.id === selectedInstanceId) || instances[0];

  // Filtering conversations
  const filteredConversations = conversations.filter((c) => {
    const matchBusca =
      c.contactName.toLowerCase().includes(busca.toLowerCase()) ||
      c.phone.includes(busca);

    if (!matchBusca) return false;

    if (filtroRapido === 'nao_lidas') return c.unreadCount > 0;
    if (filtroRapido === 'aguardando') return c.status === 'aguardando';
    if (filtroRapido === 'agendado') return c.tags.some((t) => t.name === 'Agendado');
    return true;
  });

  const handleSendMessage = () => {
    if (!inputMensagem.trim()) return;

    const novaMensagem: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: isInternalNote ? 'note' : 'agent',
      text: inputMensagem,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: isInternalNote ? undefined : 'sent',
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          return {
            ...c,
            lastMessage: isInternalNote ? `[Nota Interna]: ${inputMensagem}` : inputMensagem,
            lastMessageTime: novaMensagem.timestamp,
            messages: [...c.messages, novaMensagem],
          };
        }
        return c;
      })
    );

    setInputMensagem('');
    setIsInternalNote(false);
  };

  const handleQuickReply = (texto: string) => {
    setInputMensagem(texto);
    setShowQuickReplies(false);
  };

  const handleCriarAgendamentoRapido = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv) return;

    const msgSistema: ChatMessage = {
      id: `m-app-${Date.now()}`,
      sender: 'system',
      text: `Agendamento efetuado com sucesso! Data: ${novaData} às ${novoHorario} - ${novoServico} (${novoProfissional}).`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      appointmentInfo: {
        service: novoServico,
        date: novaData,
        time: novoHorario,
        professional: novoProfissional,
      },
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          const temTagAgendado = c.tags.some((t) => t.name === 'Agendado');
          const novasTags = temTagAgendado
            ? c.tags
            : [...c.tags, { name: 'Agendado', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }];

          const novoAgendamento = {
            id: `app-${Date.now()}`,
            service: novoServico,
            professional: novoProfissional,
            date: novaData,
            time: novoHorario,
            status: 'confirmado' as const,
            price: 150,
          };

          return {
            ...c,
            tags: novasTags,
            messages: [...c.messages, msgSistema],
            appointments: [novoAgendamento, ...(c.appointments || [])],
          };
        }
        return c;
      })
    );

    setShowScheduleSuccess(true);
    setTimeout(() => setShowScheduleSuccess(false), 3000);
  };

  const handleAddInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaNotaTexto.trim() || !activeConv) return;

    const novaNota = {
      id: `note-${Date.now()}`,
      author: 'Atendente Atual',
      text: novaNotaTexto,
      date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          return {
            ...c,
            internalNotes: [novaNota, ...(c.internalNotes || [])],
          };
        }
        return c;
      })
    );

    setNovaNotaTexto('');
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-body rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      
      {/* 3-COLUMN MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ======================================================== */}
        {/* COLUNA 1: LISTA DE CONVERSAS & INSTÂNCIAS (340px) */}
        {/* ======================================================== */}
        <div className="w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
          
          {/* Header Instância */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="relative">
                <span className="w-3 h-3 bg-emerald-500 rounded-full block animate-pulse" />
                <span className="w-3 h-3 bg-emerald-400 rounded-full absolute top-0 left-0 animate-ping opacity-75" />
              </div>
              <div className="truncate">
                <div className="flex items-center space-x-1">
                  <select
                    value={selectedInstanceId}
                    onChange={(e) => setSelectedInstanceId(e.target.value)}
                    className="bg-slate-800 text-white text-xs font-semibold rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    {instances.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] text-slate-300 block mt-0.5">
                  Status: {selectedInstance.status === 'connected' ? 'Conectado 🟢' : 'Aguardando QR Code 🟡'}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
              title="QR Code / Status de Conexão"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>

          {/* Campo de Busca */}
          <div className="p-3 border-b border-slate-200 bg-white space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome ou número..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtros Rápidos */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px]">
              <button
                onClick={() => setFiltroRapido('todas')}
                className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  filtroRapido === 'todas'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({conversations.length})
              </button>
              <button
                onClick={() => setFiltroRapido('nao_lidas')}
                className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  filtroRapido === 'nao_lidas'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Não Lidas
              </button>
              <button
                onClick={() => setFiltroRapido('aguardando')}
                className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  filtroRapido === 'aguardando'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Aguardando
              </button>
              <button
                onClick={() => setFiltroRapido('agendado')}
                className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  filtroRapido === 'agendado'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Com Agendamento
              </button>
            </div>
          </div>

          {/* Lista de Conversas estilo WhatsApp Web */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhuma conversa encontrada
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeConvId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      // Clear unread count on click
                      setConversations((prev) =>
                        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
                      );
                    }}
                    className={`w-full p-3 text-left flex space-x-3 transition-colors hover:bg-slate-50 relative ${
                      isActive ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={conv.avatar}
                        alt={conv.contactName}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200"
                      />
                      {conv.status === 'online' && (
                        <span className="w-3 h-3 bg-emerald-500 border-2 border-white rounded-full absolute bottom-0 right-0" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-900 text-xs truncate">
                          {conv.contactName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {conv.lastMessageTime}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 truncate mb-1.5">
                        {conv.lastMessage}
                      </p>

                      {/* Tags */}
                      <div className="flex items-center flex-wrap gap-1">
                        {conv.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${t.color}`}
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="ml-auto self-center bg-indigo-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUNA 2: JANELA DE CHAT PRINCIPAL (Flex 1) */}
        {/* ======================================================== */}
        <div className="flex-1 bg-[#efeae2] flex flex-col min-w-0 border-r border-slate-200">
          
          {/* Header da Conversa Ativa */}
          <div className="p-3 bg-slate-900 text-white flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center space-x-3 min-w-0">
              <img
                src={activeConv.avatar}
                alt={activeConv.contactName}
                className="w-10 h-10 rounded-full object-cover border border-slate-700"
              />
              <div className="truncate">
                <div className="flex items-center space-x-2">
                  <h2 className="font-bold text-sm truncate">{activeConv.contactName}</h2>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      activeConv.status === 'online'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {activeConv.status === 'online' ? 'Online 🟢' : 'Em Atendimento'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeConv.phone} {activeConv.assignedAgent ? `• Atendente: ${activeConv.assignedAgent}` : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors flex items-center space-x-1"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encerrar Atendimento</span>
              </button>
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Área de Histórico de Mensagens */}
          <div
            className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {/* Divisor de Data */}
            <div className="flex items-center justify-center my-2">
              <span className="bg-white/80 backdrop-blur text-slate-600 text-[10px] font-semibold px-3 py-1 rounded-full shadow-xs border border-slate-200">
                Hoje
              </span>
            </div>

            {activeConv.messages.map((msg) => {
              if (msg.sender === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg p-3 max-w-md text-xs shadow-xs">
                      <div className="flex items-center space-x-2 font-bold mb-1">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>Confirmação de Agendamento</span>
                      </div>
                      <p>{msg.text}</p>
                      {msg.appointmentInfo && (
                        <div className="mt-2 pt-2 border-t border-emerald-200 text-[11px] grid grid-cols-2 gap-1 font-medium text-emerald-800">
                          <div>📅 Data: {msg.appointmentInfo.date}</div>
                          <div>⏰ Hora: {msg.appointmentInfo.time}</div>
                          <div className="col-span-2">👤 Profissional: {msg.appointmentInfo.professional}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              if (msg.sender === 'note') {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="bg-amber-100 border border-amber-300 text-amber-900 rounded-lg p-2.5 max-w-md text-xs shadow-xs font-mono">
                      <div className="flex items-center space-x-1 font-bold mb-0.5 text-amber-800">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>NOTA INTERNA (Visível apenas para equipe)</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <span className="text-[9px] text-amber-700 block text-right mt-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              }

              const isAgent = msg.sender === 'agent';

              return (
                <div
                  key={msg.id}
                  className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3.5 py-2 text-xs shadow-xs relative ${
                      isAgent
                        ? 'bg-emerald-700 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                    <div
                      className={`flex items-center justify-end space-x-1 text-[9px] mt-1 ${
                        isAgent ? 'text-emerald-200' : 'text-slate-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {isAgent && (
                        <CheckCheck className="w-3 h-3 text-emerald-200" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Banner de Alternar para Nota Interna */}
          {isInternalNote && (
            <div className="bg-amber-100 text-amber-900 px-4 py-1.5 text-xs font-semibold flex items-center justify-between border-t border-amber-300">
              <span className="flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>Modo Nota Interna Ativo - Esta mensagem NÃO será enviada ao cliente no WhatsApp</span>
              </span>
              <button
                onClick={() => setIsInternalNote(false)}
                className="text-amber-800 hover:underline text-[11px]"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Campo de Envio de Mensagem */}
          <div className="p-3 bg-white border-t border-slate-200">
            {/* Popover Respostas Rápidas */}
            {showQuickReplies && (
              <div className="mb-2 p-2 bg-slate-50 border border-slate-200 rounded-md shadow-md text-xs space-y-1">
                <span className="font-bold text-slate-500 block text-[10px] uppercase">Respostas Rápidas:</span>
                <button
                  onClick={() => handleQuickReply('Olá! Como posso te ajudar hoje?')}
                  className="block w-full text-left p-1.5 hover:bg-indigo-50 rounded text-slate-800 font-medium"
                >
                  ⚡ Saudação Inicial
                </button>
                <button
                  onClick={() => handleQuickReply('Temos horário disponível amanhã às 14:00 ou 16:00.')}
                  className="block w-full text-left p-1.5 hover:bg-indigo-50 rounded text-slate-800 font-medium"
                >
                  ⚡ Oferecer Horários
                </button>
                <button
                  onClick={() => handleQuickReply('Seu agendamento foi confirmado! Te esperamos no horário combinado.')}
                  className="block w-full text-left p-1.5 hover:bg-indigo-50 rounded text-slate-800 font-medium"
                >
                  ⚡ Confirmação de Agendamento
                </button>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsInternalNote(!isInternalNote)}
                className={`px-2.5 py-1.5 rounded text-xs font-bold transition-colors ${
                  isInternalNote
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Alternar para Nota Interna"
              >
                Nota
              </button>

              <button
                type="button"
                className="p-2 text-slate-500 hover:text-indigo-600 transition-colors"
                title="Anexar arquivo"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowQuickReplies(!showQuickReplies)}
                className="p-2 text-slate-500 hover:text-indigo-600 transition-colors text-xs font-semibold"
                title="Respostas Rápidas"
              >
                ⚡
              </button>

              <input
                type="text"
                placeholder={
                  isInternalNote
                    ? 'Escreva um lembrete interno para a equipe...'
                    : 'Digite sua mensagem para o cliente...'
                }
                value={inputMensagem}
                onChange={(e) => setInputMensagem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className={`flex-1 border rounded-md px-3 py-2 text-xs focus:outline-none ${
                  isInternalNote
                    ? 'bg-amber-50 border-amber-300 focus:ring-1 focus:ring-amber-500'
                    : 'bg-slate-50 border-slate-200 focus:ring-1 focus:ring-indigo-500'
                }`}
              />

              <button
                type="button"
                onClick={handleSendMessage}
                className={`p-2.5 rounded-md text-white transition-colors ${
                  isInternalNote
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUNA 3: PAINEL CRM & AÇÕES RÁPIDAS (320px) */}
        {/* ======================================================== */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col flex-shrink-0 overflow-y-auto p-4 space-y-5">
          
          {/* Card de Perfil do Cliente */}
          <div className="text-center pb-4 border-b border-slate-200">
            <img
              src={activeConv.avatar}
              alt={activeConv.contactName}
              className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-indigo-600 mb-2 shadow-xs"
            />
            <h3 className="font-bold text-slate-900 text-sm">{activeConv.contactName}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{activeConv.phone}</p>
            {activeConv.email && (
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{activeConv.email}</p>
            )}

            {/* Tags Atribuídas */}
            <div className="flex items-center justify-center flex-wrap gap-1 mt-3">
              {activeConv.tags.map((t, i) => (
                <span
                  key={i}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${t.color}`}
                >
                  {t.name}
                </span>
              ))}
            </div>
          </div>

          {/* Widget de Agendamento Rápido */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-indigo-950 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Agendar no Chat</span>
              </span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
                Rápido
              </span>
            </div>

            {showScheduleSuccess && (
              <div className="p-2 bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] rounded font-medium flex items-center space-x-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Agendamento efetuado!</span>
              </div>
            )}

            <form onSubmit={handleCriarAgendamentoRapido} className="space-y-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Serviço</label>
                <select
                  value={novoServico}
                  onChange={(e) => setNovoServico(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Consultoria & Avaliação">Consultoria & Avaliação (R$ 150)</option>
                  <option value="Manutenção Preventiva">Manutenção Preventiva (R$ 120)</option>
                  <option value="Instalação de Equipamento">Instalação de Equipamento (R$ 350)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Profissional</label>
                <select
                  value={novoProfissional}
                  onChange={(e) => setNovoProfissional(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Diego Armond">Diego Armond</option>
                  <option value="Fernanda Lima">Fernanda Lima</option>
                  <option value="Lucas Santos">Lucas Santos</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Data</label>
                  <input
                    type="date"
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Hora</label>
                  <input
                    type="time"
                    value={novoHorario}
                    onChange={(e) => setNovoHorario(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded transition-colors text-xs flex items-center justify-center space-x-1 mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Confirmar Agendamento</span>
              </button>
            </form>
          </div>

          {/* Histórico de Agendamentos do Contato */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Histórico de Horários</span>
            </h4>

            {!activeConv.appointments || activeConv.appointments.length === 0 ? (
              <p className="text-slate-400 text-xs italic">Nenhum agendamento registrado.</p>
            ) : (
              <div className="space-y-1.5">
                {activeConv.appointments.map((app) => (
                  <div
                    key={app.id}
                    className="p-2 border border-slate-200 rounded bg-slate-50 text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{app.service}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          app.status === 'confirmado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'concluido'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      📅 {app.date} às {app.time} ({app.professional})
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bloco de Notas Internas */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Notas da Equipe
            </h4>

            <form onSubmit={handleAddInternalNote} className="space-y-1.5">
              <textarea
                placeholder="Adicionar nota sobre este cliente..."
                value={novaNotaTexto}
                onChange={(e) => setNovaNotaTexto(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold py-1 rounded transition-colors"
              >
                Salvar Nota
              </button>
            </form>

            <div className="space-y-1.5 pt-2">
              {activeConv.internalNotes?.map((note) => (
                <div key={note.id} className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] space-y-1">
                  <p className="text-amber-900">{note.text}</p>
                  <div className="flex items-center justify-between text-[9px] text-amber-700">
                    <span>👤 {note.author}</span>
                    <span>{note.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
