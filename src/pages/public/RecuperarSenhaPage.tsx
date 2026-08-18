import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, KeyRound, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const RecuperarSenhaPage: React.FC = () => {
  const { solicitarRecuperacaoSenha } = useAuth();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{
    sucesso: boolean;
    mensagem: string;
    tokenLink?: string;
  } | null>(null);

  /*
    ===========================================================================
    TODO: CONTRATO DO ENDPOINT REAL DE ENVIO DE E-MAIL TRANSACIONAL
    ===========================================================================
    Para ambiente de produção com servidor Backend Node/Express/SendGrid:

    Endpoint: POST /api/auth/recuperar-senha
    Headers: { "Content-Type": "application/json" }
    Body: {
      "email": "cliente@exemplo.com"
    }
    Response 200 OK: {
      "sucesso": true,
      "mensagem": "E-mail de redefinição enviado com sucesso para o cliente."
    }
    ===========================================================================
  */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setEnviando(true);
    try {
      const res = await solicitarRecuperacaoSenha(email);
      setResultado(res);
    } catch {
      setResultado({
        sucesso: false,
        mensagem: 'Ocorreu um erro ao processar a solicitação. Tente novamente.',
      });
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
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="font-pg-display text-xl font-bold italic uppercase text-pg-ink">
            RECUPERAR MINHA SENHA
          </h1>
          <p className="text-xs text-gray-500">
            Informe o e-mail cadastrado em sua conta para gerarmos um link de redefinição com validade de 30 minutos.
          </p>
        </div>

        {resultado?.sucesso ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-300 p-4 text-xs text-emerald-800 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Link de Redefinição Gerado!</span>
              </div>
              <p>{resultado.mensagem}</p>
            </div>

            {/* SIMULATION PANEL FOR EMAIL LINK IN PROTOTYPE */}
            {resultado.tokenLink && (
              <div className="bg-gray-50 border-2 border-pg-petrol p-4 text-xs space-y-3">
                <p className="font-pg-display font-bold text-pg-petrol uppercase">
                  PAINEL DE SIMULAÇÃO DE E-MAIL TRANSACIONAL:
                </p>
                <p className="text-gray-600">
                  Como este é um protótipo, clique no botão abaixo para simular o recebimento do e-mail e redefinir sua senha:
                </p>
                <div className="p-2 bg-white border border-gray-300 font-mono text-[10px] truncate text-gray-700">
                  {resultado.tokenLink}
                </div>
                <a
                  href={resultado.tokenLink}
                  className="w-full bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display text-xs font-bold uppercase py-2.5 px-4 flex items-center justify-center space-x-2 transition-colors shadow-xs"
                >
                  <span>ABRIR LINK DE REDEFINIÇÃO</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs font-bold font-pg-display uppercase text-pg-red hover:underline">
                &larr; Voltar para a Tela de Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {resultado && !resultado.sucesso && (
              <div className="bg-red-50 border border-pg-red p-3 text-xs text-pg-red font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resultado.mensagem}</span>
              </div>
            )}

            <div>
              <label htmlFor="rec-email" className="font-pg-display text-xs font-bold uppercase text-gray-700 block mb-1">
                E-mail Cadastrado <span className="text-pg-red">*</span>
              </label>
              <div className="relative">
                <input
                  id="rec-email"
                  type="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 pl-9 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-pg-red"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-xs font-bold uppercase py-3 px-6 shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{enviando ? 'ENVIANDO...' : 'ENVIAR LINK DE RECUPERAÇÃO'}</span>
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-gray-500 hover:text-pg-red font-bold uppercase">
                Lembrei minha senha
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
