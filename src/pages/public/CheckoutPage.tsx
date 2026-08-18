import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit2,
  Lock,
  LogIn,
  QrCode,
  RefreshCw,
  Settings,
  Tag,
  Truck,
  User,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { getConfigLoja, upsert } from '../../lib/db';
import {
  cpfExisteNoDb,
  emailExisteNoDb,
  mascararCPF,
  mascararTelefone,
  validarCPF,
  validarEmail,
  validarNomeCompleto,
} from '../../lib/validation';
import { cepService, freteService, pixService } from '../../services';
import {
  FreteDevScenario,
  getFreteDevScenario,
  setFreteDevScenario,
} from '../../services/freteService';
import { Endereco, Frete, Pedido } from '../../types';
import { PixPaymentWidget } from '../../components/PixPaymentWidget';

const CHECKOUT_DRAFT_KEY = 'pentagol_checkout_draft';

export const CheckoutPage: React.FC = () => {
  const { cliente, logado, login, cadastrar } = useAuth();
  const {
    itens,
    subtotal,
    desconto,
    cupom,
    frete,
    total,
    aplicarCupom,
    removerCupom,
    selecionarFrete,
    limparCarrinho,
  } = useCart();
  const navigate = useNavigate();

  // Load initial draft from localStorage
  const savedDraftRaw = localStorage.getItem(CHECKOUT_DRAFT_KEY);
  const savedDraft = savedDraftRaw ? JSON.parse(savedDraftRaw) : {};

  // Input Refs for automatic focus
  const numeroInputRef = useRef<HTMLInputElement>(null);
  const primeiroErroRef = useRef<HTMLInputElement>(null);

  // SECTION 1: IDENTIFICATION STATE
  const [secao1Expandida, setSecao1Expandida] = useState<boolean>(!logado && !savedDraft.identificacaoConcluida);
  const [modoAuthInline, setModoAuthInline] = useState<'login' | 'cadastro' | 'visitante'>('visitante');

  // Visitor identification fields
  const [nomeCompleto, setNomeCompleto] = useState<string>(cliente?.nomeCompleto || savedDraft.nomeCompleto || '');
  const [email, setEmail] = useState<string>(cliente?.email || savedDraft.email || '');
  const [cpf, setCpf] = useState<string>(cliente?.cpf ? mascararCPF(cliente.cpf) : savedDraft.cpf || '');
  const [telefone, setTelefone] = useState<string>(cliente?.telefone ? mascararTelefone(cliente.telefone) : savedDraft.telefone || '');

  // Errors for Identification
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [erroCpf, setErroCpf] = useState<string | null>(null);
  const [erroTel, setErroTel] = useState<string | null>(null);

  // Inline Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [loginErro, setLoginErro] = useState<string | null>(null);
  const [loginProcessando, setLoginProcessando] = useState(false);

  // Inline Registration
  const [cadNome, setCadNome] = useState('');
  const [cadEmail, setCadEmail] = useState('');
  const [cadCpf, setCadCpf] = useState('');
  const [cadTel, setCadTel] = useState('');
  const [cadSenha, setCadSenha] = useState('');
  const [cadConfSenha, setCadConfSenha] = useState('');
  const [cadMostrarSenha, setCadMostrarSenha] = useState(false);
  const [cadErro, setCadErro] = useState<string | null>(null);
  const [cadProcessando, setCadProcessando] = useState(false);

  // SECTION 2: DELIVERY STATE
  const endClientePrincipal = cliente?.enderecos?.find((e) => e.principal) || cliente?.enderecos?.[0];

  const [cep, setCep] = useState<string>(endClientePrincipal?.cep || savedDraft.cep || '');
  const [rua, setRua] = useState<string>(endClientePrincipal?.rua || savedDraft.rua || '');
  const [numero, setNumero] = useState<string>(endClientePrincipal?.numero || savedDraft.numero || '');
  const [complemento, setComplemento] = useState<string>(endClientePrincipal?.complemento || savedDraft.complemento || '');
  const [bairro, setBairro] = useState<string>(endClientePrincipal?.bairro || savedDraft.bairro || '');
  const [cidade, setCidade] = useState<string>(endClientePrincipal?.cidade || savedDraft.cidade || '');
  const [uf, setUf] = useState<string>(endClientePrincipal?.uf || savedDraft.uf || '');
  const [salvarEnderecoFuturo, setSalvarEnderecoFuturo] = useState(true);

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erroCep, setErroCep] = useState<string | null>(null);

  // FREIGHT STATE
  const [opcoesFrete, setOpcoesFrete] = useState<Frete[]>([]);
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [erroFrete, setErroFrete] = useState<string | null>(null);

  // FREIGHT DEV PANEL SCENARIO
  const [devScenario, setDevScenario] = useState<FreteDevScenario>(getFreteDevScenario());

  // SECTION 3: COUPON STATE
  const [codigoCupomInput, setCodigoCupomInput] = useState(savedDraft.codigoCupomInput || '');
  const [erroCupomInput, setErroCupomInput] = useState<string | null>(null);
  const [mensagemCupom, setMensagemCupom] = useState<string | null>(null);

  // GENERAL SUBMIT STATE
  const [processandoFinalizacao, setProcessandoFinalizacao] = useState(false);
  const [erroSubmit, setErroSubmit] = useState<string | null>(null);
  const [pedidoAtivo, setPedidoAtivo] = useState<Pedido | null>(null);

  // Update form fields if client logs in
  useEffect(() => {
    if (cliente) {
      if (cliente.nomeCompleto) setNomeCompleto(cliente.nomeCompleto);
      if (cliente.email) setEmail(cliente.email);
      if (cliente.cpf) setCpf(mascararCPF(cliente.cpf));
      if (cliente.telefone) setTelefone(mascararTelefone(cliente.telefone));

      const primary = cliente.enderecos?.find((e) => e.principal) || cliente.enderecos?.[0];
      if (primary) {
        if (primary.cep) setCep(primary.cep);
        if (primary.rua) setRua(primary.rua);
        if (primary.numero) setNumero(primary.numero);
        if (primary.complemento) setComplemento(primary.complemento || '');
        if (primary.bairro) setBairro(primary.bairro);
        if (primary.cidade) setCidade(primary.cidade);
        if (primary.uf) setUf(primary.uf);
      }
      setSecao1Expandida(false);
    }
  }, [cliente]);

  // Save checkout draft to localStorage on every change
  useEffect(() => {
    const draftData = {
      nomeCompleto,
      email,
      cpf,
      telefone,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
      codigoCupomInput,
      identificacaoConcluida: logado || (validarNomeCompleto(nomeCompleto) && validarEmail(email) && validarCPF(cpf)),
    };
    localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draftData));
  }, [nomeCompleto, email, cpf, telefone, cep, rua, numero, complemento, bairro, cidade, uf, codigoCupomInput, logado]);

  // Automatic CEP lookup when 8 clean digits are entered
  const handleCepChange = (valor: string) => {
    // Mask: 00000-000
    const clean = valor.replace(/\D/g, '').slice(0, 8);
    let masked = clean;
    if (clean.length > 5) {
      masked = `${clean.slice(0, 5)}-${clean.slice(5)}`;
    }
    setCep(masked);

    if (clean.length === 8) {
      executarConsultaCep(clean);
    }
  };

  const executarConsultaCep = async (cleanCep: string) => {
    setErroCep(null);
    setBuscandoCep(true);
    setOpcoesFrete([]);
    selecionarFrete(null);

    try {
      const res = await cepService.consultarCep(cleanCep);
      setRua(res.rua || '');
      setBairro(res.bairro || '');
      setCidade(res.cidade || '');
      setUf(res.uf || '');

      // Auto focus on "Número"
      setTimeout(() => {
        numeroInputRef.current?.focus();
      }, 100);

      // Trigger Freight calculation if address ready
      calcularOpcoesFrete(cleanCep);
    } catch (err: any) {
      setErroCep(err.message || 'CEP não encontrado. Confira o número digitado.');
    } finally {
      setBuscandoCep(false);
    }
  };

  // Freight calculation
  const calcularOpcoesFrete = async (cleanCep: string) => {
    if (!cleanCep || cleanCep.length !== 8) return;

    setCalculandoFrete(true);
    setErroFrete(null);
    setOpcoesFrete([]);
    selecionarFrete(null);

    try {
      const opcs = await freteService.calcularFrete(cleanCep, 0, subtotal, itens);
      setOpcoesFrete(opcs);
      // NOTE: Mandatory requirement: "Nenhuma opção pré-selecionada". User must click a radio card explicitly!
    } catch (err: any) {
      setErroFrete(err.message || 'Erro ao calcular frete dos Correios.');
      selecionarFrete(null);
    } finally {
      setCalculandoFrete(false);
    }
  };

  // Re-calculate freight when dev scenario or cart items change if CEP is valid
  useEffect(() => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length === 8 && rua && cidade) {
      calcularOpcoesFrete(clean);
    }
  }, [devScenario, subtotal, itens.length]);

  const handleDevScenarioChange = (newScenario: FreteDevScenario) => {
    setDevScenario(newScenario);
    setFreteDevScenario(newScenario);
  };

  // Coupon handling with debounce
  useEffect(() => {
    if (!codigoCupomInput.trim()) {
      setErroCupomInput(null);
      setMensagemCupom(null);
      return;
    }

    const timer = setTimeout(() => {
      const result = aplicarCupom(codigoCupomInput);
      if (result.sucesso) {
        setErroCupomInput(null);
        setMensagemCupom(result.mensagem);
      } else {
        setErroCupomInput('Cupom inválido ou expirado');
        setMensagemCupom(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [codigoCupomInput, subtotal]);

  const handleAplicarCupomBotao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoCupomInput.trim()) return;

    const result = aplicarCupom(codigoCupomInput);
    if (result.sucesso) {
      setErroCupomInput(null);
      setMensagemCupom(result.mensagem);
    } else {
      setErroCupomInput('Cupom inválido ou expirado');
      setMensagemCupom(null);
    }
  };

  // SECTION 1 HANDLERS
  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErro(null);

    if (!loginEmail.trim() || !loginSenha) {
      setLoginErro('Informe e-mail e senha.');
      return;
    }

    setLoginProcessando(true);
    try {
      const ok = await login(loginEmail, loginSenha);
      if (ok) {
        setSecao1Expandida(false);
      } else {
        setLoginErro('E-mail ou senha incorretos.');
      }
    } catch {
      setLoginErro('Erro ao realizar login.');
    } finally {
      setLoginProcessando(false);
    }
  };

  const handleInlineCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setCadErro(null);

    if (!validarNomeCompleto(cadNome)) {
      setCadErro('Informe seu nome e sobrenome completo.');
      return;
    }

    if (!validarEmail(cadEmail)) {
      setCadErro('Informe um e-mail válido.');
      return;
    }

    if (emailExisteNoDb(cadEmail)) {
      setCadErro('Este e-mail já possui conta. Entrar?');
      return;
    }

    if (!validarCPF(cadCpf)) {
      setCadErro('CPF inválido. Verifique os dígitos.');
      return;
    }

    if (cpfExisteNoDb(cadCpf)) {
      setCadErro('Este CPF já está cadastrado.');
      return;
    }

    if (cadSenha.length < 4) {
      setCadErro('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    if (cadSenha !== cadConfSenha) {
      setCadErro('As senhas não coincidem.');
      return;
    }

    setCadProcessando(true);
    try {
      await cadastrar(
        {
          nomeCompleto: cadNome,
          email: cadEmail,
          cpf: cadCpf,
          telefone: cadTel,
          enderecos: [],
        },
        cadSenha
      );
      setSecao1Expandida(false);
    } catch (err: any) {
      setCadErro(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setCadProcessando(false);
    }
  };

  const handleConfirmarVisitante = (e: React.FormEvent) => {
    e.preventDefault();
    let temErro = false;

    if (!validarNomeCompleto(nomeCompleto)) {
      setErroNome('Digite seu nome completo (mínimo duas palavras).');
      temErro = true;
    } else {
      setErroNome(null);
    }

    if (!validarEmail(email)) {
      setErroEmail('Informe um e-mail válido.');
      temErro = true;
    } else {
      setErroEmail(null);
    }

    if (!validarCPF(cpf)) {
      setErroCpf('CPF inválido. Verifique os dígitos.');
      temErro = true;
    } else {
      setErroCpf(null);
    }

    const cleanTel = telefone.replace(/\D/g, '');
    if (!cleanTel || cleanTel.length < 10) {
      setErroTel('Informe um telefone válido com DDD.');
      temErro = true;
    } else {
      setErroTel(null);
    }

    if (!temErro) {
      setSecao1Expandida(false);
    }
  };

  // CHECKOUT VALIDATION & SUBMIT
  const dadosIdentificacaoValidos =
    logado ||
    (validarNomeCompleto(nomeCompleto) &&
      validarEmail(email) &&
      validarCPF(cpf) &&
      telefone.replace(/\D/g, '').length >= 10);

  const dadosEnderecoValidos =
    cep.replace(/\D/g, '').length === 8 &&
    rua.trim().length > 0 &&
    numero.trim().length > 0 &&
    bairro.trim().length > 0 &&
    cidade.trim().length > 0 &&
    uf.trim().length === 2;

  const freteSelecionadoValido = !!frete && !erroFrete;

  const checkoutLiberado = dadosIdentificacaoValidos && dadosEnderecoValidos && freteSelecionadoValido;

  const handleFinalizarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroSubmit(null);

    if (!dadosIdentificacaoValidos) {
      setSecao1Expandida(true);
      setErroSubmit('Por favor, preencha os dados de identificação e CPF para emissão da NF-e.');
      return;
    }

    if (!dadosEnderecoValidos) {
      setErroSubmit('Preencha os dados completos do endereço de entrega.');
      return;
    }

    if (!freteSelecionadoValido) {
      setErroSubmit('Escolha uma forma de envio para liberar o pagamento.');
      return;
    }

    setProcessandoFinalizacao(true);
    try {
      const numPedido = `PG-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const pedidoId = `ped-${Date.now()}`;

      // Generate PIX
      const config = getConfigLoja();
      const pix = await pixService.criarCobranca({
        pedidoId,
        valorTotal: total,
        cpfPagador: logado ? cliente?.cpf : cpf,
        nomePagador: logado ? cliente?.nomeCompleto : nomeCompleto,
        expiraEmMinutos: config?.pixExpiracaoMinutos || 30,
      });

      const novoEndereco: Endereco = {
        id: `end-${Date.now()}`,
        apelido: 'Entrega Pedido',
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        principal: true,
      };

      // Save address if requested for logged user
      if (logado && cliente && salvarEnderecoFuturo) {
        const exist = cliente.enderecos?.some(
          (e) => e.cep === cep && e.numero === numero
        );
        if (!exist) {
          const novosEnderecos = [...(cliente.enderecos || []), novoEndereco];
          upsert('clientes', { ...cliente, enderecos: novosEnderecos });
        }
      }

      const novoPedido: Pedido = {
        id: pedidoId,
        numero: numPedido,
        clienteId: cliente?.id || `cli-guest-${Date.now()}`,
        snapshotCliente: {
          nomeCompleto: logado ? cliente!.nomeCompleto : nomeCompleto,
          email: logado ? cliente!.email : email,
          cpf: logado ? cliente!.cpf : cpf,
          telefone: logado ? cliente!.telefone : telefone,
        },
        itens,
        subtotal,
        descontoCupom: desconto,
        cupomCodigo: cupom?.codigo,
        frete: frete!,
        total,
        endereco: novoEndereco,
        status: 'aguardando_pix',
        pix: {
          txid: pix.txid,
          qrCodeImagem: pix.qrCodeImagem,
          copiaECola: pix.copiaECola,
          expiraEm: pix.expiraEm,
        },
        nf: {
          status: 'na_fila',
          tentativas: 0,
        },
        erp: {
          status: 'nao_enviado',
        },
        timeline: [
          {
            em: new Date().toISOString(),
            evento: 'Pedido Criado',
            detalhe: 'Aguardando pagamento via PIX',
          },
          {
            em: new Date().toISOString(),
            evento: 'Chave PIX Gerada',
            detalhe: `TXID: ${pix.txid} (Validade 30 min)`,
          },
        ],
        criadoEm: new Date().toISOString(),
      };

      upsert('pedidos', novoPedido);

      // Clear draft & cart
      localStorage.removeItem(CHECKOUT_DRAFT_KEY);
      limparCarrinho();

      setPedidoAtivo(novoPedido);
    } catch (err: any) {
      setErroSubmit(err.message || 'Erro ao finalizar o pedido. Tente novamente.');
    } finally {
      setProcessandoFinalizacao(false);
    }
  };

  // Render Empty Cart Warning
  if (itens.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-8 text-center max-w-xl mx-auto my-12 shadow-xs space-y-4 font-body">
        <p className="font-pg-display text-xl font-bold uppercase text-pg-red italic">
          SEU CARRINHO ESTÁ VAZIO
        </p>
        <p className="text-xs text-gray-600">
          Você não possui itens no carrinho. Adicione chuteiras ou artigos esportivos antes de finalizar.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="bg-pg-petrol hover:bg-opacity-90 text-white px-6 py-3 text-xs font-pg-display font-bold uppercase"
        >
          VOLTAR PARA A LOJA PENTAGOL
        </button>
      </div>
    );
  }

  // Password strength label calculator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: '', color: 'bg-gray-200' };
    if (pwd.length < 4) return { level: 1, label: 'Muito Fraca', color: 'bg-red-500' };
    const hasNum = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    if (pwd.length >= 8 && hasNum && hasSpecial) return { level: 4, label: 'Forte', color: 'bg-emerald-600' };
    if (pwd.length >= 8 && hasNum) return { level: 3, label: 'Média', color: 'bg-yellow-500' };
    return { level: 2, label: 'Aceitável', color: 'bg-amber-500' };
  };

  const strInfo = getPasswordStrength(cadSenha);

  return (
    <div className="space-y-6 pb-16 font-body">
      {/* HEADER BAR */}
      <div className="bg-pg-petrol text-white p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-pg-display text-xl sm:text-2xl font-bold tracking-wide uppercase italic">
            FINALIZAR COMPRA — TELA ÚNICA
          </h1>
          <p className="text-xs text-gray-200">
            PENTAGOL Esportes | Dados do comprador, endereço de entrega e pagamento via PIX
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono bg-pg-ink/30 px-3 py-1.5 rounded-xs border border-white/20 shrink-0">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Ambiente Seguro SSL</span>
        </div>
      </div>

      <form onSubmit={handleFinalizarPedido} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: 4 STACKED SECTIONS */}
        <div className="lg:col-span-8 space-y-6">

          {/* ==================================================================== */}
          {/* SEÇÃO 1: IDENTIFICAÇÃO                                              */}
          {/* ==================================================================== */}
          <div className="bg-white border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b-2 border-pg-red pb-2">
              <h2 className="font-pg-display text-base font-bold italic uppercase text-pg-ink flex items-center space-x-2">
                <User className="w-5 h-5 text-pg-red" />
                <span>1. IDENTIFICAÇÃO</span>
              </h2>
              {(!secao1Expandida || logado) && (
                <button
                  type="button"
                  onClick={() => setSecao1Expandida(!secao1Expandida)}
                  className="text-xs font-pg-display font-bold text-pg-petrol hover:text-pg-red flex items-center space-x-1 uppercase"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{secao1Expandida ? 'Recolher' : 'Alterar'}</span>
                </button>
              )}
            </div>

            {/* COLLAPSED SUMMARY IF IDENTIFIED */}
            {!secao1Expandida && (logado || (nomeCompleto && email && cpf)) && (
              <div className="bg-gray-50 border border-gray-200 p-4 text-xs space-y-1.5 flex justify-between items-center">
                <div>
                  <p className="font-bold text-pg-ink text-sm">
                    {logado ? cliente?.nomeCompleto : nomeCompleto}
                  </p>
                  <p className="text-gray-600 font-mono">
                    E-mail: {logado ? cliente?.email : email} | CPF: {logado ? mascararCPF(cliente?.cpf || '') : cpf}
                  </p>
                  <p className="text-gray-600 font-mono">
                    Telefone: {logado ? mascararTelefone(cliente?.telefone || '') : telefone}
                  </p>
                </div>
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-1 text-[11px] font-bold font-mono">
                  ✓ Concluído
                </span>
              </div>
            )}

            {/* EXPANDED IDENTIFICATION FORM */}
            {secao1Expandida && (
              <div className="space-y-4">
                {!logado && (
                  <div className="flex border-b border-gray-200 text-xs font-pg-display uppercase font-bold">
                    <button
                      type="button"
                      onClick={() => setModoAuthInline('visitante')}
                      className={`px-4 py-2 border-b-2 transition-all ${
                        modoAuthInline === 'visitante'
                          ? 'border-pg-red text-pg-red bg-red-50/50'
                          : 'border-transparent text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Comprar sem Senha
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoAuthInline('login')}
                      className={`px-4 py-2 border-b-2 transition-all ${
                        modoAuthInline === 'login'
                          ? 'border-pg-red text-pg-red bg-red-50/50'
                          : 'border-transparent text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <LogIn className="w-3.5 h-3.5 inline mr-1" />
                      Já tenho conta (Login Inline)
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoAuthInline('cadastro')}
                      className={`px-4 py-2 border-b-2 transition-all ${
                        modoAuthInline === 'cadastro'
                          ? 'border-pg-red text-pg-red bg-red-50/50'
                          : 'border-transparent text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5 inline mr-1" />
                      Criar conta agora
                    </button>
                  </div>
                )}

                {/* OPTION A: VISITANTE FORM */}
                {modoAuthInline === 'visitante' && !logado && (
                  <div className="space-y-4 text-xs">
                    <p className="text-gray-600 text-[11px]">
                      Informe seus dados pessoais. O CPF é obrigatório para emissão da Nota Fiscal Eletrônica (NF-e).
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                          Nome Completo <span className="text-pg-red">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex.: Carlos Eduardo Silva"
                          value={nomeCompleto}
                          onChange={(e) => setNomeCompleto(e.target.value)}
                          className={`w-full bg-gray-50 border px-3 py-2 focus:outline-none ${
                            erroNome ? 'border-pg-red' : 'border-gray-300 focus:border-pg-red'
                          }`}
                        />
                        {erroNome && <p className="text-[11px] text-pg-red mt-0.5">{erroNome}</p>}
                      </div>

                      <div>
                        <label className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                          E-mail <span className="text-pg-red">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="seu.email@exemplo.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full bg-gray-50 border px-3 py-2 font-mono focus:outline-none ${
                            erroEmail ? 'border-pg-red' : 'border-gray-300 focus:border-pg-red'
                          }`}
                        />
                        {erroEmail && <p className="text-[11px] text-pg-red mt-0.5">{erroEmail}</p>}
                      </div>

                      <div>
                        <label className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                          CPF (Obrigatório NF-e) <span className="text-pg-red">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="000.000.000-00"
                          value={cpf}
                          onChange={(e) => setCpf(mascararCPF(e.target.value))}
                          maxLength={14}
                          className={`w-full bg-gray-50 border px-3 py-2 font-mono focus:outline-none ${
                            erroCpf ? 'border-pg-red' : 'border-gray-300 focus:border-pg-red'
                          }`}
                        />
                        {erroCpf && <p className="text-[11px] text-pg-red mt-0.5">{erroCpf}</p>}
                      </div>

                      <div>
                        <label className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                          Telefone / WhatsApp <span className="text-pg-red">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="(31) 99999-9999"
                          value={telefone}
                          onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
                          maxLength={15}
                          className={`w-full bg-gray-50 border px-3 py-2 font-mono focus:outline-none ${
                            erroTel ? 'border-pg-red' : 'border-gray-300 focus:border-pg-red'
                          }`}
                        />
                        {erroTel && <p className="text-[11px] text-pg-red mt-0.5">{erroTel}</p>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmarVisitante}
                      className="bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display text-xs font-bold uppercase px-6 py-2.5"
                    >
                      CONFIRMAR DADOS DO COMPRADOR
                    </button>
                  </div>
                )}

                {/* OPTION B: INLINE LOGIN */}
                {modoAuthInline === 'login' && !logado && (
                  <form onSubmit={handleInlineLogin} className="space-y-3 text-xs">
                    {loginErro && (
                      <div className="bg-red-50 border border-pg-red p-2 text-pg-red font-bold flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{loginErro}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-pg-display font-bold uppercase block mb-1">E-mail</label>
                        <input
                          type="email"
                          required
                          placeholder="seu.email@exemplo.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-300 px-3 py-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-pg-display font-bold uppercase block mb-1">Senha</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={loginSenha}
                          onChange={(e) => setLoginSenha(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-300 px-3 py-2"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loginProcessando}
                      className="bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display font-bold uppercase px-6 py-2.5"
                    >
                      {loginProcessando ? 'ENTRANDO...' : 'ENTRAR E PREENCHER DADOS'}
                    </button>
                  </form>
                )}

                {/* OPTION C: INLINE REGISTRATION */}
                {modoAuthInline === 'cadastro' && !logado && (
                  <form onSubmit={handleInlineCadastro} className="space-y-3 text-xs">
                    {cadErro && (
                      <div className="bg-red-50 border border-pg-red p-2 text-pg-red font-bold flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{cadErro}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Nome Completo *"
                        value={cadNome}
                        onChange={(e) => setCadNome(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 px-3 py-2"
                      />
                      <input
                        type="email"
                        placeholder="E-mail *"
                        value={cadEmail}
                        onChange={(e) => setCadEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 px-3 py-2 font-mono"
                      />
                      <input
                        type="text"
                        placeholder="CPF *"
                        value={cadCpf}
                        onChange={(e) => setCadCpf(mascararCPF(e.target.value))}
                        maxLength={14}
                        className="w-full bg-gray-50 border border-gray-300 px-3 py-2 font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Telefone *"
                        value={cadTel}
                        onChange={(e) => setCadTel(mascararTelefone(e.target.value))}
                        maxLength={15}
                        className="w-full bg-gray-50 border border-gray-300 px-3 py-2 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="relative">
                          <input
                            type={cadMostrarSenha ? 'text' : 'password'}
                            placeholder="Senha *"
                            value={cadSenha}
                            onChange={(e) => setCadSenha(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 px-3 py-2 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setCadMostrarSenha(!cadMostrarSenha)}
                            className="absolute right-2 top-2 text-[10px] text-gray-500 hover:text-gray-800 font-bold uppercase"
                          >
                            {cadMostrarSenha ? 'OCULTAR' : 'VER'}
                          </button>
                        </div>
                        {cadSenha && (
                          <div className="mt-1 space-y-0.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-gray-500">Força da senha:</span>
                              <span className="font-bold">{strInfo.label}</span>
                            </div>
                            <div className="h-1 bg-gray-200 w-full overflow-hidden">
                              <div className={`h-full ${strInfo.color}`} style={{ width: `${(strInfo.level / 4) * 100}%` }} />
                            </div>
                            <p className="text-[10px] text-gray-500 italic">
                              Recomendação: Use ao menos 8 caracteres com números.
                            </p>
                          </div>
                        )}
                      </div>

                      <input
                        type="password"
                        placeholder="Confirmar Senha *"
                        value={cadConfSenha}
                        onChange={(e) => setCadConfSenha(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 px-3 py-2"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={cadProcessando}
                      className="bg-pg-red hover:bg-opacity-90 text-white font-pg-display font-bold uppercase px-6 py-2.5"
                    >
                      {cadProcessando ? 'CRIANDO CONTA...' : 'CRIAR CONTA E PROSSEGUIR'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* ==================================================================== */}
          {/* SEÇÃO 2: ENTREGA & FRETE CORREIOS                                   */}
          {/* ==================================================================== */}
          <div className="bg-white border border-gray-200 p-6 shadow-xs space-y-5">
            <h2 className="font-pg-display text-base font-bold italic uppercase text-pg-ink border-b-2 border-pg-red pb-2 flex items-center space-x-2">
              <Truck className="w-5 h-5 text-pg-red" />
              <span>2. ENDEREÇO DE ENTREGA & FRETE CORREIOS</span>
            </h2>

            {/* ADDRESS FORM */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                
                {/* CEP INPUT */}
                <div className="sm:col-span-4">
                  <label className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                    CEP <span className="text-pg-red">*</span>
                  </label>
                  <div className="flex space-x-1">
                    <input
                      type="text"
                      required
                      placeholder="00000-000"
                      value={cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      maxLength={9}
                      className={`w-full bg-gray-50 border px-3 py-2 font-mono focus:outline-none ${
                        erroCep ? 'border-pg-red' : 'border-gray-300 focus:border-pg-red'
                      }`}
                    />
                    <button
                      type="button"
                      disabled={buscandoCep}
                      onClick={() => handleCepChange(cep)}
                      className="bg-pg-petrol text-white text-[10px] font-pg-display font-bold uppercase px-2.5 shrink-0"
                    >
                      {buscandoCep ? '...' : 'BUSCAR'}
                    </button>
                  </div>
                  <a
                    href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-pg-petrol hover:text-pg-red underline mt-1 inline-block"
                  >
                    Não sei meu CEP
                  </a>
                </div>

                {/* RUA (READ ONLY IF FROM VIACEP) */}
                <div className="sm:col-span-8">
                  <label className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                    Rua / Avenida <span className="text-pg-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    readOnly
                    placeholder="Rua ou Avenida preenchida via CEP"
                    value={rua}
                    className="w-full bg-gray-100 border border-gray-300 px-3 py-2 font-bold cursor-not-allowed"
                  />
                </div>

                {/* NÚMERO (EDITABLE WITH AUTO FOCUS) */}
                <div className="sm:col-span-4">
                  <label className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                    Número <span className="text-pg-red">*</span>
                  </label>
                  <input
                    ref={numeroInputRef}
                    type="text"
                    required
                    placeholder="Ex.: 150"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 px-3 py-2 font-bold focus:outline-none focus:border-pg-red"
                  />
                </div>

                {/* COMPLEMENTO (EDITABLE) */}
                <div className="sm:col-span-8">
                  <label className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: Apto 402, Bloco B"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 px-3 py-2 focus:outline-none focus:border-pg-red"
                  />
                </div>

                {/* BAIRRO (READ ONLY) */}
                <div className="sm:col-span-5">
                  <label className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                    Bairro <span className="text-pg-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={bairro}
                    className="w-full bg-gray-100 border border-gray-300 px-3 py-2 cursor-not-allowed"
                  />
                </div>

                {/* CIDADE (READ ONLY) */}
                <div className="sm:col-span-5">
                  <label className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                    Cidade <span className="text-pg-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={cidade}
                    className="w-full bg-gray-100 border border-gray-300 px-3 py-2 cursor-not-allowed"
                  />
                </div>

                {/* UF (READ ONLY) */}
                <div className="sm:col-span-2">
                  <label className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                    UF <span className="text-pg-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={uf}
                    className="w-full bg-gray-100 border border-gray-300 px-3 py-2 font-mono cursor-not-allowed uppercase text-center"
                  />
                </div>

              </div>

              {erroCep && (
                <div className="bg-red-50 border border-pg-red p-3 text-xs text-pg-red font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erroCep}</span>
                </div>
              )}

              {logado && (
                <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={salvarEnderecoFuturo}
                    onChange={(e) => setSalvarEnderecoFuturo(e.target.checked)}
                    className="text-pg-red focus:ring-pg-red"
                  />
                  <span>Salvar este endereço para futuras compras</span>
                </label>
              )}
            </div>

            {/* FREIGHT SELECTION RADIO CARDS */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-pg-display text-xs font-bold uppercase text-pg-ink">
                  OPÇÕES DE FRETE PARA SEU ENDEREÇO
                </p>
                {calculandoFrete && (
                  <span className="text-[11px] font-mono text-pg-petrol animate-pulse font-bold flex items-center space-x-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Calculando opções...</span>
                  </span>
                )}
              </div>

              {erroFrete && (
                <div className="bg-red-50 border border-pg-red p-3 text-xs text-pg-red font-bold space-y-2">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{erroFrete}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => calcularOpcoesFrete(cep.replace(/\D/g, ''))}
                    className="bg-pg-red text-white text-[10px] font-pg-display font-bold uppercase px-3 py-1 flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>TENTAR NOVAMENTE</span>
                  </button>
                </div>
              )}

              {opcoesFrete.length > 0 && !erroFrete && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {opcoesFrete.map((f) => {
                    const isSelected = frete?.servico === f.servico;
                    return (
                      <div
                        key={f.servico}
                        onClick={() => selecionarFrete(f)}
                        className={`p-4 border-2 cursor-pointer transition-all flex justify-between items-center ${
                          isSelected
                            ? 'border-pg-red bg-red-50/40 shadow-xs'
                            : 'border-gray-200 bg-white hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="frete_opcao"
                            checked={isSelected}
                            onChange={() => selecionarFrete(f)}
                            className="text-pg-red focus:ring-pg-red"
                          />
                          <div>
                            <p className="font-pg-display font-bold uppercase text-gray-900 text-sm">
                              {f.servico} ({f.transportadora})
                            </p>
                            <p className="text-[11px] text-gray-600">
                              Entrega em até <strong>{f.prazoDias} dias úteis</strong>
                            </p>
                          </div>
                        </div>

                        <span className="font-body text-base font-bold text-pg-red font-mono">
                          {f.valor === 0 ? 'GRÁTIS' : `R$ ${f.valor.toFixed(2).replace('.', ',')}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {opcoesFrete.length === 0 && !calculandoFrete && !erroFrete && (
                <p className="text-xs text-gray-500 italic bg-gray-50 p-3 border border-gray-200">
                  Informe um CEP com 8 dígitos para visualizar os prazos e valores de frete dos Correios.
                </p>
              )}
            </div>

            {/* FREIGHT DEVELOPER PANEL WIDGET */}
            <div className="bg-amber-50 border border-amber-300 p-3 text-xs text-amber-900 space-y-2 rounded-xs">
              <div className="flex items-center justify-between font-bold font-pg-display uppercase text-[11px]">
                <span className="flex items-center space-x-1 text-amber-950">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Painel Dev — Simulador de Erros de Frete</span>
                </span>
                <span className="font-mono text-[10px] text-amber-700 bg-amber-200/60 px-1.5 py-0.5">
                  Status Atual: {devScenario}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleDevScenarioChange('normal')}
                  className={`px-2 py-1 font-bold font-mono border ${
                    devScenario === 'normal'
                      ? 'bg-amber-800 text-white border-amber-900'
                      : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  Simulação Normal
                </button>
                <button
                  type="button"
                  onClick={() => handleDevScenarioChange('erro_webservice')}
                  className={`px-2 py-1 font-bold font-mono border ${
                    devScenario === 'erro_webservice'
                      ? 'bg-pg-red text-white border-pg-red'
                      : 'bg-white text-pg-red border-red-300 hover:bg-red-50'
                  }`}
                >
                  Forçar Erro Webservice
                </button>
                <button
                  type="button"
                  onClick={() => handleDevScenarioChange('cep_nao_atendido')}
                  className={`px-2 py-1 font-bold font-mono border ${
                    devScenario === 'cep_nao_atendido'
                      ? 'bg-pg-red text-white border-pg-red'
                      : 'bg-white text-pg-red border-red-300 hover:bg-red-50'
                  }`}
                >
                  Forçar CEP Não Atendido
                </button>
                <button
                  type="button"
                  onClick={() => handleDevScenarioChange('prazo_indisponivel')}
                  className={`px-2 py-1 font-bold font-mono border ${
                    devScenario === 'prazo_indisponivel'
                      ? 'bg-pg-red text-white border-pg-red'
                      : 'bg-white text-pg-red border-red-300 hover:bg-red-50'
                  }`}
                >
                  Forçar Prazo Indisponível
                </button>
              </div>
            </div>

          </div>

          {/* ==================================================================== */}
          {/* SEÇÃO 3: CUPOM DE DESCONTO                                           */}
          {/* ==================================================================== */}
          <div className="bg-white border border-gray-200 p-6 shadow-xs space-y-4">
            <h2 className="font-pg-display text-base font-bold italic uppercase text-pg-ink border-b-2 border-pg-red pb-2 flex items-center space-x-2">
              <Tag className="w-5 h-5 text-pg-red" />
              <span>3. CUPOM DE DESCONTO (INSTAGRAM 5%)</span>
            </h2>

            <form onSubmit={handleAplicarCupomBotao} className="space-y-3 text-xs">
              <div className="flex space-x-2 max-w-md">
                <input
                  type="text"
                  placeholder="Digite seu cupom (ex.: INSTA5)"
                  value={codigoCupomInput}
                  onChange={(e) => setCodigoCupomInput(e.target.value.toUpperCase())}
                  className={`flex-1 bg-gray-50 border px-3 py-2 font-mono uppercase focus:outline-none ${
                    erroCupomInput ? 'border-pg-red text-pg-red' : 'border-gray-300 focus:border-pg-red'
                  }`}
                />
                <button
                  type="submit"
                  className="bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display font-bold uppercase px-4 py-2 shrink-0"
                >
                  APLICAR
                </button>
              </div>

              {/* INVALID OR EXPIRED COUPON ERROR MESSAGE */}
              {erroCupomInput && (
                <p className="text-xs font-bold text-pg-red flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erroCupomInput}</span>
                </p>
              )}

              {/* SUCCESS MESSAGE OR ACTIVE COUPON BADGE */}
              {cupom && (
                <div className="bg-emerald-50 border border-emerald-300 p-3 text-emerald-900 font-bold flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Cupom <strong>{cupom.codigo}</strong> aplicado ({cupom.percentual}% de desconto sobre os produtos)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      removerCupom();
                      setCodigoCupomInput('');
                      setErroCupomInput(null);
                      setMensagemCupom(null);
                    }}
                    className="text-xs text-pg-red hover:underline font-bold uppercase"
                  >
                    Remover
                  </button>
                </div>
              )}

              {mensagemCupom && !cupom && (
                <p className="text-xs font-bold text-emerald-700">{mensagemCupom}</p>
              )}
            </form>
          </div>

          {/* ==================================================================== */}
          {/* SEÇÃO 4: PAGAMENTO VIA PIX                                           */}
          {/* ==================================================================== */}
          {pedidoAtivo ? (
            <PixPaymentWidget
              pedido={pedidoAtivo}
              onPaymentConfirmed={(pAtualizado) => {
                navigate(`/pedido/${pAtualizado.numero}`);
              }}
              onPixExpired={(pExpirado) => {
                setPedidoAtivo(pExpirado);
              }}
              onRegeneratePix={() => {
                setPedidoAtivo(null);
              }}
            />
          ) : (
            <div
              className={`bg-white border p-6 shadow-xs space-y-4 transition-all ${
                checkoutLiberado ? 'border-emerald-500' : 'border-gray-300 opacity-80'
              }`}
            >
              <h2 className="font-pg-display text-base font-bold italic uppercase text-pg-ink border-b-2 border-pg-red pb-2 flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <QrCode className="w-5 h-5 text-pg-red" />
                  <span>4. PAGAMENTO EXCLUSIVO VIA PIX</span>
                </span>
                {!checkoutLiberado && (
                  <span className="text-[11px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 font-bold flex items-center space-x-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>PAGAMENTO BLOQUEADO</span>
                  </span>
                )}
              </h2>

              {!checkoutLiberado ? (
                <div className="bg-amber-50 border-2 border-amber-300 p-4 text-xs text-amber-900 space-y-2">
                  <p className="font-bold flex items-center space-x-2 text-amber-950 text-sm">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Aguardando seleção de frete para liberar o pagamento</span>
                  </p>
                  <p className="text-gray-700">
                    Para habilitar a geração do PIX e concluir seu pedido:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    {!dadosIdentificacaoValidos && <li>Preencha seus dados de identificação e CPF válido.</li>}
                    {!dadosEnderecoValidos && <li>Informe um CEP válido com endereço completo.</li>}
                    {!freteSelecionadoValido && <li>Escolha uma opção de frete (PAC ou SEDEX) na Seção 2.</li>}
                  </ul>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-300 p-4 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Tudo pronto para gerar seu QR Code PIX!</span>
                  </div>
                  <p className="text-emerald-800">
                    O pagamento via PIX tem aprovação imediata e reserva direta de estoque na PENTAGOL.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: STICKY ORDER SUMMARY */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-gray-200 p-6 shadow-xs space-y-5 sticky top-20">
            <h2 className="font-pg-display text-lg font-bold italic uppercase text-pg-ink border-b-2 border-pg-red pb-2">
              RESUMO DO PEDIDO
            </h2>

            {/* ITEM LIST PREVIEW */}
            <div className="space-y-3 max-h-64 overflow-y-auto divide-y divide-gray-100 text-xs pr-1">
              {itens.map((item) => (
                <div key={item.variacaoId} className="pt-2 flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <img
                      src={item.imagem}
                      alt={item.nome}
                      className="w-10 h-10 object-contain border border-gray-200 bg-gray-50 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 truncate leading-tight">{item.nome}</p>
                      <p className="text-[10px] text-gray-500 font-mono">
                        Qtd: {item.quantidade} | Tam: {item.tamanho || 'Único'}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-gray-900 shrink-0">
                    R$ {(item.precoUnit * item.quantidade).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>

            {/* TOTALS */}
            <div className="border-t border-gray-200 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600 font-medium">
                <span>Subtotal dos Produtos:</span>
                <span className="font-mono font-bold">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>

              {desconto > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Desconto ({cupom?.codigo || 'Cupom'}):</span>
                  <span className="font-mono">- R$ {desconto.toFixed(2).replace('.', ',')}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600 font-medium">
                <span>Frete ({frete ? frete.servico : 'Não selecionado'}):</span>
                <span className="font-mono font-bold">
                  {frete ? (frete.valor === 0 ? 'GRÁTIS' : `R$ ${frete.valor.toFixed(2).replace('.', ',')}`) : 'R$ 0,00'}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline" aria-live="polite">
                <span className="font-pg-display text-base font-bold text-gray-900 uppercase">
                  TOTAL:
                </span>
                <span className="font-body text-2xl font-extrabold text-pg-red">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {erroSubmit && (
              <div className="bg-red-50 border border-pg-red p-3 text-xs text-pg-red font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erroSubmit}</span>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={!checkoutLiberado || processandoFinalizacao}
              className={`w-full font-pg-display text-sm font-bold uppercase py-4 px-6 shadow-md transition-all flex items-center justify-center space-x-2 ${
                checkoutLiberado && !processandoFinalizacao
                  ? 'bg-pg-red hover:bg-opacity-95 text-white cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{processandoFinalizacao ? 'GERANDO PIX...' : 'FINALIZAR COMPRA VIA PIX'}</span>
            </button>

            <div className="text-center pt-2">
              <Link
                to="/carrinho"
                className="text-xs font-pg-display text-pg-petrol hover:text-pg-red font-bold uppercase underline"
              >
                &larr; Voltar ao Carrinho
              </Link>
            </div>
          </div>
        </div>

        {/* STICKY MOBILE BOTTOM BAR */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-pg-red p-3 shadow-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 block uppercase font-bold">Total a pagar:</span>
            <span className="font-body text-lg font-extrabold text-pg-red" aria-live="polite">
              R$ {total.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <button
            type="submit"
            disabled={!checkoutLiberado || processandoFinalizacao}
            className={`font-pg-display text-xs font-bold uppercase py-2.5 px-5 transition-all flex items-center space-x-1.5 ${
              checkoutLiberado && !processandoFinalizacao
                ? 'bg-pg-red hover:bg-opacity-95 text-white cursor-pointer shadow-md'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{processandoFinalizacao ? 'AGUARDE...' : 'FINALIZAR COMPRA'}</span>
          </button>
        </div>


      </form>
    </div>
  );
};
