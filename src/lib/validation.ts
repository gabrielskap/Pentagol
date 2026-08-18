import { getAll } from './db';
import { Cliente } from '../types';
import { mascararCPF, mascararTelefone } from './format';

export { mascararCPF, mascararTelefone };

/**
 * Validate Brazilian CPF digits strictly
 */
export function validarCPF(cpf: string): boolean {
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11) return false;

  // Reject repeated sequences like '00000000000', '11111111111'
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(10), 10)) return false;

  return true;
}


/**
 * Validate full name (at least 2 words)
 */
export function validarNomeCompleto(nome: string): boolean {
  const partes = nome.trim().split(/\s+/);
  return partes.length >= 2 && partes.every((p) => p.length >= 2);
}

/**
 * Validate Email format
 */
export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Check if Email already exists in db
 */
export function emailExisteNoDb(email: string, clienteIdAtual?: string): boolean {
  const clientes = getAll<Cliente>('clientes');
  return clientes.some(
    (c) => c.email.toLowerCase() === email.trim().toLowerCase() && c.id !== clienteIdAtual
  );
}

/**
 * Check if CPF already exists in db
 */
export function cpfExisteNoDb(cpf: string, clienteIdAtual?: string): boolean {
  const limpo = cpf.replace(/\D/g, '');
  const clientes = getAll<Cliente>('clientes');
  return clientes.some(
    (c) => c.cpf.replace(/\D/g, '') === limpo && c.id !== clienteIdAtual
  );
}

/**
 * Calculate Password Strength score (0 to 4)
 */
export function calcularForcaSenha(senha: string): {
  score: number;
  label: string;
  cor: string;
} {
  if (!senha) return { score: 0, label: 'Fraca', cor: 'bg-gray-200' };

  let score = 0;
  if (senha.length >= 4) score += 1;
  if (senha.length >= 8) score += 1;
  if (/\d/.test(senha)) score += 1;
  if (/[A-Z]/.test(senha) || /[^A-Za-z0-9]/.test(senha)) score += 1;

  if (score <= 1) return { score: 1, label: 'Fraca', cor: 'bg-pg-red' };
  if (score === 2) return { score: 2, label: 'Média', cor: 'bg-pg-yellow' };
  if (score === 3) return { score: 3, label: 'Boa', cor: 'bg-emerald-500' };
  return { score: 4, label: 'Forte', cor: 'bg-emerald-600' };
}
