import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const emailParam = searchParams.get('email') || '';
  const returnTo = searchParams.get('returnTo') || '/minha-conta';

  const [email, setEmail] = useState(emailParam);
  const [senha, setSenha] = useState('');
  const [manterConectado, setManterConectado] = useState(true);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [erroLogin, setErroLogin] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroLogin(null);

    if (!email.trim() || !senha) {
      setErroLogin('E-mail ou senha inválidos');
      return;
    }

    setCarregando(true);
    try {
      const sucesso = await login(email, senha);
      if (sucesso) {
        navigate(returnTo);
      } else {
        // Generic error message requirement
        setErroLogin('E-mail ou senha inválidos');
      }
    } catch {
      setErroLogin('E-mail ou senha inválidos');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 font-body select-none">
      <div className="bg-white border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* HEADER */}
        <div className="border-b border-gray-200 pb-4 text-center space-y-1">
          <h1 className="font-pg-display text-2xl font-bold italic uppercase text-pg-ink">
            IDENTIFICAÇÃO DE CLIENTE
          </h1>
          <p className="text-xs text-gray-500">
            Acesse sua conta para visualizar pedidos ou prosseguir para o pagamento.
          </p>
        </div>

        {erroLogin && (
          <div className="bg-red-50 border border-pg-red p-3 text-xs text-pg-red font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erroLogin}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* E-MAIL */}
          <div>
            <label htmlFor="login-email" className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
              E-mail <span className="text-pg-red">*</span>
            </label>
            <input
              id="login-email"
              type="email"
              required
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 px-3 py-2 text-xs font-mono focus:outline-none focus:border-pg-red"
            />
          </div>

          {/* SENHA */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="login-senha" className="font-pg-display text-xs font-bold uppercase text-gray-700 block">
                Senha <span className="text-pg-red">*</span>
              </label>
              <Link
                to={`/recuperar-senha?email=${encodeURIComponent(email)}`}
                className="text-[11px] font-bold text-pg-petrol hover:text-pg-red underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-senha"
                type={mostrarSenha ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 pr-10 px-3 py-2 text-xs focus:outline-none focus:border-pg-red"
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

          {/* MANTER CONECTADO */}
          <div className="pt-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={manterConectado}
                onChange={(e) => setManterConectado(e.target.checked)}
                className="text-pg-red focus:ring-pg-red"
              />
              <span className="text-xs text-gray-600 font-medium">Manter conectado</span>
            </label>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-sm font-bold uppercase py-3.5 px-6 shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <LogIn className="w-5 h-5" />
            <span>{carregando ? 'ENTRANDO...' : 'ENTRAR NA MINHA CONTA'}</span>
          </button>
        </form>

        {/* CADASTRE-SE LINK */}
        <div className="border-t border-gray-100 pt-4 text-center space-y-2">
          <p className="text-xs text-gray-500">Ainda não possui uma conta na PENTAGOL?</p>
          <Link
            to={`/cadastro?returnTo=${encodeURIComponent(returnTo)}`}
            className="w-full bg-gray-100 hover:bg-pg-petrol hover:text-white text-gray-800 font-pg-display text-xs font-bold uppercase py-2.5 px-4 border border-gray-300 transition-colors flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Criar uma Nova Conta</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
