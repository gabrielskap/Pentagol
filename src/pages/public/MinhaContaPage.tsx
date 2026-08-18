import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Building,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Home,
  LogOut,
  MapPin,
  Package,
  Plus,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAll } from '../../lib/db';
import { cepService } from '../../services';
import { Endereco, Pedido } from '../../types';
import { mascararCPF, mascararTelefone } from '../../lib/validation';

export const MinhaContaPage: React.FC = () => {
  const {
    cliente,
    logado,
    logout,
    atualizarDadosPessoais,
    adicionarEndereco,
    removerEndereco,
    marcarEnderecoPrincipal,
  } = useAuth();

  const navigate = useNavigate();

  // Active Tab: 'dados' | 'enderecos' | 'pedidos'
  const [activeTab, setActiveTab] = useState<'dados' | 'enderecos' | 'pedidos'>('dados');

  // Edit Personal Data State
  const [nomeCompleto, setNomeCompleto] = useState(cliente?.nomeCompleto || '');
  const [telefone, setTelefone] = useState(cliente?.telefone || '');
  const [novaSenha, setNovaSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [feedbackDados, setFeedbackDados] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(
    null
  );

  // Address Form State
  const [exibirFormEndereco, setExibirFormEndereco] = useState(false);
  const [cepEnd, setCepEnd] = useState('');
  const [ruaEnd, setRuaEnd] = useState('');
  const [numeroEnd, setNumeroEnd] = useState('');
  const [complementoEnd, setComplementoEnd] = useState('');
  const [bairroEnd, setBairroEnd] = useState('');
  const [cidadeEnd, setCidadeEnd] = useState('Belo Horizonte');
  const [ufEnd, setUfEnd] = useState('MG');
  const [principalEnd, setPrincipalEnd] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [feedbackEndereco, setFeedbackEndereco] = useState<string | null>(null);

  if (!logado || !cliente) {
    return (
      <div className="max-w-md mx-auto py-12 text-center bg-white border border-gray-200 p-8 shadow-xs space-y-4">
        <User className="w-12 h-12 text-gray-400 mx-auto" />
        <h2 className="font-pg-display text-xl font-bold uppercase text-pg-ink">
          VOCÊ NÃO ESTÁ CONECTADO
        </h2>
        <p className="text-xs text-gray-500">
          Acesse sua conta para visualizar seus dados, endereços e acompanhar o status de seus pedidos.
        </p>
        <Link
          to="/login?returnTo=/minha-conta"
          className="inline-block bg-pg-red text-white font-pg-display text-xs font-bold uppercase px-6 py-3 shadow-sm hover:bg-opacity-95"
        >
          Entrar na Minha Conta
        </Link>
      </div>
    );
  }

  // Load Customer Orders safely
  const todosPedidos = getAll<Pedido>('pedidos');
  const meusPedidos = todosPedidos.filter(
    (p) =>
      p.clienteId === cliente.id ||
      (p.snapshotCliente && p.snapshotCliente.email.toLowerCase() === cliente.email.toLowerCase())
  );

  // Save Personal Data Handler
  const handleSalvarDados = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackDados(null);
    setSalvandoDados(true);

    try {
      await atualizarDadosPessoais(nomeCompleto, telefone, novaSenha.trim() || undefined);
      setFeedbackDados({ tipo: 'ok', texto: 'Dados pessoais atualizados com sucesso!' });
      setNovaSenha('');
    } catch {
      setFeedbackDados({ tipo: 'erro', texto: 'Erro ao atualizar dados. Tente novamente.' });
    } finally {
      setSalvandoDados(false);
    }
  };

  // ViaCEP Lookup for Address Form
  const handleBuscarCep = async () => {
    const clean = cepEnd.replace(/\D/g, '');
    if (clean.length !== 8) {
      setFeedbackEndereco('Digite um CEP válido com 8 dígitos.');
      return;
    }
    setFeedbackEndereco(null);
    setBuscandoCep(true);
    try {
      const res = await cepService.consultarCep(clean);
      setRuaEnd(res.rua);
      setBairroEnd(res.bairro);
      setCidadeEnd(res.cidade);
      setUfEnd(res.uf);
    } catch (err: any) {
      setFeedbackEndereco(err.message || 'Erro ao buscar CEP.');
    } finally {
      setBuscandoCep(false);
    }
  };

  // Save Address Handler
  const handleSalvarEndereco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruaEnd.trim() || !numeroEnd.trim() || !bairroEnd.trim() || !cepEnd.trim()) {
      setFeedbackEndereco('Preencha os campos obrigatórios do endereço.');
      return;
    }

    try {
      await adicionarEndereco({
        apelido: 'Minha Casa',
        cep: cepEnd,
        rua: ruaEnd,
        numero: numeroEnd,
        complemento: complementoEnd,
        bairro: bairroEnd,
        cidade: cidadeEnd,
        uf: ufEnd,
        principal: principalEnd || cliente.enderecos.length === 0,
      });

      // Reset Form
      setCepEnd('');
      setRuaEnd('');
      setNumeroEnd('');
      setComplementoEnd('');
      setBairroEnd('');
      setPrincipalEnd(false);
      setExibirFormEndereco(false);
      setFeedbackEndereco(null);
    } catch {
      setFeedbackEndereco('Erro ao salvar endereço.');
    }
  };

  // Helper for Order Status Badge
  const renderStatusBadge = (status: Pedido['status']) => {
    switch (status) {
      case 'aguardando_pix':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 uppercase">Aguardando PIX</span>;
      case 'pago':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 uppercase">Pago em PIX</span>;
      case 'em_separacao':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-bold px-2 py-0.5 uppercase">Em Separação ERP</span>;
      case 'enviado':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-bold px-2 py-0.5 uppercase">Enviado com Rastreio</span>;
      case 'entregue':
        return <span className="bg-emerald-200 text-emerald-900 border border-emerald-400 text-[10px] font-bold px-2 py-0.5 uppercase">Entregue</span>;
      case 'cancelado':
      case 'pix_expirado':
        return <span className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-bold px-2 py-0.5 uppercase">Cancelado / Expirado</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 border border-gray-300 text-[10px] font-bold px-2 py-0.5 uppercase">{status}</span>;
    }
  };

  const primeiroNome = cliente.nomeCompleto ? cliente.nomeCompleto.split(' ')[0] : 'Cliente';

  return (
    <div className="space-y-6 pb-12 font-body select-none">
      {/* HEADER WELCOME BANNER */}
      <div className="bg-pg-petrol text-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs text-pg-yellow font-bold uppercase tracking-wider block">
            PAINEL DO CLIENTE PENTAGOL
          </span>
          <h1 className="font-pg-display text-2xl font-bold italic uppercase tracking-wide">
            Olá, {primeiroNome}!
          </h1>
          <p className="text-xs text-gray-300 mt-0.5">
            E-mail: <span className="font-mono text-white">{cliente.email}</span> | CPF:{' '}
            <span className="font-mono text-white">{mascararCPF(cliente.cpf)}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="bg-black/30 hover:bg-pg-red text-white font-pg-display text-xs font-bold uppercase px-4 py-2 border border-white/20 transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>
      </div>

      {/* MAIN CONTAINER WITH SIDEBAR TABS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* TAB BUTTONS (3 COLS ON DESKTOP) */}
        <div className="lg:col-span-3 bg-white border border-gray-200 shadow-xs divide-y divide-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('dados')}
            className={`w-full font-pg-display text-xs uppercase font-bold p-4 text-left flex items-center space-x-2.5 transition-colors ${
              activeTab === 'dados'
                ? 'bg-pg-red text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Dados Pessoais</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('enderecos')}
            className={`w-full font-pg-display text-xs uppercase font-bold p-4 text-left flex items-center justify-between transition-colors ${
              activeTab === 'enderecos'
                ? 'bg-pg-red text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <MapPin className="w-4 h-4" />
              <span>Meus Endereços</span>
            </div>
            <span className="text-[10px] bg-gray-200 text-gray-800 font-mono font-bold px-2 py-0.5 rounded-full">
              {cliente.enderecos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pedidos')}
            className={`w-full font-pg-display text-xs uppercase font-bold p-4 text-left flex items-center justify-between transition-colors ${
              activeTab === 'pedidos'
                ? 'bg-pg-red text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Package className="w-4 h-4" />
              <span>Meus Pedidos</span>
            </div>
            <span className="text-[10px] bg-gray-200 text-gray-800 font-mono font-bold px-2 py-0.5 rounded-full">
              {meusPedidos.length}
            </span>
          </button>
        </div>

        {/* TAB CONTENT PANEL (9 COLS ON DESKTOP) */}
        <div className="lg:col-span-9 bg-white border border-gray-200 p-6 shadow-xs">
          
          {/* TAB 1: DADOS PESSOAIS */}
          {activeTab === 'dados' && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-3">
                <h2 className="font-pg-display text-lg font-bold italic uppercase text-pg-ink">
                  DADOS PESSOAIS
                </h2>
                <p className="text-xs text-gray-500">
                  Mantenha suas informações de contato atualizadas. Por motivos de segurança, o CPF e o E-mail de cadastro não podem ser alterados.
                </p>
              </div>

              {feedbackDados && (
                <div
                  className={`p-3 text-xs font-bold flex items-center space-x-2 border ${
                    feedbackDados.tipo === 'ok'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-red-50 border-pg-red text-pg-red'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{feedbackDados.texto}</span>
                </div>
              )}

              <form onSubmit={handleSalvarDados} className="space-y-4 max-w-xl">
                {/* LOCKED CPF & EMAIL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-pg-display text-xs font-bold uppercase text-gray-500 block mb-1">
                      CPF (Bloqueado)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={mascararCPF(cliente.cpf)}
                      className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-xs font-mono text-gray-500 cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="font-pg-display text-xs font-bold uppercase text-gray-500 block mb-1">
                      E-mail (Bloqueado)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={cliente.email}
                      className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-xs font-mono text-gray-500 cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                {/* EDITABLE NOME & TELEFONE */}
                <div>
                  <label htmlFor="edit-nome" className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                    Nome Completo <span className="text-pg-red">*</span>
                  </label>
                  <input
                    id="edit-nome"
                    type="text"
                    required
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:border-pg-red font-bold"
                  />
                </div>

                <div>
                  <label htmlFor="edit-tel" className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                    Telefone / WhatsApp <span className="text-pg-red">*</span>
                  </label>
                  <input
                    id="edit-tel"
                    type="text"
                    required
                    value={telefone}
                    onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
                    maxLength={15}
                    className="w-full bg-gray-50 border border-gray-300 px-3 py-2 text-xs font-mono focus:outline-none focus:border-pg-red font-bold"
                  />
                </div>

                {/* EDITABLE NOVA SENHA */}
                <div className="pt-2 border-t border-gray-100">
                  <label htmlFor="edit-senha" className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                    Alterar Senha (Opcional)
                  </label>
                  <div className="relative">
                    <input
                      id="edit-senha"
                      type={mostrarSenha ? 'text' : 'password'}
                      placeholder="Deixe em branco para manter a senha atual"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 pr-10 px-3 py-2 text-xs focus:outline-none focus:border-pg-red font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={salvandoDados}
                  className="bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-xs font-bold uppercase py-3 px-6 shadow-xs transition-all"
                >
                  {salvandoDados ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: ENDEREÇOS */}
          {activeTab === 'enderecos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div>
                  <h2 className="font-pg-display text-lg font-bold italic uppercase text-pg-ink">
                    MEUS ENDEREÇOS DE ENTREGA
                  </h2>
                  <p className="text-xs text-gray-500">
                    Gerencie seus locais de entrega para cálculo de frete e envio do pedido.
                  </p>
                </div>
                {!exibirFormEndereco && (
                  <button
                    type="button"
                    onClick={() => setExibirFormEndereco(true)}
                    className="bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display text-xs font-bold uppercase px-3.5 py-2 flex items-center space-x-1 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Endereço</span>
                  </button>
                )}
              </div>

              {/* ADD ADDRESS FORM */}
              {exibirFormEndereco && (
                <div className="bg-gray-50 border-2 border-pg-petrol p-4 space-y-4 shadow-xs">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <h3 className="font-pg-display text-xs font-bold uppercase text-pg-petrol">
                      Cadastrar Novo Endereço
                    </h3>
                    <button
                      type="button"
                      onClick={() => setExibirFormEndereco(false)}
                      className="text-xs text-gray-500 hover:text-pg-red underline"
                    >
                      Cancelar
                    </button>
                  </div>

                  {feedbackEndereco && (
                    <p className="text-xs text-pg-red font-bold">{feedbackEndereco}</p>
                  )}

                  <form onSubmit={handleSalvarEndereco} className="space-y-3">
                    <div className="flex space-x-2 max-w-xs">
                      <input
                        type="text"
                        placeholder="CEP (00000-000)"
                        value={cepEnd}
                        onChange={(e) => setCepEnd(e.target.value)}
                        maxLength={9}
                        className="w-full bg-white border border-gray-300 px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-pg-red"
                      />
                      <button
                        type="button"
                        disabled={buscandoCep}
                        onClick={handleBuscarCep}
                        className="bg-pg-petrol text-white font-pg-display text-xs font-bold px-3 py-1.5 shrink-0"
                      >
                        {buscandoCep ? 'BUSCANDO...' : 'BUSCAR CEP'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-8">
                        <input
                          type="text"
                          placeholder="Rua / Avenida"
                          value={ruaEnd}
                          onChange={(e) => setRuaEnd(e.target.value)}
                          className="w-full bg-white border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:border-pg-red"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder="Número"
                          value={numeroEnd}
                          onChange={(e) => setNumeroEnd(e.target.value)}
                          className="w-full bg-white border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:border-pg-red"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          placeholder="Complemento (Ex.: Apto 201)"
                          value={complementoEnd}
                          onChange={(e) => setComplementoEnd(e.target.value)}
                          className="w-full bg-white border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:border-pg-red"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          placeholder="Bairro"
                          value={bairroEnd}
                          onChange={(e) => setBairroEnd(e.target.value)}
                          className="w-full bg-white border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:border-pg-red"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-8">
                        <input
                          type="text"
                          placeholder="Cidade"
                          value={cidadeEnd}
                          onChange={(e) => setCidadeEnd(e.target.value)}
                          className="w-full bg-white border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:border-pg-red"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder="UF"
                          value={ufEnd}
                          onChange={(e) => setUfEnd(e.target.value)}
                          maxLength={2}
                          className="w-full bg-white border border-gray-300 px-3 py-1.5 text-xs uppercase focus:outline-none focus:border-pg-red"
                        />
                      </div>
                    </div>

                    <label className="flex items-center space-x-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={principalEnd}
                        onChange={(e) => setPrincipalEnd(e.target.checked)}
                        className="text-pg-red focus:ring-pg-red"
                      />
                      <span className="text-xs font-bold text-gray-700">
                        Definir como Endereço Principal de Entrega
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="bg-pg-red hover:bg-opacity-90 text-white font-pg-display text-xs font-bold uppercase py-2.5 px-5"
                    >
                      Salvar Endereço
                    </button>
                  </form>
                </div>
              )}

              {/* LIST OF ADDRESSES */}
              {cliente.enderecos.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 italic text-center">
                  Nenhum endereço cadastrado. Clique no botão acima para adicionar.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cliente.enderecos.map((end) => (
                    <div
                      key={end.id}
                      className={`p-4 border relative space-y-2 ${
                        end.principal
                          ? 'border-2 border-pg-red bg-red-50/20 shadow-xs'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {end.principal && (
                        <span className="bg-pg-red text-white text-[10px] font-bold uppercase px-2 py-0.5 inline-block mb-1">
                          Principal
                        </span>
                      )}

                      <p className="font-bold text-xs text-gray-900">
                        {end.rua}, {end.numero} {end.complemento && ` - ${end.complemento}`}
                      </p>
                      <p className="text-xs text-gray-600">
                        {end.bairro} — {end.cidade} / {end.uf}
                      </p>
                      <p className="text-xs font-mono text-gray-500">CEP: {end.cep}</p>

                      <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                        {!end.principal && (
                          <button
                            type="button"
                            onClick={() => marcarEnderecoPrincipal(end.id)}
                            className="text-[11px] font-bold text-pg-petrol hover:underline"
                          >
                            Marcar como principal
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removerEndereco(end.id)}
                          className="text-[11px] font-bold text-pg-red hover:underline flex items-center space-x-1 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEUS PEDIDOS */}
          {activeTab === 'pedidos' && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-3">
                <h2 className="font-pg-display text-lg font-bold italic uppercase text-pg-ink">
                  HISTÓRICO DE PEDIDOS
                </h2>
                <p className="text-xs text-gray-500">
                  Acompanhe em tempo real o status, código de rastreamento e Nota Fiscal Eletrônica (NF-e) dos seus pedidos na PENTAGOL.
                </p>
              </div>

              {meusPedidos.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <Package className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-500 font-bold">
                    Você ainda não realizou nenhum pedido em nossa loja.
                  </p>
                  <Link
                    to="/"
                    className="inline-block bg-pg-petrol text-white font-pg-display text-xs font-bold uppercase px-4 py-2"
                  >
                    Ir para as Compras
                  </Link>
                </div>
              ) : (
                <div className="border border-gray-200 divide-y divide-gray-200">
                  {meusPedidos.map((ped) => (
                    <div
                      key={ped.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-pg-display font-bold text-sm text-gray-900">
                            PEDIDO #{ped.numero}
                          </span>
                          {renderStatusBadge(ped.status)}
                        </div>
                        <p className="text-gray-500 font-mono text-[11px]">
                          Data: {new Date(ped.criadoEm).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(ped.criadoEm).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-gray-600 font-medium">
                          {ped.itens.length} item(ns) — Total:{' '}
                          <span className="font-body font-bold text-pg-red">
                            R$ {ped.total.toFixed(2).replace('.', ',')}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <Link
                          to={`/pedido/${ped.numero}`}
                          className="bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display text-xs font-bold uppercase px-4 py-2 shadow-xs"
                        >
                          Ver Detalhes →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
