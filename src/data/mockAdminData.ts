import {
  AutomationFlow,
  Campaign,
  WhatsAppConversation,
  WhatsAppInstance,
} from '../types';

export const MOCK_INSTANCES: WhatsAppInstance[] = [
  {
    id: 'inst-1',
    name: 'Atendimento Matriz',
    phone: '+55 11 99999-8888',
    status: 'connected',
    batteryLevel: 94,
  },
  {
    id: 'inst-2',
    name: 'Suporte Técnico',
    phone: '+55 11 97777-6666',
    status: 'connected',
    batteryLevel: 82,
  },
  {
    id: 'inst-3',
    name: 'Vendas & Reservas',
    phone: '+55 21 98888-5555',
    status: 'qr_code',
  },
];

export const MOCK_CONVERSATIONS: WhatsAppConversation[] = [
  // ==========================================
  // WHATSAPP (10 Conversas)
  // ==========================================
  {
    id: 'conv-wa-1',
    channel: 'whatsapp',
    instanceId: 'inst-1',
    contactName: 'Carlos Eduardo',
    phone: '+55 11 98888-1234',
    email: 'carlos.eduardo@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    unreadCount: 2,
    status: 'em_atendimento',
    assignedAgent: 'Diego Armond',
    tags: [
      { name: 'VIP', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      { name: 'Agendado', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    ],
    lastMessage: 'Perfeito, fico no aguardo da confirmação!',
    lastMessageTime: '10:42',
    messages: [
      { id: 'm1', sender: 'contact', text: 'Olá! Gostaria de agendar um horário para amanhã.', timestamp: '10:38' },
      { id: 'm2', sender: 'agent', text: 'Com certeza, Carlos! Temos horário disponível às 14h ou às 16h com o Profissional Diego.', timestamp: '10:40', status: 'read' },
      { id: 'm3', sender: 'note', text: 'Nota Interna: Cliente prefere atendimento no período da tarde.', timestamp: '10:41' },
      { id: 'm4', sender: 'contact', text: 'Perfeito, fico no aguardo da confirmação!', timestamp: '10:42' },
      {
        id: 'm5',
        sender: 'system',
        text: 'Agendamento pré-confirmado para 21/08/2026 às 14:00 - Serviço: Consultoria & Avaliação.',
        timestamp: '10:43',
        appointmentInfo: { service: 'Consultoria & Avaliação', date: '2026-08-21', time: '14:00', professional: 'Diego Armond' },
      },
    ],
    appointments: [
      { id: 'app-1', service: 'Consultoria & Avaliação', professional: 'Diego Armond', date: '2026-08-21', time: '14:00', status: 'confirmado', price: 150.0 },
    ],
    internalNotes: [
      { id: 'note-1', author: 'Fernanda Lima', text: 'Cliente sempre pontual. Prefere contato via WhatsApp.', date: '2026-08-10 11:20' },
    ],
  },
  {
    id: 'conv-wa-2',
    channel: 'whatsapp',
    instanceId: 'inst-1',
    contactName: 'Mariana Silva',
    phone: '+55 21 97654-3210',
    email: 'mariana.silva@outlook.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    unreadCount: 0,
    status: 'aguardando',
    tags: [
      { name: 'Novo Cliente', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    ],
    lastMessage: 'Qual é o valor do pacote completo de produtos?',
    lastMessageTime: 'Ontem',
    messages: [
      { id: 'm10', sender: 'contact', text: 'Boa tarde! Qual é o valor do pacote completo de produtos?', timestamp: 'Ontem 16:15' },
      { id: 'm11', sender: 'agent', text: 'Olá Mariana! Nosso pacote promocional está R$ 299,00.', timestamp: 'Ontem 16:20', status: 'read' },
    ],
    appointments: [],
    internalNotes: [],
  },
  {
    id: 'conv-wa-3',
    channel: 'whatsapp',
    instanceId: 'inst-1',
    contactName: 'Roberto Alves',
    phone: '+55 11 91122-3344',
    email: 'roberto@empresa.com.br',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    unreadCount: 1,
    status: 'online',
    tags: [
      { name: 'Retorno', color: 'bg-amber-100 text-amber-800 border-amber-200' },
      { name: 'Orçamento', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    ],
    lastMessage: 'Enviei o comprovante do PIX.',
    lastMessageTime: '09:15',
    messages: [
      { id: 'm20', sender: 'agent', text: 'Bom dia Roberto! Tudo certo com a proposta?', timestamp: '09:00', status: 'read' },
      { id: 'm21', sender: 'contact', text: 'Enviei o comprovante do PIX.', timestamp: '09:15' },
    ],
    appointments: [
      { id: 'app-2', service: 'Instalação de Equipamento', professional: 'Marcos Viana', date: '2026-08-25', time: '09:00', status: 'pendente', price: 350.0 },
    ],
    internalNotes: [
      { id: 'note-2', author: 'Diego Armond', text: 'Verificar emissão de nota fiscal assim que o PIX for compensado.', date: '2026-08-20 09:18' },
    ],
  },
  {
    id: 'conv-wa-4',
    channel: 'whatsapp',
    instanceId: 'inst-2',
    contactName: 'Juliana Paes',
    phone: '+55 31 99876-5432',
    email: 'juliana.paes@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    unreadCount: 0,
    status: 'finalizada',
    tags: [
      { name: 'Suporte', color: 'bg-rose-100 text-rose-800 border-rose-200' },
    ],
    lastMessage: 'Muito obrigada pelo atendimento!',
    lastMessageTime: '18/08',
    messages: [
      { id: 'm30', sender: 'contact', text: 'Muito obrigada pelo atendimento!', timestamp: '18/08 17:40' },
    ],
    appointments: [],
    internalNotes: [],
  },
  {
    id: 'conv-wa-5',
    channel: 'whatsapp',
    instanceId: 'inst-2',
    contactName: 'Lucas Fernandes',
    phone: '+55 11 97711-2233',
    email: 'lucas.fernandes@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    unreadCount: 0,
    status: 'em_atendimento',
    assignedAgent: 'Diego Armond',
    tags: [
      { name: 'Cliente', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    ],
    lastMessage: 'Vou querer 2 camisas tamanho G.',
    lastMessageTime: '11:05',
    messages: [
      { id: 'm35', sender: 'contact', text: 'Olá! Vocês têm desconto na compra de 2 unidades?', timestamp: '11:00' },
      { id: 'm36', sender: 'agent', text: 'Olá Lucas! Sim, temos 10% de desconto adicional via PIX!', timestamp: '11:03', status: 'read' },
      { id: 'm37', sender: 'contact', text: 'Vou querer 2 camisas tamanho G.', timestamp: '11:05' },
    ],
  },
  {
    id: 'conv-wa-6',
    channel: 'whatsapp',
    instanceId: 'inst-1',
    contactName: 'Camila Rocha',
    phone: '+55 41 98844-5566',
    email: 'camila.rocha@hotmail.com',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    unreadCount: 3,
    status: 'aguardando',
    tags: [
      { name: 'Dúvida Frete', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    ],
    lastMessage: 'Qual o valor do frete para Curitiba?',
    lastMessageTime: '10:20',
    messages: [
      { id: 'm40', sender: 'contact', text: 'Oi, bom dia!', timestamp: '10:18' },
      { id: 'm41', sender: 'contact', text: 'Gostei da chuteira Pentagol Pro', timestamp: '10:19' },
      { id: 'm42', sender: 'contact', text: 'Qual o valor do frete para Curitiba?', timestamp: '10:20' },
    ],
  },
  {
    id: 'conv-wa-7',
    channel: 'whatsapp',
    instanceId: 'inst-1',
    contactName: 'Gabriel Costa',
    phone: '+55 19 99223-4455',
    email: 'gabriel.costa@tech.com',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    unreadCount: 0,
    status: 'online',
    assignedAgent: 'Fernanda Lima',
    tags: [
      { name: 'Troca', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    ],
    lastMessage: 'Código de postagem gerado com sucesso.',
    lastMessageTime: '08:50',
    messages: [
      { id: 'm50', sender: 'contact', text: 'Preciso trocar o tamanho do calção.', timestamp: '08:30' },
      { id: 'm51', sender: 'agent', text: 'Sem problemas, Gabriel! Código de postagem gerado com sucesso.', timestamp: '08:50', status: 'read' },
    ],
  },
  {
    id: 'conv-wa-8',
    channel: 'whatsapp',
    instanceId: 'inst-3',
    contactName: 'Patrícia Mendes',
    phone: '+55 21 98112-9900',
    email: 'patricia.mendes@yahoo.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    unreadCount: 0,
    status: 'finalizada',
    tags: [
      { name: 'Concluído', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    ],
    lastMessage: 'Obrigada, atendimento excelente!',
    lastMessageTime: 'Ontem',
    messages: [
      { id: 'm60', sender: 'contact', text: 'Obrigada, atendimento excelente!', timestamp: 'Ontem 14:20' },
    ],
  },
  {
    id: 'conv-wa-9',
    channel: 'whatsapp',
    instanceId: 'inst-1',
    contactName: 'Felipe Martins',
    phone: '+55 11 96655-4433',
    email: 'felipe.martins@bol.com.br',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    unreadCount: 1,
    status: 'em_atendimento',
    assignedAgent: 'Diego Armond',
    tags: [
      { name: 'Urgente', color: 'bg-red-100 text-red-800 border-red-200' },
    ],
    lastMessage: 'Vocês conseguem despachar ainda hoje?',
    lastMessageTime: '11:12',
    messages: [
      { id: 'm70', sender: 'contact', text: 'Fiz o pedido #1102 via SEDEX.', timestamp: '11:10' },
      { id: 'm71', sender: 'contact', text: 'Vocês conseguem despachar ainda hoje?', timestamp: '11:12' },
    ],
  },
  {
    id: 'conv-wa-10',
    channel: 'whatsapp',
    instanceId: 'inst-2',
    contactName: 'Beatriz Lima',
    phone: '+55 81 99776-6554',
    email: 'bia.lima@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
    unreadCount: 0,
    status: 'aguardando',
    tags: [
      { name: 'Interessado', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    ],
    lastMessage: 'Vou verificar as medidas e aviso vocês.',
    lastMessageTime: '19/08',
    messages: [
      { id: 'm80', sender: 'contact', text: 'Vou verificar as medidas e aviso vocês.', timestamp: '19/08 15:10' },
    ],
  },

  // ==========================================
  // INSTAGRAM (8 Conversas)
  // ==========================================
  {
    id: 'conv-ig-1',
    channel: 'instagram',
    contactName: 'Ana Souza',
    username: '@anasouza_fit',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    unreadCount: 1,
    status: 'em_atendimento',
    assignedAgent: 'Diego Armond',
    tags: [
      { name: 'Instagram DM', color: 'bg-pink-100 text-pink-800 border-pink-200' },
      { name: 'Interessado', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    ],
    lastMessage: 'Gostaria de saber se tem a camisa M no estoque...',
    lastMessageTime: '2 min',
    messages: [
      { id: 'ig-m1', sender: 'contact', text: 'Olá! Vi o post de vocês sobre a nova camisa oficial.', timestamp: '10:40' },
      { id: 'ig-m2', sender: 'contact', text: 'Gostaria de saber se tem a camisa M no estoque e se vocês entregam em SP.', timestamp: '10:42' },
    ],
    internalNotes: [
      { id: 'ig-note-1', author: 'Diego Armond', text: 'Viu o anúncio do Instagram Reels.', date: '2026-08-20 10:43' },
    ],
  },
  {
    id: 'conv-ig-2',
    channel: 'instagram',
    contactName: 'Marcos Vinícius',
    username: '@marcos_vini',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    unreadCount: 2,
    status: 'aguardando',
    tags: [
      { name: 'Instagram DM', color: 'bg-pink-100 text-pink-800 border-pink-200' },
      { name: 'Dúvida Frete', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    ],
    lastMessage: 'Qual é o prazo de entrega para o Rio de Janeiro?',
    lastMessageTime: '15 min',
    messages: [
      { id: 'ig-m3', sender: 'contact', text: 'Boa tarde! Qual é o prazo de entrega para o Rio de Janeiro?', timestamp: '10:30' },
      { id: 'ig-m4', sender: 'contact', text: 'Tem cupom de primeira compra disponível?', timestamp: '10:32' },
    ],
  },
  {
    id: 'conv-ig-3',
    channel: 'instagram',
    contactName: 'Larissa Manoela',
    username: '@larimanoela_oficial',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    unreadCount: 0,
    status: 'em_atendimento',
    assignedAgent: 'Fernanda Lima',
    tags: [
      { name: 'Influenciador', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      { name: 'VIP', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    ],
    lastMessage: 'Adorei os produtos! Como faço para parceria?',
    lastMessageTime: '1 h',
    messages: [
      { id: 'ig-m5', sender: 'contact', text: 'Olá equipe Pentagol! Adorei os produtos! Como faço para parceria de divulgação?', timestamp: '09:45' },
      { id: 'ig-m6', sender: 'agent', text: 'Olá Larissa! Que incrível seu interesse! Vou encaminhar para nosso setor de marketing.', timestamp: '09:50', status: 'read' },
    ],
  },
  {
    id: 'conv-ig-4',
    channel: 'instagram',
    contactName: 'Thiago Silva',
    username: '@thiago.silva',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    unreadCount: 0,
    status: 'finalizada',
    tags: [
      { name: 'Cliente Satifeito', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    ],
    lastMessage: 'Obrigado! O pedido chegou certinho.',
    lastMessageTime: 'Ontem',
    messages: [
      { id: 'ig-m7', sender: 'contact', text: 'Obrigado! O pedido chegou certinho. Qualidade impressionante!', timestamp: 'Ontem 17:20' },
    ],
  },
  {
    id: 'conv-ig-5',
    channel: 'instagram',
    contactName: 'Fernanda Vasconcellos',
    username: '@fe_vasconcellos',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    unreadCount: 1,
    status: 'aguardando',
    tags: [
      { name: 'Dúvida Produto', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    ],
    lastMessage: 'Qual é a composição do tecido da camisa dry-fit?',
    lastMessageTime: '2 h',
    messages: [
      { id: 'ig-m8', sender: 'contact', text: 'Qual é a composição do tecido da camisa dry-fit? É 100% poliéster?', timestamp: '08:40' },
    ],
  },
  {
    id: 'conv-ig-6',
    channel: 'instagram',
    contactName: 'Diego Santos',
    username: '@diegosantos_br',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    unreadCount: 0,
    status: 'em_atendimento',
    assignedAgent: 'Diego Armond',
    tags: [
      { name: 'Orçamento', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    ],
    lastMessage: 'Qual o prazo de envio no frete expresso?',
    lastMessageTime: '3 h',
    messages: [
      { id: 'ig-m9', sender: 'contact', text: 'Qual o prazo de envio no frete expresso para Belo Horizonte?', timestamp: '07:30' },
      { id: 'ig-m10', sender: 'agent', text: 'Bom dia Diego! Pelo Sedex/Expresso leva de 1 a 2 dias úteis.', timestamp: '07:35', status: 'read' },
    ],
  },
  {
    id: 'conv-ig-7',
    channel: 'instagram',
    contactName: 'Vanessa Camargo',
    username: '@vanessac',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    unreadCount: 0,
    status: 'finalizada',
    tags: [
      { name: 'Concluído', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    ],
    lastMessage: 'Já recebi meu código de rastreio, valeu!',
    lastMessageTime: '19/08',
    messages: [
      { id: 'ig-m11', sender: 'contact', text: 'Já recebi meu código de rastreio, valeu!', timestamp: '19/08 16:00' },
    ],
  },
  {
    id: 'conv-ig-8',
    channel: 'instagram',
    contactName: 'Rodrigo Faro',
    username: '@rodrigofaro',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    unreadCount: 0,
    status: 'aguardando',
    tags: [
      { name: 'Interessado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    ],
    lastMessage: 'Vocês vendem conjunto completo de agasalho?',
    lastMessageTime: '18/08',
    messages: [
      { id: 'ig-m12', sender: 'contact', text: 'Vocês vendem conjunto completo de agasalho esportivo?', timestamp: '18/08 19:30' },
    ],
  },

  // ==========================================
  // FACEBOOK MESSENGER (6 Conversas)
  // ==========================================
  {
    id: 'conv-fb-1',
    channel: 'facebook',
    contactName: 'Empresa XYZ',
    facebookProfileUrl: 'facebook.com/empresaxyz',
    avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150',
    unreadCount: 1,
    status: 'em_atendimento',
    assignedAgent: 'Diego Armond',
    tags: [
      { name: 'B2B Atacado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      { name: 'Orçamento', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    ],
    lastMessage: 'Olá, temos interesse em conhecer as opções de atacado...',
    lastMessageTime: 'Ontem',
    messages: [
      { id: 'fb-m1', sender: 'contact', text: 'Olá, temos interesse em conhecer as opções de atacado para nossa rede de lojas de esporte.', timestamp: 'Ontem 14:00' },
      { id: 'fb-m2', sender: 'agent', text: 'Olá! Excelente! Oferecemos condições faturadas para compras acima de 50 unidades.', timestamp: 'Ontem 14:15', status: 'read' },
      { id: 'fb-m3', sender: 'contact', text: 'Pode nos enviar a tabela de preços via e-mail?', timestamp: 'Ontem 14:30' },
    ],
    internalNotes: [
      { id: 'fb-note-1', author: 'Diego Armond', text: 'Rede com 5 lojas no interior de SP. Potencial alto.', date: '2026-08-19 14:35' },
    ],
  },
  {
    id: 'conv-fb-2',
    channel: 'facebook',
    contactName: 'Claudio Nogueira',
    facebookProfileUrl: 'facebook.com/claudio.nogueira',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    unreadCount: 2,
    status: 'aguardando',
    tags: [
      { name: 'Loja Física', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    ],
    lastMessage: 'Qual o horário de funcionamento da loja física aos sábados?',
    lastMessageTime: '10:10',
    messages: [
      { id: 'fb-m4', sender: 'contact', text: 'Bom dia! Gostaria de passar aí hoje.', timestamp: '10:05' },
      { id: 'fb-m5', sender: 'contact', text: 'Qual o horário de funcionamento da loja física aos sábados?', timestamp: '10:10' },
    ],
  },
  {
    id: 'conv-fb-3',
    channel: 'facebook',
    contactName: 'Renata Silveira',
    facebookProfileUrl: 'facebook.com/renata.silveira',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
    unreadCount: 0,
    status: 'em_atendimento',
    assignedAgent: 'Fernanda Lima',
    tags: [
      { name: 'Personalizado', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    ],
    lastMessage: 'Gostaria de fazer orçamento de 20 camisas...',
    lastMessageTime: '1 h',
    messages: [
      { id: 'fb-m6', sender: 'contact', text: 'Gostaria de fazer orçamento de 20 camisas personalizadas para o time da faculdade.', timestamp: '09:20' },
      { id: 'fb-m7', sender: 'agent', text: 'Olá Renata! Com certeza. Qual o modelo e as cores do time?', timestamp: '09:30', status: 'read' },
    ],
  },
  {
    id: 'conv-fb-4',
    channel: 'facebook',
    contactName: 'Marcelo Ribeiro',
    facebookProfileUrl: 'facebook.com/marcelo.ribeiro',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    unreadCount: 0,
    status: 'finalizada',
    tags: [
      { name: 'Troca', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    ],
    lastMessage: 'Tudo certo com a troca. Agradeço a atenção!',
    lastMessageTime: '17/08',
    messages: [
      { id: 'fb-m8', sender: 'contact', text: 'Tudo certo com a troca. Agradeço a atenção!', timestamp: '17/08 18:10' },
    ],
  },
  {
    id: 'conv-fb-5',
    channel: 'facebook',
    contactName: 'Carla Dias',
    facebookProfileUrl: 'facebook.com/carla.dias',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    unreadCount: 1,
    status: 'aguardando',
    tags: [
      { name: 'Pagamento', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    ],
    lastMessage: 'Vocês aceitam cartão de crédito corporativo?',
    lastMessageTime: '09:50',
    messages: [
      { id: 'fb-m9', sender: 'contact', text: 'Vocês aceitam cartão de crédito corporativo com parcelamento em até 6x?', timestamp: '09:50' },
    ],
  },
  {
    id: 'conv-fb-6',
    channel: 'facebook',
    contactName: 'Bruno Gagliasso',
    facebookProfileUrl: 'facebook.com/bruno.gagliasso',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    unreadCount: 0,
    status: 'finalizada',
    tags: [
      { name: 'Concluído', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    ],
    lastMessage: 'Obrigado pelas informações!',
    lastMessageTime: '16/08',
    messages: [
      { id: 'fb-m10', sender: 'contact', text: 'Obrigado pelas informações!', timestamp: '16/08 11:30' },
    ],
  },

  // ==========================================
  // E-MAIL (8 Conversas)
  // ==========================================
  {
    id: 'conv-em-1',
    channel: 'email',
    contactName: 'Mariana Costa',
    email: 'contato@mariana.com.br',
    emailSubject: 'Enviei os documentos solicitados - Pedido #1092',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    unreadCount: 1,
    status: 'aguardando',
    tags: [
      { name: 'Documentação', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      { name: 'Liberado', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    ],
    lastMessage: 'Enviei os documentos solicitados para liberação do pedido...',
    lastMessageTime: '1 h',
    messages: [
      {
        id: 'em-m1',
        sender: 'contact',
        emailSubject: 'Enviei os documentos solicitados - Pedido #1092',
        emailFrom: 'contato@mariana.com.br',
        emailTo: 'atendimento@pentagol.com.br',
        text: `Olá equipe Pentagol,

Conforme solicitado no atendimento anterior, estou enviando a cópia do comprovante de pagamento e do documento de identidade para liberação do pedido #1092.

Fico no aguardo da confirmação de envio e da emissão da Nota Fiscal.

Atenciosamente,
Mariana Costa`,
        timestamp: '09:20',
      },
    ],
    internalNotes: [
      { id: 'em-note-1', author: 'Diego Armond', text: 'Documentos conferidos no ERP SupraSoft. Pedido liberado para faturamento.', date: '2026-08-20 09:30' },
    ],
  },
  {
    id: 'conv-em-2',
    channel: 'email',
    contactName: 'João Silva',
    email: 'joao.silva@techcorp.com',
    emailSubject: 'Dúvida sobre prazo de entrega do Pedido #1024',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    unreadCount: 0,
    status: 'em_atendimento',
    assignedAgent: 'Diego Armond',
    tags: [
      { name: 'Suporte Pedido', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    ],
    lastMessage: 'Prezados, Gostaria de saber qual é o prazo de entrega...',
    lastMessageTime: '3 h',
    messages: [
      {
        id: 'em-m2',
        sender: 'contact',
        emailSubject: 'Dúvida sobre prazo de entrega do Pedido #1024',
        emailFrom: 'joao.silva@techcorp.com',
        emailTo: 'atendimento@pentagol.com.br',
        text: `Prezados,

Gostaria de saber qual é o prazo de entrega do meu pedido #1024 realizado no dia 15/08.

O status no site consta como 'Em Separação', mas o prazo estimado era até hoje.

Atenciosamente,
João Silva`,
        timestamp: '07:15',
      },
      {
        id: 'em-m3',
        sender: 'agent',
        emailSubject: 'Re: Dúvida sobre prazo de entrega do Pedido #1024',
        emailFrom: 'atendimento@pentagol.com.br',
        emailTo: 'joao.silva@techcorp.com',
        text: `Olá João, bom dia!

Seu pedido #1024 foi despachado via Correios SEDEX sob o código de rastreamento AA123456789BR.

A previsão de entrega é para amanhã até às 18:00.

Qualquer dúvida estamos à disposição!

Atenciosamente,
Diego Armond - Equipe Pentagol`,
        timestamp: '07:40',
        status: 'read',
      },
    ],
  },
  {
    id: 'conv-em-3',
    channel: 'email',
    contactName: 'Suporte Corporativo Alpha',
    email: 'compras@alphatech.com.br',
    emailSubject: 'Solicitação de Orçamento B2B - 100 Unidades',
    avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150',
    unreadCount: 2,
    status: 'em_atendimento',
    assignedAgent: 'Diego Armond',
    tags: [
      { name: 'Orçamento B2B', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      { name: 'Urgente', color: 'bg-red-100 text-red-800 border-red-200' },
    ],
    lastMessage: 'Qual seria o prazo de produção e condições de faturamento?',
    lastMessageTime: '08:30',
    messages: [
      {
        id: 'em-m4',
        sender: 'contact',
        emailSubject: 'Solicitação de Orçamento B2B - 100 Unidades',
        emailFrom: 'compras@alphatech.com.br',
        emailTo: 'atendimento@pentagol.com.br',
        text: `Bom dia,

Somos do setor de compras da Alpha Tech e gostaríamos de solicitar uma cotação para 100 unidades da Camisa Polo Oficial Pentagol personalizada com nosso logo bordado no peito.

Qual seria o prazo de produção e condições de faturamento para 30 dias via boleto bancário?

Cordiais saudações,
Ricardo Mendes - Depto de Compras`,
        timestamp: '08:30',
      },
    ],
  },
  {
    id: 'conv-em-4',
    channel: 'email',
    contactName: 'Beatriz Rezende',
    email: 'bia.rezende@gmail.com',
    emailSubject: 'Solicitação de Troca de Tamanho - Pedido #1080',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    unreadCount: 0,
    status: 'finalizada',
    tags: [
      { name: 'Troca Concluída', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    ],
    lastMessage: 'Muito obrigada! Já postei a devolução nos Correios.',
    lastMessageTime: '17/08',
    messages: [
      {
        id: 'em-m5',
        sender: 'contact',
        emailSubject: 'Solicitação de Troca de Tamanho - Pedido #1080',
        emailFrom: 'bia.rezende@gmail.com',
        emailTo: 'atendimento@pentagol.com.br',
        text: `Olá,

Recebi o produto ontem, porém o tamanho G ficou um pouco largo. Gostaria de efetuar a troca pelo tamanho M.

Como devo proceder para a postagem de devolução?

Obrigada,
Beatriz`,
        timestamp: '17/08 10:00',
      },
      {
        id: 'em-m6',
        sender: 'agent',
        emailSubject: 'Re: Solicitação de Troca de Tamanho - Pedido #1080',
        emailFrom: 'atendimento@pentagol.com.br',
        emailTo: 'bia.rezende@gmail.com',
        text: `Olá Beatriz!

Enviamos em anexo a autorização de postagem gratuita nos Correios. Basta levar o produto em qualquer agência.

Atenciosamente,
Suporte Pentagol`,
        timestamp: '17/08 11:30',
        status: 'read',
      },
    ],
  },
  {
    id: 'conv-em-5',
    channel: 'email',
    contactName: 'Financeiro SupraSoft',
    email: 'financeiro@suprasoft.com.br',
    emailSubject: 'Comprovante de Transferência PIX - Pedido #1105',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    unreadCount: 1,
    status: 'aguardando',
    tags: [
      { name: 'ERP Sync', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    ],
    lastMessage: 'Anexamos o comprovante de pagamento via PIX no valor de R$ 450...',
    lastMessageTime: '09:05',
    messages: [
      {
        id: 'em-m7',
        sender: 'contact',
        emailSubject: 'Comprovante de Transferência PIX - Pedido #1105',
        emailFrom: 'financeiro@suprasoft.com.br',
        emailTo: 'atendimento@pentagol.com.br',
        text: `Prezados,

Anexamos o comprovante de pagamento via PIX no valor de R$ 450,00 referente ao pedido #1105.

Solicitamos a emissão da NF-e e envio do código de rastreamento.

Atenciosamente,
Dep. Financeiro SupraSoft`,
        timestamp: '09:05',
      },
    ],
  },
  {
    id: 'conv-em-6',
    channel: 'email',
    contactName: 'Gustavo Lima',
    email: 'gustavo@sertanejo.com',
    emailSubject: 'Agradecimento pelo atendimento rápido',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    unreadCount: 0,
    status: 'finalizada',
    tags: [
      { name: 'Elogio', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    ],
    lastMessage: 'Gostaria de parabenizar toda a equipe pelo suporte...',
    lastMessageTime: '16/08',
    messages: [
      {
        id: 'em-m8',
        sender: 'contact',
        emailSubject: 'Agradecimento pelo atendimento rápido',
        emailFrom: 'gustavo@sertanejo.com',
        emailTo: 'atendimento@pentagol.com.br',
        text: `Equipe Pentagol,

Gostaria de parabenizar toda a equipe pelo suporte ágil no envio das camisas para nosso evento.

Chegou tudo em perfeito estado e no prazo recorde!

Abraços,
Gustavo`,
        timestamp: '16/08 14:00',
      },
    ],
  },
  {
    id: 'conv-em-7',
    channel: 'email',
    contactName: 'Patricia Poeta',
    email: 'patricia.poeta@tvmedia.com',
    emailSubject: 'Disponibilidade de estoque para uniforme esportivo',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    unreadCount: 0,
    status: 'em_atendimento',
    assignedAgent: 'Fernanda Lima',
    tags: [
      { name: 'Mídia / TV', color: 'bg-rose-100 text-rose-800 border-rose-200' },
    ],
    lastMessage: 'Precisamos de 15 conjuntos completos para uniforme...',
    lastMessageTime: '4 h',
    messages: [
      {
        id: 'em-m9',
        sender: 'contact',
        emailSubject: 'Disponibilidade de estoque para uniforme esportivo',
        emailFrom: 'patricia.poeta@tvmedia.com',
        emailTo: 'atendimento@pentagol.com.br',
        text: `Olá,

Precisamos de 15 conjuntos completos para uniforme de reportagem esportiva.

Vocês teriam a cor Azul Marinho no estoque imediato?

Att,
Patricia Poeta`,
        timestamp: '06:30',
      },
    ],
  },
  {
    id: 'conv-em-8',
    channel: 'email',
    contactName: 'Carlos Alberto',
    email: 'carlos.alberto@advocacia.com.br',
    emailSubject: 'Dúvida sobre Política de Garantia e Devolução',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    unreadCount: 0,
    status: 'aguardando',
    tags: [
      { name: 'Jurídico', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    ],
    lastMessage: 'Gostaria de entender melhor como funciona a garantia...',
    lastMessageTime: '15/08',
    messages: [
      {
        id: 'em-m10',
        sender: 'contact',
        emailSubject: 'Dúvida sobre Política de Garantia e Devolução',
        emailFrom: 'carlos.alberto@advocacia.com.br',
        emailTo: 'atendimento@pentagol.com.br',
        text: `Prezados,

Gostaria de entender melhor como funciona a garantia dos produtos em caso de defeito de fabricação após 30 dias de uso.

Agradeço desde já os esclarecimentos.

Atenciosamente,
Carlos Alberto`,
        timestamp: '15/08 16:45',
      },
    ],
  },
];

export const MOCK_FLOWS: AutomationFlow[] = [
  {
    id: 'flow-1',
    name: 'Boas-vindas & Agendamento Automático',
    description: 'Atende clientes novos, envia opções de horário e confirma pelo WhatsApp.',
    trigger: 'Primeira Mensagem ou "#agendar"',
    status: 'active',
    instanceName: 'Atendimento Matriz',
    executionsCount: 1420,
    completionRate: 94,
    updatedAt: '2026-08-19',
    nodes: [
      {
        id: 'node-start',
        type: 'start',
        title: 'Gatilho Inicial',
        content: 'Quando receber primeira mensagem ou hashtag #agendar',
        position: { x: 50, y: 120 },
      },
      {
        id: 'node-welcome',
        type: 'text',
        title: 'Mensagem de Boas-Vindas',
        content: 'Olá! Seja bem-vindo à nossa central. Como podemos te ajudar hoje?',
        position: { x: 320, y: 120 },
      },
      {
        id: 'node-menu',
        type: 'menu',
        title: 'Menu de Opções',
        content: 'Escolha uma das opções abaixo:',
        position: { x: 600, y: 120 },
        options: [
          { id: 'opt-1', label: '1. Agendar Horário', nextNodeId: 'node-schedule' },
          { id: 'opt-2', label: '2. Falar com Atendente', nextNodeId: 'node-transfer' },
          { id: 'opt-3', label: '3. Ver Preços & Serviços', nextNodeId: 'node-prices' },
        ],
      },
      {
        id: 'node-schedule',
        type: 'action',
        title: 'Criar Agendamento',
        content: 'Abre widget de busca de horários disponíveis no banco.',
        position: { x: 900, y: 50 },
        actionConfig: { actionType: 'Criar Agendamento', targetValue: 'Serviço Padrão' },
      },
      {
        id: 'node-transfer',
        type: 'action',
        title: 'Transferir para Atendente',
        content: 'Atribui tag #AguardandoAtendimento e notifica a equipe.',
        position: { x: 900, y: 220 },
        actionConfig: { actionType: 'Transferir para Humano', targetValue: 'Fila Geral' },
      },
    ],
  },
  {
    id: 'flow-2',
    name: 'Pesquisa de Satisfação NPS',
    description: 'Envia mensagem automática 2 horas após a conclusão do agendamento.',
    trigger: 'Status Agendamento = Concluído',
    status: 'active',
    instanceName: 'Atendimento Matriz',
    executionsCount: 580,
    completionRate: 88,
    updatedAt: '2026-08-18',
  },
  {
    id: 'flow-3',
    name: 'Lembrete Pré-Consulta (24h antes)',
    description: 'Envia confirmação de presença com botões de Sim/Não.',
    trigger: 'Cronômetro: 24h antes do horário',
    status: 'active',
    instanceName: 'Suporte Técnico',
    executionsCount: 890,
    completionRate: 98,
    updatedAt: '2026-08-15',
  },
  {
    id: 'flow-4',
    name: 'Recuperação de Clientes Sumidos (60 dias)',
    description: 'Dispara cupom de desconto exclusivo para reengajamento.',
    trigger: 'Sem atendimento > 60 dias',
    status: 'inactive',
    instanceName: 'Atendimento Matriz',
    executionsCount: 210,
    completionRate: 75,
    updatedAt: '2026-08-01',
  },
];

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Promoção Dia dos Pais - Clientes VIP',
    instanceName: 'Atendimento Matriz',
    targetTag: 'VIP',
    scheduledFor: '2026-08-22 10:00',
    sentCount: 450,
    totalCount: 500,
    deliveredCount: 442,
    readCount: 395,
    failedCount: 8,
    status: 'running',
    messageTemplate:
      'Olá {nome}! Preparámos um presente especial para si este mês. Agende o seu horário com 20% de desconto usando o cupom PAIS20!',
    delaySeconds: 15,
  },
  {
    id: 'camp-2',
    name: 'Lembrete de Retorno Mensal',
    instanceName: 'Atendimento Matriz',
    targetTag: 'Retorno',
    scheduledFor: '2026-08-01 09:00',
    sentCount: 230,
    totalCount: 230,
    deliveredCount: 228,
    readCount: 210,
    failedCount: 2,
    status: 'completed',
    messageTemplate:
      'Olá {nome}, tudo bem? Já faz 30 dias desde o seu último atendimento. Vamos agendar a sua revisão?',
    delaySeconds: 20,
  },
  {
    id: 'camp-3',
    name: 'Divulgação de Novo Serviço de Estética',
    instanceName: 'Vendas & Reservas',
    targetTag: 'Novo Cliente',
    scheduledFor: '2026-08-28 14:30',
    sentCount: 0,
    totalCount: 1200,
    deliveredCount: 0,
    readCount: 0,
    failedCount: 0,
    status: 'scheduled',
    messageTemplate:
      'Confira as novidades exclusivas que preparamos para você neste mês!',
    delaySeconds: 10,
  },
  {
    id: 'camp-4',
    name: 'Pesquisa de Mercado - Base Geral',
    instanceName: 'Suporte Técnico',
    targetTag: 'Geral',
    scheduledFor: '2026-08-10 11:00',
    sentCount: 150,
    totalCount: 800,
    deliveredCount: 140,
    readCount: 90,
    failedCount: 10,
    status: 'paused',
    messageTemplate: 'Sua opinião é fundamental para nós! Responda nossa pesquisa rápida.',
    delaySeconds: 30,
  },
];
