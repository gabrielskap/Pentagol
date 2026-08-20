import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  Clock,
  ExternalLink,
  Facebook,
  FileText,
  Filter,
  Info,
  Instagram,
  Mail,
  MessageCircle,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Tag,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import { MOCK_CONVERSATIONS, MOCK_INSTANCES } from '../../data/mockAdminData';
import {
  ChannelType,
  ChatMessage,
  ConversationStatus,
  WhatsAppConversation,
  WhatsAppInstance,
} from '../../types';

// Helper to render channel icon & styling
export const getChannelBadge = (channel: ChannelType = 'whatsapp', size: 'sm' | 'md' | 'lg' = 'md') => {
  switch (channel) {
    case 'instagram':
      return {
        label: 'Instagram',
        icon: Instagram,
        bgClass: 'bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 text-white',
        pillClass: 'bg-pink-50 text-pink-700 border-pink-200',
        badgeColor: 'bg-pink-600 text-white',
        borderAccent: 'border-pink-500',
      };
    case 'facebook':
      return {
        label: 'Facebook',
        icon: Facebook,
        bgClass: 'bg-blue-600 text-white',
        pillClass: 'bg-blue-50 text-blue-700 border-blue-200',
        badgeColor: 'bg-blue-600 text-white',
        borderAccent: 'border-blue-500',
      };
    case 'email':
      return {
        label: 'E-mail',
        icon: Mail,
        bgClass: 'bg-amber-600 text-white',
        pillClass: 'bg-amber-50 text-amber-800 border-amber-200',
        badgeColor: 'bg-amber-600 text-white',
        borderAccent: 'border-amber-500',
      };
    case 'whatsapp':
    default:
      return {
        label: 'WhatsApp',
        icon: MessageSquare,
        bgClass: 'bg-emerald-600 text-white',
        pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badgeColor: 'bg-emerald-600 text-white',
        borderAccent: 'border-emerald-500',
      };
  }
};

export const AdminConversationsPage: React.FC = () => {
  const [instances] = useState<WhatsAppInstance[]>(MOCK_INSTANCES);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('inst-1');
  const [conversations, setConversations] = useState<WhatsAppConversation[]>(MOCK_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>('conv-wa-1');
  
  // Navigation & Filter State
  const [canalFiltro, setCanalFiltro] = useState<ChannelType | 'todos'>('todos');
  const [statusFiltro, setStatusFiltro] = useState<'todas' | 'nao_lidas' | 'em_atendimento' | 'aguardando' | 'finalizadas' | 'minhas'>('todas');
  const [busca, setBusca] = useState('');

  // Mobile View Navigation State: 'list' | 'chat' | 'info'
  const [mobileView, setMobileView] = useState<'list' | 'chat' | 'info'>('list');

  // Chat Input State
  const [inputMensagem, setInputMensagem] = useState('');
  const [inputAssuntoEmail, setInputAssuntoEmail] = useState('');
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
  
  // Tag input state
  const [novaTagNome, setNovaTagNome] = useState('');

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];
  const selectedInstance = instances.find((i) => i.id === selectedInstanceId) || instances[0];

  // Channel Counters
  const channelCounts = useMemo(() => {
    return {
      todos: conversations.length,
      whatsapp: conversations.filter((c) => (c.channel || 'whatsapp') === 'whatsapp').length,
      instagram: conversations.filter((c) => c.channel === 'instagram').length,
      facebook: conversations.filter((c) => c.channel === 'facebook').length,
      email: conversations.filter((c) => c.channel === 'email').length,
    };
  }, [conversations]);

  // Filtering conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const channel = c.channel || 'whatsapp';
      
      // Canal filter
      if (canalFiltro !== 'todos' && channel !== canalFiltro) {
        return false;
      }

      // Status filter
      if (statusFiltro === 'nao_lidas' && c.unreadCount === 0) return false;
      if (statusFiltro === 'em_atendimento' && c.status !== 'em_atendimento' && c.status !== 'online') return false;
      if (statusFiltro === 'aguardando' && c.status !== 'aguardando') return false;
      if (statusFiltro === 'finalizadas' && c.status !== 'finalizada') return false;
      if (statusFiltro === 'minhas' && c.assignedAgent !== 'Diego Armond') return false;

      // Text search
      if (busca.trim()) {
        const query = busca.toLowerCase().trim();
        const matchName = c.contactName.toLowerCase().includes(query);
        const matchPhone = c.phone?.toLowerCase().includes(query) || false;
        const matchEmail = c.email?.toLowerCase().includes(query) || false;
        const matchUsername = c.username?.toLowerCase().includes(query) || false;
        const matchSubject = c.emailSubject?.toLowerCase().includes(query) || false;
        const matchLastMsg = c.lastMessage.toLowerCase().includes(query);
        const matchMsgBody = c.messages.some((m) => m.text.toLowerCase().includes(query));

        if (!matchName && !matchPhone && !matchEmail && !matchUsername && !matchSubject && !matchLastMsg && !matchMsgBody) {
          return false;
        }
      }

      return true;
    });
  }, [conversations, canalFiltro, statusFiltro, busca]);

  // Handle Sending Message
  const handleSendMessage = () => {
    if (!inputMensagem.trim() || !activeConv) return;

    const channel = activeConv.channel || 'whatsapp';

    const novaMensagem: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: isInternalNote ? 'note' : 'agent',
      text: inputMensagem,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: isInternalNote ? undefined : 'sent',
      emailSubject: channel === 'email' ? (inputAssuntoEmail || `Re: ${activeConv.emailSubject || 'Atendimento'}`) : undefined,
      emailFrom: channel === 'email' ? 'atendimento@pentagol.com.br' : undefined,
      emailTo: channel === 'email' ? activeConv.email : undefined,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            status: c.status === 'finalizada' ? 'em_atendimento' : c.status,
            assignedAgent: c.assignedAgent || 'Diego Armond',
            lastMessage: isInternalNote ? `[Nota Interna]: ${inputMensagem}` : inputMensagem,
            lastMessageTime: 'Agora',
            messages: [...c.messages, novaMensagem],
          };
        }
        return c;
      })
    );

    setInputMensagem('');
    setInputAssuntoEmail('');
    setIsInternalNote(false);
  };

  const handleQuickReply = (texto: string) => {
    setInputMensagem(texto);
    setShowQuickReplies(false);
  };

  // Change conversation status
  const handleSetStatus = (newStatus: ConversationStatus) => {
    if (!activeConv) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConv.id ? { ...c, status: newStatus } : c))
    );
  };

  // Toggle Unread status
  const handleToggleUnread = () => {
    if (!activeConv) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? { ...c, unreadCount: c.unreadCount > 0 ? 0 : 1 }
          : c
      )
    );
  };

  // Assume Atendimento
  const handleAssumeAtendimento = () => {
    if (!activeConv) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? { ...c, assignedAgent: 'Diego Armond', status: 'em_atendimento' }
          : c
      )
    );
  };

  // Quick Schedule
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
        if (c.id === activeConv.id) {
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

  // Add Internal Note
  const handleAddInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaNotaTexto.trim() || !activeConv) return;

    const novaNota = {
      id: `note-${Date.now()}`,
      author: 'Diego Armond',
      text: novaNotaTexto,
      date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
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

  // Add Tag
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaTagNome.trim() || !activeConv) return;
    const colors = [
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-emerald-100 text-emerald-800 border-emerald-200',
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          if (c.tags.some((t) => t.name.toLowerCase() === novaTagNome.toLowerCase())) return c;
          return {
            ...c,
            tags: [...c.tags, { name: novaTagNome.trim(), color: randomColor }],
          };
        }
        return c;
      })
    );
    setNovaTagNome('');
  };

  // Remove Tag
  const handleRemoveTag = (tagName: string) => {
    if (!activeConv) return;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            tags: c.tags.filter((t) => t.name !== tagName),
          };
        }
        return c;
      })
    );
  };

  const activeChannelBadge = getChannelBadge(activeConv?.channel);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-100 font-body rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* 3-COLUMN RESPONSIVE LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ======================================================== */}
        {/* COLUNA 1: FILTROS & LISTA UNIFICADA DE CONVERSAS (360px) */}
        {/* ======================================================== */}
        <div
          className={`w-full lg:w-96 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-20 ${
            mobileView === 'list' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          
          {/* Header Superior - Central Multicanal & Seleção de Instância */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-950 text-white flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h1 className="font-bold text-sm text-white tracking-wide">Central Multicanal</h1>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                {conversations.length} Atendimentos
              </span>
            </div>

            {/* Selector Instância (WhatsApp) */}
            <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-xs">
              <div className="flex items-center space-x-2 truncate">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <select
                  value={selectedInstanceId}
                  onChange={(e) => setSelectedInstanceId(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer truncate"
                >
                  {instances.map((inst) => (
                    <option key={inst.id} value={inst.id} className="bg-slate-900 text-white">
                      {inst.name} ({inst.phone})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                title="Status WhatsApp QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* BARRA DE SELEÇÃO DE CANAIS (WhatsApp, Instagram, Facebook, Email) */}
          <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
            <button
              onClick={() => setCanalFiltro('todos')}
              className={`flex-1 py-1.5 px-2 rounded-md font-bold transition-all flex items-center justify-center space-x-1.5 ${
                canalFiltro === 'todos'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Todos</span>
              <span className="text-[9px] px-1 py-0.2 rounded-full bg-slate-950/50">
                {channelCounts.todos}
              </span>
            </button>

            <button
              onClick={() => setCanalFiltro('whatsapp')}
              className={`py-1.5 px-2 rounded-md font-bold transition-all flex items-center space-x-1 ${
                canalFiltro === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
              }`}
              title="Filtrar WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WA</span>
              <span className="text-[9px] px-1 py-0.2 rounded-full bg-slate-950/50">
                {channelCounts.whatsapp}
              </span>
            </button>

            <button
              onClick={() => setCanalFiltro('instagram')}
              className={`py-1.5 px-2 rounded-md font-bold transition-all flex items-center space-x-1 ${
                canalFiltro === 'instagram'
                  ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-pink-400 hover:bg-slate-800'
              }`}
              title="Filtrar Instagram"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>IG</span>
              <span className="text-[9px] px-1 py-0.2 rounded-full bg-slate-950/50">
                {channelCounts.instagram}
              </span>
            </button>

            <button
              onClick={() => setCanalFiltro('facebook')}
              className={`py-1.5 px-2 rounded-md font-bold transition-all flex items-center space-x-1 ${
                canalFiltro === 'facebook'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'
              }`}
              title="Filtrar Facebook"
            >
              <Facebook className="w-3.5 h-3.5" />
              <span>FB</span>
              <span className="text-[9px] px-1 py-0.2 rounded-full bg-slate-950/50">
                {channelCounts.facebook}
              </span>
            </button>

            <button
              onClick={() => setCanalFiltro('email')}
              className={`py-1.5 px-2 rounded-md font-bold transition-all flex items-center space-x-1 ${
                canalFiltro === 'email'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
              }`}
              title="Filtrar E-mail"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Mail</span>
              <span className="text-[9px] px-1 py-0.2 rounded-full bg-slate-950/50">
                {channelCounts.email}
              </span>
            </button>
          </div>

          {/* Campo de Busca & Filtros por Status */}
          <div className="p-3 border-b border-slate-200 bg-white space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar cliente, @usuario, e-mail ou mensagem..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 pl-9 pr-8 py-1.5 text-xs text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

            {/* Filtros Rápidos por Status */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px] custom-scrollbar">
              <button
                onClick={() => setStatusFiltro('todas')}
                className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  statusFiltro === 'todas'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setStatusFiltro('nao_lidas')}
                className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  statusFiltro === 'nao_lidas'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Não Lidas
              </button>
              <button
                onClick={() => setStatusFiltro('em_atendimento')}
                className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  statusFiltro === 'em_atendimento'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Em Atendimento
              </button>
              <button
                onClick={() => setStatusFiltro('aguardando')}
                className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  statusFiltro === 'aguardando'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Aguardando
              </button>
              <button
                onClick={() => setStatusFiltro('finalizadas')}
                className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  statusFiltro === 'finalizadas'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Finalizadas
              </button>
              <button
                onClick={() => setStatusFiltro('minhas')}
                className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  statusFiltro === 'minhas'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Minhas Conversas
              </button>
            </div>
          </div>

          {/* LISTA UNIFICADA DE CONVERSAS */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-semibold">Nenhuma conversa encontrada</p>
                <p className="text-[11px] text-slate-400 mt-1">Tente ajustar os filtros por canal ou busca.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeConvId;
                const channelInfo = getChannelBadge(conv.channel);
                const ChannelIcon = channelInfo.icon;

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setMobileView('chat');
                      // Clear unread count on click
                      setConversations((prev) =>
                        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
                      );
                    }}
                    className={`w-full p-3 text-left flex space-x-3 transition-colors hover:bg-slate-50 relative ${
                      isActive ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : ''
                    }`}
                  >
                    {/* Avatar com Badge do Canal de Origem */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={conv.avatar}
                        alt={conv.contactName}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-xs"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 p-1 rounded-full text-white shadow-xs ${channelInfo.bgClass}`}
                        title={`Canal: ${channelInfo.label}`}
                      >
                        <ChannelIcon className="w-2.5 h-2.5" />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-xs truncate flex items-center space-x-1">
                          <span>{conv.contactName}</span>
                          {conv.username && (
                            <span className="text-[10px] text-pink-600 font-normal">
                              {conv.username}
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                          {conv.lastMessageTime}
                        </span>
                      </div>

                      {/* Assunto de Email ou Última Mensagem */}
                      {conv.channel === 'email' && conv.emailSubject ? (
                        <p className="text-xs font-semibold text-slate-800 truncate mb-1 flex items-center space-x-1">
                          <span className="text-amber-600">✉</span>
                          <span>{conv.emailSubject}</span>
                        </p>
                      ) : null}

                      <p className="text-xs text-slate-500 truncate mb-1.5">
                        {conv.lastMessage}
                      </p>

                      {/* Tag do Canal & Status */}
                      <div className="flex items-center flex-wrap gap-1">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center space-x-1 ${channelInfo.pillClass}`}
                        >
                          <ChannelIcon className="w-2.5 h-2.5" />
                          <span>{channelInfo.label}</span>
                        </span>

                        {conv.status === 'em_atendimento' && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                            Em Atendimento
                          </span>
                        )}
                        {conv.status === 'aguardando' && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-semibold">
                            Aguardando
                          </span>
                        )}
                        {conv.status === 'finalizada' && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-semibold">
                            Finalizada
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contador de Não Lidas */}
                    {conv.unreadCount > 0 && (
                      <span className="ml-auto self-center bg-indigo-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
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
        {/* COLUNA 2: JANELA DE CHAT ADAPTÁVEL AO CANAL (Flex 1) */}
        {/* ======================================================== */}
        <div
          className={`flex-1 bg-[#f8fafc] flex flex-col min-w-0 border-r border-slate-200 z-10 ${
            mobileView === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {activeConv ? (
            <>
              {/* Header da Conversa Ativa */}
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center space-x-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileView('list')}
                    className="lg:hidden p-1.5 -ml-1 text-slate-300 hover:text-white rounded hover:bg-slate-800"
                    title="Voltar para lista"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="relative flex-shrink-0">
                    <img
                      src={activeConv.avatar}
                      alt={activeConv.contactName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow-xs"
                    />
                    {(() => {
                      const badge = getChannelBadge(activeConv.channel);
                      const IconComp = badge.icon;
                      return (
                        <span
                          className={`absolute -bottom-1 -right-1 p-0.5 rounded-full text-white ${badge.bgClass}`}
                        >
                          <IconComp className="w-2.5 h-2.5" />
                        </span>
                      );
                    })()}
                  </div>

                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <h2 className="font-bold text-sm truncate">{activeConv.contactName}</h2>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${activeChannelBadge.pillClass}`}
                      >
                        {activeChannelBadge.label}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {activeConv.channel === 'whatsapp' && (activeConv.phone || 'Sem número')}
                      {activeConv.channel === 'instagram' && (activeConv.username || `@${activeConv.contactName.toLowerCase().replace(/\s+/g, '')}`)}
                      {activeConv.channel === 'facebook' && (activeConv.facebookProfileUrl || 'Perfil Messenger')}
                      {activeConv.channel === 'email' && (activeConv.email || 'contato@cliente.com')}
                      {activeConv.assignedAgent ? ` • Atendente: ${activeConv.assignedAgent}` : ' • Não Atribuído'}
                    </p>
                  </div>
                </div>

                {/* Botões de Ação do Atendimento */}
                <div className="flex items-center space-x-2">
                  {!activeConv.assignedAgent && (
                    <button
                      type="button"
                      onClick={handleAssumeAtendimento}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-colors flex items-center space-x-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Assumir</span>
                    </button>
                  )}

                  {activeConv.status === 'finalizada' ? (
                    <button
                      type="button"
                      onClick={() => handleSetStatus('em_atendimento')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reabrir</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetStatus('finalizada')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Encerrar</span>
                    </button>
                  )}

                  {/* Mobile Drawer Info Button */}
                  <button
                    onClick={() => setMobileView('info')}
                    className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="Detalhes do cliente"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ÁREA DE HISTÓRICO DE MENSAGENS */}
              <div
                className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50"
                style={{
                  backgroundImage:
                    activeConv.channel === 'whatsapp'
                      ? 'radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)'
                      : 'none',
                  backgroundSize: '20px 20px',
                }}
              >
                {/* Visual Header Especial para E-MAIL */}
                {activeConv.channel === 'email' && activeConv.emailSubject && (
                  <div className="bg-white border border-amber-200 rounded-xl p-3.5 shadow-xs mb-4">
                    <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs mb-1">
                      <Mail className="w-4 h-4 text-amber-600" />
                      <span>Thread de E-mail</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{activeConv.emailSubject}</h3>
                    <div className="mt-2 text-[11px] text-slate-500 grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                      <div>De: {activeConv.email}</div>
                      <div>Para: atendimento@pentagol.com.br</div>
                    </div>
                  </div>
                )}

                {/* Divisor de Data */}
                <div className="flex items-center justify-center my-2">
                  <span className="bg-white/90 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full shadow-xs border border-slate-200 uppercase tracking-wider">
                    Histórico da Conversa
                  </span>
                </div>

                {/* Lista de Mensagens */}
                {activeConv.messages.map((msg) => {
                  // Mensagem do Sistema (ex: Agendamento)
                  if (msg.sender === 'system') {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3 max-w-md text-xs shadow-xs">
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

                  // Mensagem tipo Nota Interna
                  if (msg.sender === 'note') {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className="bg-amber-100 border border-amber-300 text-amber-950 rounded-xl p-3 max-w-md text-xs shadow-xs font-mono">
                          <div className="flex items-center space-x-1.5 font-bold mb-1 text-amber-900">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                            <span>NOTA INTERNA (Equipe)</span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          <span className="text-[9px] text-amber-700 block text-right mt-1 font-semibold">
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  const isAgent = msg.sender === 'agent';

                  // Render de E-MAIL específico
                  if (activeConv.channel === 'email') {
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'} my-2`}
                      >
                        <div
                          className={`w-full max-w-2xl bg-white border rounded-xl shadow-xs p-4 space-y-2 ${
                            isAgent ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                            <div className="flex items-center space-x-2">
                              <Mail className={`w-4 h-4 ${isAgent ? 'text-indigo-600' : 'text-slate-500'}`} />
                              <span className="font-bold text-slate-800">
                                {isAgent ? 'Atendimento Pentagol' : activeConv.contactName}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                          </div>

                          <div className="text-[11px] text-slate-500 font-mono">
                            <span>De: {msg.emailFrom || (isAgent ? 'atendimento@pentagol.com.br' : activeConv.email)}</span>
                            <br />
                            <span>Para: {msg.emailTo || (isAgent ? activeConv.email : 'atendimento@pentagol.com.br')}</span>
                          </div>

                          <div className="pt-2 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Render de CHAT (WhatsApp, Instagram, Facebook)
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-xs relative ${
                          isAgent
                            ? activeConv.channel === 'instagram'
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none'
                              : activeConv.channel === 'facebook'
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-emerald-700 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                        <div
                          className={`flex items-center justify-end space-x-1 text-[9px] mt-1 ${
                            isAgent ? 'opacity-80' : 'text-slate-400'
                          }`}
                        >
                          <span>{msg.timestamp}</span>
                          {isAgent && <CheckCheck className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Banner de Modo Nota Interna */}
              {isInternalNote && (
                <div className="bg-amber-100 text-amber-900 px-4 py-2 text-xs font-semibold flex items-center justify-between border-t border-amber-300">
                  <span className="flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    <span>Modo Nota Interna - Visível apenas para a equipe (Não é enviada ao cliente)</span>
                  </span>
                  <button
                    onClick={() => setIsInternalNote(false)}
                    className="text-amber-800 hover:underline text-[11px]"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* Campo de Envio de Mensagem / Resposta */}
              <div className="p-3 bg-white border-t border-slate-200">
                {/* Popover Respostas Rápidas */}
                {showQuickReplies && (
                  <div className="mb-2 p-2 bg-slate-50 border border-slate-200 rounded-lg shadow-lg text-xs space-y-1">
                    <span className="font-bold text-slate-500 block text-[10px] uppercase tracking-wider">
                      Respostas Rápidas:
                    </span>
                    <button
                      onClick={() => handleQuickReply('Olá! Como posso te ajudar hoje?')}
                      className="block w-full text-left p-1.5 hover:bg-indigo-50 rounded text-slate-800 font-medium"
                    >
                      ⚡ Saudação Inicial
                    </button>
                    <button
                      onClick={() => handleQuickReply('Seu pedido foi faturado e será despachado em breve!')}
                      className="block w-full text-left p-1.5 hover:bg-indigo-50 rounded text-slate-800 font-medium"
                    >
                      ⚡ Status de Faturamento
                    </button>
                    <button
                      onClick={() => handleQuickReply('Temos frete grátis via Sedex em compras acima de R$ 199!')}
                      className="block w-full text-left p-1.5 hover:bg-indigo-50 rounded text-slate-800 font-medium"
                    >
                      ⚡ Promoção Frete Grátis
                    </button>
                  </div>
                )}

                {/* Se for E-mail, exibe campo de Assunto opcional */}
                {activeConv.channel === 'email' && !isInternalNote && (
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder={`Assunto: Re: ${activeConv.emailSubject || 'Atendimento'}`}
                      value={inputAssuntoEmail}
                      onChange={(e) => setInputAssuntoEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(!isInternalNote)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      isInternalNote
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Alternar para Nota Interna"
                  >
                    Nota
                  </button>

                  <button
                    type="button"
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Anexar arquivo"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowQuickReplies(!showQuickReplies)}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-semibold"
                    title="Respostas Rápidas"
                  >
                    ⚡
                  </button>

                  <input
                    type="text"
                    placeholder={
                      isInternalNote
                        ? 'Escreva um lembrete interno para a equipe...'
                        : activeConv.channel === 'email'
                        ? 'Escreva a resposta do e-mail...'
                        : 'Digite sua mensagem...'
                    }
                    value={inputMensagem}
                    onChange={(e) => setInputMensagem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className={`flex-1 border rounded-lg px-3.5 py-2 text-xs focus:outline-none ${
                      isInternalNote
                        ? 'bg-amber-50 border-amber-300 focus:ring-1 focus:ring-amber-500'
                        : 'bg-slate-50 border-slate-200 focus:ring-1 focus:ring-indigo-500'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    className={`p-2.5 rounded-lg text-white transition-all shadow-xs ${
                      isInternalNote
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : activeConv.channel === 'instagram'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90'
                        : activeConv.channel === 'facebook'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : activeConv.channel === 'email'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400 text-xs">
              Selecione uma conversa para iniciar o atendimento.
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* COLUNA 3: PAINEL DE INFORMAÇÕES DO CONTATO (320px) */}
        {/* ======================================================== */}
        {activeConv && (
          <div
            className={`w-full lg:w-80 bg-white border-l border-slate-200 flex flex-col flex-shrink-0 overflow-y-auto p-4 space-y-5 custom-scrollbar ${
              mobileView === 'info' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Header Mobile para Voltar ao Chat */}
            <div className="lg:hidden flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-bold text-xs text-slate-800">Informações do Contato</span>
              <button
                onClick={() => setMobileView('chat')}
                className="p-1 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Perfil Principal */}
            <div className="text-center pb-4 border-b border-slate-200">
              <div className="relative inline-block mb-2">
                <img
                  src={activeConv.avatar}
                  alt={activeConv.contactName}
                  className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-indigo-600 shadow-xs"
                />
                {(() => {
                  const badge = getChannelBadge(activeConv.channel);
                  const IconComp = badge.icon;
                  return (
                    <span
                      className={`absolute bottom-0 right-0 p-1 rounded-full text-white shadow-xs ${badge.bgClass}`}
                    >
                      <IconComp className="w-3 h-3" />
                    </span>
                  );
                })()}
              </div>

              <h3 className="font-bold text-slate-900 text-sm">{activeConv.contactName}</h3>

              {/* Detalhes de Canal específicos */}
              <div className="mt-1 space-y-0.5 text-xs text-slate-500 font-mono">
                {activeConv.channel === 'whatsapp' && activeConv.phone && (
                  <p className="flex items-center justify-center space-x-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{activeConv.phone}</span>
                  </p>
                )}

                {activeConv.channel === 'instagram' && activeConv.username && (
                  <p className="flex items-center justify-center space-x-1 text-pink-600 font-bold">
                    <Instagram className="w-3 h-3 text-pink-500" />
                    <span>{activeConv.username}</span>
                  </p>
                )}

                {activeConv.channel === 'facebook' && activeConv.facebookProfileUrl && (
                  <p className="flex items-center justify-center space-x-1 text-blue-600">
                    <Facebook className="w-3 h-3 text-blue-600" />
                    <span>{activeConv.facebookProfileUrl}</span>
                  </p>
                )}

                {activeConv.email && (
                  <p className="flex items-center justify-center space-x-1 text-slate-500">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate max-w-[200px]">{activeConv.email}</span>
                  </p>
                )}
              </div>

              {/* Status do Atendimento Dropdown */}
              <div className="mt-3 flex items-center justify-center space-x-2">
                <select
                  value={activeConv.status}
                  onChange={(e) => handleSetStatus(e.target.value as ConversationStatus)}
                  className="bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="em_atendimento">🟢 Em Atendimento</option>
                  <option value="aguardando">🟡 Aguardando</option>
                  <option value="finalizada">⚪ Finalizada</option>
                </select>
              </div>

              {/* Tags do Cliente */}
              <div className="flex items-center justify-center flex-wrap gap-1 mt-3">
                {activeConv.tags.map((t, i) => (
                  <span
                    key={i}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center space-x-1 ${t.color}`}
                  >
                    <span>{t.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t.name)}
                      className="hover:text-red-600 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Form Adicionar Tag */}
              <form onSubmit={handleAddTag} className="mt-2.5 flex items-center justify-center space-x-1">
                <input
                  type="text"
                  placeholder="Nova tag..."
                  value={novaTagNome}
                  onChange={(e) => setNovaTagNome(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-[11px] text-slate-800 w-28 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-slate-800 text-white rounded px-2 py-0.5 text-[11px] font-bold"
                >
                  +
                </button>
              </form>
            </div>

            {/* Widget Agendamento Rápido no Chat */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 space-y-3">
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
                <div className="p-2 bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] rounded-lg font-medium flex items-center space-x-1">
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
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:border-indigo-500"
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
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:border-indigo-500"
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
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Hora</label>
                    <input
                      type="time"
                      value={novoHorario}
                      onChange={(e) => setNovoHorario(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded-lg transition-colors text-xs flex items-center justify-center space-x-1 mt-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Confirmar Agendamento</span>
                </button>
              </form>
            </div>

            {/* Histórico de Agendamentos */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Agendamentos</span>
              </h4>

              {!activeConv.appointments || activeConv.appointments.length === 0 ? (
                <p className="text-slate-400 text-xs italic">Nenhum agendamento registrado.</p>
              ) : (
                <div className="space-y-1.5">
                  {activeConv.appointments.map((app) => (
                    <div
                      key={app.id}
                      className="p-2 border border-slate-200 rounded-lg bg-slate-50 text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{app.service}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                            app.status === 'confirmado'
                              ? 'bg-emerald-100 text-emerald-800'
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

            {/* Bloco de Notas Internas da Equipe */}
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Notas da Equipe</span>
              </h4>

              <form onSubmit={handleAddInternalNote} className="space-y-1.5">
                <textarea
                  placeholder="Adicionar nota sobre este cliente..."
                  value={novaNotaTexto}
                  onChange={(e) => setNovaNotaTexto(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors shadow-xs"
                >
                  Salvar Nota
                </button>
              </form>

              <div className="space-y-1.5 pt-2">
                {activeConv.internalNotes?.map((note) => (
                  <div key={note.id} className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] space-y-1">
                    <p className="text-amber-950 font-medium">{note.text}</p>
                    <div className="flex items-center justify-between text-[9px] text-amber-800 font-mono">
                      <span>👤 {note.author}</span>
                      <span>{note.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
