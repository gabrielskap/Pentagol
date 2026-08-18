import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { calcularForcaSenha } from '../../lib/validation';

export const RedefinirSenhaPage: React.FC = () => {
  const { redefinirSenhaComToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const forca = calcularForcaSenha(novaSenha);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!token) {
      setErro('Token de redefinição ausente na URL.');
      return;
    }

    if (!novaSenha || novaSenha.length < 4) {
      setErro('A nova senha deve conter no mínimo 4 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setEnviando(true);
    try {
      const res = await redefinirSenhaComToken(token, novaSenha);
      if (res.sucesso) {
        setSucesso(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setErro(res.mensagem);
      }
    } catch {
      setErro('Erro ao redefinir a senha. O token pode ser inválido ou já ter expirado.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 font-body select-none">
      <div className="bg-white border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* HEADER */}
        <div className="border-b border-gray-200 pb-4 text-center space-y-1">
          <div className="w-12 h-12 bg-red-50 text-pg-red rounded-full flex items-center justify-center mx-auto mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="font-pg-display text-xl font-bold italic uppercase text-pg-ink">
            REDEFINIR SUA SENHA
          </h1>
          <p className="text-xs text-gray-500">
            Crie uma nova senha segura para acessar sua conta PENTAGOL Esportes.
          </p>
        </div>

        {sucesso ? (
          <div className="bg-emerald-50 border border-emerald-300 p-4 text-xs text-emerald-800 space-y-3 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="font-bold text-sm">Senha Redefinida com Sucesso!</p>
            <p className="text-gray-600">
              Você será redirecionado para a tela de login em alguns segundos...
            </p>
            <Link
              to="/login"
              className="inline-block bg-pg-petrol text-white font-pg-display text-xs font-bold uppercase px-4 py-2"
            >
              Ir para o Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <div className="bg-red-50 border border-pg-red p-3 text-xs text-pg-red font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <div>
              <label htmlFor="red-senha" className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                Nova Senha <span className="text-pg-red">*</span>
              </label>
              <div className="relative">
                <input
                  id="red-senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  placeholder="Mínimo de 4 caracteres"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
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

              {novaSenha.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold">
                    <span>Força da Senha:</span>
                    <span className="uppercase">{forca.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${forca.cor}`}
                      style={{ width: `${(forca.score / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="red-conf" className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                Confirmar Nova Senha <span className="text-pg-red">*</span>
              </label>
              <input
                id="red-conf"
                type={mostrarSenha ? 'text' : 'password'}
                required
                placeholder="Repita a nova senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:border-pg-red"
              />
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-xs font-bold uppercase py-3 px-6 shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{enviando ? 'SALVANDO...' : 'REDEFINIR SENHA'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
