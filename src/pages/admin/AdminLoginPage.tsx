import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldAlert } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import PentagolLogo from '../../components/PentagolLogo';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@pentagol.com.br');
  const [senha, setSenha] = useState('123456');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const { loginAdmin } = useAdmin();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const res = await loginAdmin(email, senha);
      if (res.sucesso) {
        navigate('/admin');
      } else {
        setErro(res.mensagem);
      }
    } catch (err: any) {
      setErro('Erro no login do painel administrativo.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-body">
      <div className="w-full max-w-md bg-white border border-gray-300 p-8 shadow-xl space-y-6">
        
        <div className="text-center border-b border-gray-200 pb-4">
          <h1 className="flex justify-center">
            <PentagolLogo priority className="h-20 w-auto" />
          </h1>
          <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mt-3">
            PAINEL ADMINISTRATIVO ERP & E-COMMERCE
          </p>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-300 text-pg-red text-xs p-3 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">E-mail Administrativo</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 pl-9 pr-3 py-2 focus:outline-none focus:border-pg-red font-body"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Senha de Acesso</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full border border-gray-300 pl-9 pr-3 py-2 focus:outline-none focus:border-pg-red font-body"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-base py-2.5 shadow transition-colors"
          >
            {carregando ? 'AUTENTICANDO...' : 'ACESSAR PAINEL ADMIN'}
          </button>
        </form>

        <div className="bg-gray-100 p-3.5 border border-gray-300 text-[11px] text-gray-700 space-y-2">
          <p className="font-bold uppercase text-gray-900 border-b pb-1">Credenciais Demo (Seed):</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@pentagol.com.br');
                setSenha('senha demo');
              }}
              className="flex-1 bg-white hover:bg-gray-200 border border-gray-300 p-2 text-left transition-colors"
            >
              <span className="font-bold block text-pg-red">Perfil Administrador</span>
              <span className="text-[10px] text-gray-500 block">admin@pentagol.com.br</span>
              <span className="text-[10px] font-mono font-bold text-gray-800">Senha: senha demo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('operador@pentagol.com.br');
                setSenha('senha demo');
              }}
              className="flex-1 bg-white hover:bg-gray-200 border border-gray-300 p-2 text-left transition-colors"
            >
              <span className="font-bold block text-pg-petrol">Perfil Operador</span>
              <span className="text-[10px] text-gray-500 block">operador@pentagol.com.br</span>
              <span className="text-[10px] font-mono font-bold text-gray-800">Senha: senha demo</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
