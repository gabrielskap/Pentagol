import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAll } from '../lib/db';
import { UsuarioAdmin } from '../types';

interface LoginResult {
  sucesso: boolean;
  mensagem: string;
}

interface AdminContextData {
  usuarioAdmin: UsuarioAdmin | null;
  logado: boolean;
  isAdmin: boolean;
  isOperador: boolean;
  loginAdmin: (email: string, senhaPlana: string) => Promise<LoginResult>;
  logoutAdmin: () => void;
}

const ADMIN_STORAGE_KEY = 'pentagol_admin_session_id';

const AdminContext = createContext<AdminContextData>({} as AdminContextData);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuarioAdmin, setUsuarioAdmin] = useState<UsuarioAdmin | null>(() => {
    const savedId = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!savedId) return null;
    const admins = getAll<UsuarioAdmin>('admins');
    return admins.find((a) => a.id === savedId && a.ativo) || null;
  });

  useEffect(() => {
    const handleDbUpdated = () => {
      if (usuarioAdmin) {
        const admins = getAll<UsuarioAdmin>('admins');
        const updated = admins.find((a) => a.id === usuarioAdmin.id);
        if (updated) {
          setUsuarioAdmin(updated);
        }
      }
    };
    window.addEventListener('pentagol:db-updated', handleDbUpdated);
    return () => {
      window.removeEventListener('pentagol:db-updated', handleDbUpdated);
    };
  }, [usuarioAdmin]);

  const loginAdmin = async (email: string, senhaPlana: string): Promise<LoginResult> => {
    const admins = getAll<UsuarioAdmin>('admins');
    const hashInput = btoa(senhaPlana);

    // Aceita 'senha demo', 'admin123', 'operador123', '123456' ou hash exato do banco
    const eDemoSenha = ['senha demo', 'admin123', 'operador123', '123456', 'demo'].includes(
      senhaPlana.toLowerCase().trim()
    );

    const encontrado = admins.find((a) => {
      if (a.email.toLowerCase() !== email.toLowerCase().trim()) return false;
      if (!a.ativo) return false;
      return a.senhaHash === hashInput || eDemoSenha;
    });

    if (encontrado) {
      setUsuarioAdmin(encontrado);
      localStorage.setItem(ADMIN_STORAGE_KEY, encontrado.id);
      return { sucesso: true, mensagem: 'Login realizado com sucesso' };
    }

    return {
      sucesso: false,
      mensagem: 'Credenciais inválidas. Verifique o e-mail e a senha informados.',
    };
  };

  const logoutAdmin = () => {
    setUsuarioAdmin(null);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  return (
    <AdminContext.Provider
      value={{
        usuarioAdmin,
        logado: !!usuarioAdmin,
        isAdmin: usuarioAdmin?.perfil === 'admin',
        isOperador: usuarioAdmin?.perfil === 'operador',
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
