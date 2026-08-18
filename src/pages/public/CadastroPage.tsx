import React, { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Check, Eye, EyeOff, Lock, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  calcularForcaSenha,
  cpfExisteNoDb,
  emailExisteNoDb,
  mascararCPF,
  mascararTelefone,
  validarCPF,
  validarEmail,
  validarNomeCompleto,
} from '../../lib/validation';

export const CadastroPage: React.FC = () => {
  const { cadastrar } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/minha-conta';

  // Form Fields State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [aceitaTermos, setAceitaTermos] = useState(false);

  // UI state
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  // Field Errors State
  const [erros, setErros] = useState<{
    nome?: string;
    email?: string;
    cpf?: string;
    telefone?: string;
    senha?: string;
    confirmarSenha?: string;
    aceitaTermos?: string;
  }>({});

  // Field Refs for auto-focusing on first error
  const nomeRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const cpfRef = useRef<HTMLInputElement>(null);
  const telefoneRef = useRef<HTMLInputElement>(null);
  const senhaRef = useRef<HTMLInputElement>(null);
  const confirmarSenhaRef = useRef<HTMLInputElement>(null);
  const aceitaTermosRef = useRef<HTMLInputElement>(null);

  // Password strength
  const forcaSenha = calcularForcaSenha(senha);

  // Individual Field Validation Handlers
  const validarCampo = (campo: string) => {
    const novosErros = { ...erros };

    if (campo === 'nome') {
      if (!nome.trim()) {
        novosErros.nome = 'O nome completo é obrigatório.';
      } else if (!validarNomeCompleto(nome)) {
        novosErros.nome = 'Digite seu nome e sobrenome completo (mínimo de 2 palavras).';
      } else {
        delete novosErros.nome;
      }
    }

    if (campo === 'email') {
      if (!email.trim()) {
        novosErros.email = 'O e-mail é obrigatório.';
      } else if (!validarEmail(email)) {
        novosErros.email = 'Informe um endereço de e-mail válido.';
      } else if (emailExisteNoDb(email)) {
        novosErros.email = 'EXISTS_EMAIL';
      } else {
        delete novosErros.email;
      }
    }

    if (campo === 'cpf') {
      if (!cpf.trim()) {
        novosErros.cpf = 'O CPF é obrigatório.';
      } else if (!validarCPF(cpf)) {
        novosErros.cpf = 'CPF inválido. Verifique os dígitos digitados.';
      } else if (cpfExisteNoDb(cpf)) {
        novosErros.cpf = 'Este CPF já está cadastrado em nossa loja.';
      } else {
        delete novosErros.cpf;
      }
    }

    if (campo === 'telefone') {
      const cleanPhone = telefone.replace(/\D/g, '');
      if (!cleanPhone) {
        novosErros.telefone = 'O telefone é obrigatório.';
      } else if (cleanPhone.length < 10) {
        novosErros.telefone = 'Informe um número de telefone/WhatsApp válido com DDD.';
      } else {
        delete novosErros.telefone;
      }
    }

    if (campo === 'senha') {
      if (!senha) {
        novosErros.senha = 'A senha é obrigatória.';
      } else if (senha.length < 4) {
        novosErros.senha = 'A senha deve conter no mínimo 4 caracteres.';
      } else {
        delete novosErros.senha;
      }
      if (confirmarSenha && senha !== confirmarSenha) {
        novosErros.confirmarSenha = 'As senhas não coincidem.';
      } else if (confirmarSenha) {
        delete novosErros.confirmarSenha;
      }
    }

    if (campo === 'confirmarSenha') {
      if (!confirmarSenha) {
        novosErros.confirmarSenha = 'A confirmação de senha é obrigatória.';
      } else if (senha !== confirmarSenha) {
        novosErros.confirmarSenha = 'As senhas não coincidem.';
      } else {
        delete novosErros.confirmarSenha;
      }
    }

    if (campo === 'aceitaTermos') {
      if (!aceitaTermos) {
        novosErros.aceitaTermos = 'Você deve aceitar a Política de Privacidade para criar sua conta.';
      } else {
        delete novosErros.aceitaTermos;
      }
    }

    setErros(novosErros);
    return novosErros;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroGeral(null);

    // Validate all fields
    const errs: typeof erros = {};

    if (!nome.trim() || !validarNomeCompleto(nome)) {
      errs.nome = !nome.trim()
        ? 'O nome completo é obrigatório.'
        : 'Digite seu nome e sobrenome completo (mínimo de 2 palavras).';
    }

    if (!email.trim() || !validarEmail(email)) {
      errs.email = !email.trim() ? 'O e-mail é obrigatório.' : 'Informe um e-mail válido.';
    } else if (emailExisteNoDb(email)) {
      errs.email = 'EXISTS_EMAIL';
    }

    if (!cpf.trim() || !validarCPF(cpf)) {
      errs.cpf = !cpf.trim() ? 'O CPF é obrigatório.' : 'CPF inválido. Verifique os dígitos.';
    } else if (cpfExisteNoDb(cpf)) {
      errs.cpf = 'Este CPF já está cadastrado em nossa loja.';
    }

    const cleanPhone = telefone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.telefone = 'Informe um telefone com DDD válido.';
    }

    if (!senha || senha.length < 4) {
      errs.senha = 'A senha deve conter no mínimo 4 caracteres.';
    }

    if (!confirmarSenha || senha !== confirmarSenha) {
      errs.confirmarSenha = 'As senhas não coincidem.';
    }

    if (!aceitaTermos) {
      errs.aceitaTermos = 'Você deve aceitar a Política de Privacidade para criar sua conta.';
    }

    setErros(errs);

    // Auto-focus on first field with error
    if (Object.keys(errs).length > 0) {
      if (errs.nome && nomeRef.current) nomeRef.current.focus();
      else if (errs.email && emailRef.current) emailRef.current.focus();
      else if (errs.cpf && cpfRef.current) cpfRef.current.focus();
      else if (errs.telefone && telefoneRef.current) telefoneRef.current.focus();
      else if (errs.senha && senhaRef.current) senhaRef.current.focus();
      else if (errs.confirmarSenha && confirmarSenhaRef.current)
        confirmarSenhaRef.current.focus();
      else if (errs.aceitaTermos && aceitaTermosRef.current) aceitaTermosRef.current.focus();
      return;
    }

    setEnviando(true);
    try {
      await cadastrar(
        {
          nomeCompleto: nome,
          email,
          cpf,
          telefone,
          enderecos: [],
        },
        senha
      );

      navigate(returnTo);
    } catch (err: any) {
      setErroGeral(err.message || 'Erro ao efetuar cadastro. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 font-body select-none">
      <div className="bg-white border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* HEADER */}
        <div className="border-b border-gray-200 pb-4 text-center space-y-1">
          <h1 className="font-pg-display text-2xl font-bold italic uppercase text-pg-ink">
            CRIAR MINHA CONTA PENTAGOL
          </h1>
          <p className="text-xs text-gray-500">
            Cadastre-se para acompanhar seus pedidos e finalizar suas compras rapidamente.
          </p>
        </div>

        {erroGeral && (
          <div className="bg-red-50 border border-pg-red p-3 text-xs text-pg-red font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erroGeral}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* NOME COMPLETO */}
          <div>
            <label htmlFor="cad-nome" className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
              Nome Completo <span className="text-pg-red">*</span>
            </label>
            <input
              id="cad-nome"
              ref={nomeRef}
              type="text"
              placeholder="Ex.: João da Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onBlur={() => validarCampo('nome')}
              className={`w-full bg-gray-50 border px-3 py-2 text-xs focus:outline-none ${
                erros.nome ? 'border-pg-red bg-red-50/30' : 'border-gray-300 focus:border-pg-red'
              }`}
            />
            {erros.nome && <p className="text-[11px] text-pg-red font-bold mt-1">{erros.nome}</p>}
          </div>

          {/* E-MAIL */}
          <div>
            <label htmlFor="cad-email" className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
              E-mail <span className="text-pg-red">*</span>
            </label>
            <input
              id="cad-email"
              ref={emailRef}
              type="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => validarCampo('email')}
              className={`w-full bg-gray-50 border px-3 py-2 text-xs font-mono focus:outline-none ${
                erros.email ? 'border-pg-red bg-red-50/30' : 'border-gray-300 focus:border-pg-red'
              }`}
            />
            {erros.email === 'EXISTS_EMAIL' ? (
              <p className="text-[11px] text-pg-red font-bold mt-1 flex items-center space-x-1">
                <span>Este e-mail já possui conta.</span>
                <Link to={`/login?email=${encodeURIComponent(email)}`} className="underline font-bold text-pg-petrol hover:text-pg-red">
                  Entrar?
                </Link>
              </p>
            ) : erros.email ? (
              <p className="text-[11px] text-pg-red font-bold mt-1">{erros.email}</p>
            ) : null}
          </div>

          {/* CPF & TELEFONE GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CPF */}
            <div>
              <label htmlFor="cad-cpf" className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                CPF <span className="text-pg-red">*</span>
              </label>
              <input
                id="cad-cpf"
                ref={cpfRef}
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(mascararCPF(e.target.value))}
                onBlur={() => validarCampo('cpf')}
                maxLength={14}
                className={`w-full bg-gray-50 border px-3 py-2 text-xs font-mono focus:outline-none ${
                  erros.cpf ? 'border-pg-red bg-red-50/30' : 'border-gray-300 focus:border-pg-red'
                }`}
              />
              {erros.cpf && <p className="text-[11px] text-pg-red font-bold mt-1">{erros.cpf}</p>}
            </div>

            {/* TELEFONE */}
            <div>
              <label htmlFor="cad-telefone" className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                Telefone / WhatsApp <span className="text-pg-red">*</span>
              </label>
              <input
                id="cad-telefone"
                ref={telefoneRef}
                type="text"
                placeholder="(31) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
                onBlur={() => validarCampo('telefone')}
                maxLength={15}
                className={`w-full bg-gray-50 border px-3 py-2 text-xs font-mono focus:outline-none ${
                  erros.telefone
                    ? 'border-pg-red bg-red-50/30'
                    : 'border-gray-300 focus:border-pg-red'
                }`}
              />
              {erros.telefone && (
                <p className="text-[11px] text-pg-red font-bold mt-1">{erros.telefone}</p>
              )}
            </div>
          </div>

          {/* SENHA & CONFIRMAÇÃO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SENHA */}
            <div>
              <label htmlFor="cad-senha" className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                Senha <span className="text-pg-red">*</span>
              </label>
              <div className="relative">
                <input
                  id="cad-senha"
                  ref={senhaRef}
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Mínimo 4 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onBlur={() => validarCampo('senha')}
                  className={`w-full bg-gray-50 border pr-10 px-3 py-2 text-xs focus:outline-none ${
                    erros.senha ? 'border-pg-red bg-red-50/30' : 'border-gray-300 focus:border-pg-red'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* STRENGTH METER */}
              {senha.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold">
                    <span>Força da Senha:</span>
                    <span className="uppercase">{forcaSenha.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${forcaSenha.cor}`}
                      style={{ width: `${(forcaSenha.score / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="text-[10px] text-gray-400 mt-1 italic">
                Recomendação: Use ao menos 8 caracteres com números.
              </p>

              {erros.senha && <p className="text-[11px] text-pg-red font-bold mt-1">{erros.senha}</p>}
            </div>

            {/* CONFIRMAR SENHA */}
            <div>
              <label htmlFor="cad-confsenha" className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                Confirmar Senha <span className="text-pg-red">*</span>
              </label>
              <input
                id="cad-confsenha"
                ref={confirmarSenhaRef}
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="Repita sua senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                onBlur={() => validarCampo('confirmarSenha')}
                className={`w-full bg-gray-50 border px-3 py-2 text-xs focus:outline-none ${
                  erros.confirmarSenha
                    ? 'border-pg-red bg-red-50/30'
                    : 'border-gray-300 focus:border-pg-red'
                }`}
              />
              {erros.confirmarSenha && (
                <p className="text-[11px] text-pg-red font-bold mt-1">{erros.confirmarSenha}</p>
              )}
            </div>
          </div>

          {/* ACEITE DE POLÍTICA DE PRIVACIDADE */}
          <div className="pt-2">
            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                ref={aceitaTermosRef}
                type="checkbox"
                checked={aceitaTermos}
                onChange={(e) => {
                  setAceitaTermos(e.target.checked);
                  if (e.target.checked && erros.aceitaTermos) {
                    setErros((prev) => ({ ...prev, aceitaTermos: undefined }));
                  }
                }}
                className="mt-0.5 text-pg-red focus:ring-pg-red"
              />
              <span className="text-xs text-gray-600 leading-tight">
                Li e aceito a{' '}
                <Link
                  to="/institucional/politica-de-privacidade"
                  target="_blank"
                  className="text-pg-petrol font-bold underline hover:text-pg-red"
                >
                  Política de Privacidade e Termos de Uso
                </Link>{' '}
                da PENTAGOL Esportes.
              </span>
            </label>
            {erros.aceitaTermos && (
              <p className="text-[11px] text-pg-red font-bold mt-1">{erros.aceitaTermos}</p>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-sm font-bold uppercase py-3.5 px-6 shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <UserCheck className="w-5 h-5" />
              <span>{enviando ? 'CRIANDO CONTA...' : 'CRIAR MINHA CONTA'}</span>
            </button>

            <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
              Já possui uma conta?{' '}
              <Link
                to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
                className="font-pg-display text-xs font-bold uppercase text-pg-petrol hover:text-pg-red underline"
              >
                Fazer Login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
