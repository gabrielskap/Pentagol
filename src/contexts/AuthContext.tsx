import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAll, upsert } from '../lib/db';
import { Cliente, Endereco } from '../types';

export interface TokenRecuperacao {
  id: string;
  clienteId: string;
  email: string;
  token: string;
  expiraEm: string;
  usado: boolean;
  criadoEm: string;
}

interface AuthContextData {
  cliente: Cliente | null;
  logado: boolean;
  login: (email: string, senhaPlana: string) => Promise<boolean>;
  logout: () => void;
  cadastrar: (dados: Omit<Cliente, 'id' | 'senhaHash' | 'criadoEm'>, senhaPlana: string) => Promise<Cliente>;
  atualizarDadosPessoais: (nomeCompleto: string, telefone: string, novaSenhaPlana?: string) => Promise<void>;
  adicionarEndereco: (endereco: Omit<Endereco, 'id'>) => Promise<void>;
  removerEndereco: (enderecoId: string) => Promise<void>;
  marcarEnderecoPrincipal: (enderecoId: string) => Promise<void>;
  solicitarRecuperacaoSenha: (email: string) => Promise<{ sucesso: boolean; mensagem: string; tokenLink?: string }>;
  redefinirSenhaComToken: (token: string, novaSenhaPlana: string) => Promise<{ sucesso: boolean; mensagem: string }>;
}

const AUTH_STORAGE_KEY = 'pentagol_cliente_session_id';

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cliente, setCliente] = useState<Cliente | null>(() => {
    const savedId = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!savedId) return null;
    const clientes = getAll<Cliente>('clientes');
    return clientes.find((c) => c.id === savedId) || null;
  });

  useEffect(() => {
    const handleDbUpdated = () => {
      if (cliente) {
        const clientes = getAll<Cliente>('clientes');
        const updated = clientes.find((c) => c.id === cliente.id);
        if (updated) {
          setCliente(updated);
        }
      }
    };
    window.addEventListener('pentagol:db-updated', handleDbUpdated);
    return () => {
      window.removeEventListener('pentagol:db-updated', handleDbUpdated);
    };
  }, [cliente]);

  const login = async (email: string, senhaPlana: string): Promise<boolean> => {
    const clientes = getAll<Cliente>('clientes');
    const hash = btoa(senhaPlana);
    const encontrado = clientes.find(
      (c) => c.email.toLowerCase() === email.trim().toLowerCase() && c.senhaHash === hash
    );
    if (encontrado) {
      setCliente(encontrado);
      localStorage.setItem(AUTH_STORAGE_KEY, encontrado.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCliente(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const cadastrar = async (
    dados: Omit<Cliente, 'id' | 'senhaHash' | 'criadoEm'>,
    senhaPlana: string
  ): Promise<Cliente> => {
    const clientes = getAll<Cliente>('clientes');
    if (clientes.some((c) => c.email.toLowerCase() === dados.email.toLowerCase())) {
      throw new Error('E-mail já cadastrado');
    }

    const novoCliente: Cliente = {
      ...dados,
      id: `cli-${Date.now()}`,
      senhaHash: btoa(senhaPlana),
      criadoEm: new Date().toISOString(),
    };

    upsert('clientes', novoCliente);
    setCliente(novoCliente);
    localStorage.setItem(AUTH_STORAGE_KEY, novoCliente.id);
    return novoCliente;
  };

  const atualizarDadosPessoais = async (
    nomeCompleto: string,
    telefone: string,
    novaSenhaPlana?: string
  ): Promise<void> => {
    if (!cliente) return;

    const clienteAtualizado: Cliente = {
      ...cliente,
      nomeCompleto,
      telefone,
      senhaHash: novaSenhaPlana ? btoa(novaSenhaPlana) : cliente.senhaHash,
    };

    upsert('clientes', clienteAtualizado);
    setCliente(clienteAtualizado);
  };

  const adicionarEndereco = async (endereco: Omit<Endereco, 'id'>): Promise<void> => {
    if (!cliente) return;
    const novoEnd: Endereco = {
      ...endereco,
      id: `end-${Date.now()}`,
    };
    const atualizados = [...cliente.enderecos];
    if (novoEnd.principal) {
      atualizados.forEach((e) => (e.principal = false));
    }
    atualizados.push(novoEnd);

    const clienteAtualizado: Cliente = {
      ...cliente,
      enderecos: atualizados,
    };

    upsert('clientes', clienteAtualizado);
    setCliente(clienteAtualizado);
  };

  const removerEndereco = async (enderecoId: string): Promise<void> => {
    if (!cliente) return;
    const atualizados = cliente.enderecos.filter((e) => e.id !== enderecoId);
    if (atualizados.length > 0 && !atualizados.some((e) => e.principal)) {
      atualizados[0].principal = true;
    }
    const clienteAtualizado: Cliente = {
      ...cliente,
      enderecos: atualizados,
    };
    upsert('clientes', clienteAtualizado);
    setCliente(clienteAtualizado);
  };

  const marcarEnderecoPrincipal = async (enderecoId: string): Promise<void> => {
    if (!cliente) return;
    const atualizados = cliente.enderecos.map((e) => ({
      ...e,
      principal: e.id === enderecoId,
    }));
    const clienteAtualizado: Cliente = {
      ...cliente,
      enderecos: atualizados,
    };
    upsert('clientes', clienteAtualizado);
    setCliente(clienteAtualizado);
  };

  // Password recovery token generation
  const solicitarRecuperacaoSenha = async (
    email: string
  ): Promise<{ sucesso: boolean; mensagem: string; tokenLink?: string }> => {
    const clientes = getAll<Cliente>('clientes');
    const encontrado = clientes.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());

    if (!encontrado) {
      return {
        sucesso: true,
        mensagem: 'Se o e-mail informado estiver cadastrado, enviamos as instruções de redefinição.',
      };
    }

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiraEm = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const tokenObj: TokenRecuperacao = {
      id: `tok-${Date.now()}`,
      clienteId: encontrado.id,
      email: encontrado.email,
      token,
      expiraEm,
      usado: false,
      criadoEm: new Date().toISOString(),
    };

    upsert('tokens_recuperacao' as any, tokenObj);

    /* 
      TODO: Contrato do endpoint real de envio de e-mail transacional
      POST /api/auth/recuperar-senha
      Body: { email: encontrado.email, token: token, expiraEm: expiraEm }
      Response: 200 OK { enviado: true }
    */

    const tokenLink = `${window.location.origin}/#/redefinir-senha?token=${token}`;

    return {
      sucesso: true,
      mensagem: 'Instruções de redefinição geradas com sucesso.',
      tokenLink,
    };
  };

  // Password reset via token
  const redefinirSenhaComToken = async (
    token: string,
    novaSenhaPlana: string
  ): Promise<{ sucesso: boolean; mensagem: string }> => {
    const tokens = getAll<TokenRecuperacao>('tokens_recuperacao' as any);
    const tokenObj = tokens.find((t) => t.token === token);

    if (!tokenObj) {
      return { sucesso: false, mensagem: 'Link de redefinição inválido.' };
    }

    if (tokenObj.usado) {
      return { sucesso: false, mensagem: 'Este link de redefinição já foi utilizado.' };
    }

    if (new Date(tokenObj.expiraEm) < new Date()) {
      return { sucesso: false, mensagem: 'Este link de redefinição expirou (30 minutos).' };
    }

    const clientes = getAll<Cliente>('clientes');
    const clienteEncontrado = clientes.find((c) => c.id === tokenObj.clienteId);

    if (!clienteEncontrado) {
      return { sucesso: false, mensagem: 'Cliente não encontrado.' };
    }

    const clienteAtualizado: Cliente = {
      ...clienteEncontrado,
      senhaHash: btoa(novaSenhaPlana),
    };

    upsert('clientes', clienteAtualizado);

    tokens.forEach((t) => {
      if (t.clienteId === clienteEncontrado.id) {
        upsert('tokens_recuperacao' as any, { ...t, usado: true });
      }
    });

    if (cliente && cliente.id === clienteEncontrado.id) {
      setCliente(clienteAtualizado);
    }

    return {
      sucesso: true,
      mensagem: 'Sua senha foi redefinida com sucesso! Você já pode fazer login com a nova senha.',
    };
  };

  return (
    <AuthContext.Provider
      value={{
        cliente,
        logado: !!cliente,
        login,
        logout,
        cadastrar,
        atualizarDadosPessoais,
        adicionarEndereco,
        removerEndereco,
        marcarEnderecoPrincipal,
        solicitarRecuperacaoSenha,
        redefinirSenhaComToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
