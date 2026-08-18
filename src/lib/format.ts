/**
 * Formatação centralizada para a loja Pentagol (pt-BR)
 */

/**
 * Formata um número para moeda BRL (R$) utilizando Intl.NumberFormat
 */
export function formatarMoeda(valor: number): string {
  if (isNaN(valor)) valor = 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Formata data ISO ou objeto Date para padrão pt-BR (dd/mm/aaaa ou dd/mm/aaaa hh:mm)
 */
export function formatarData(data: string | Date | undefined, incluirHora = true): string {
  if (!data) return '—';
  const d = typeof data === 'string' ? new Date(data) : data;
  if (isNaN(d.getTime())) return '—';

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();

  if (!incluirHora) {
    return `${dia}/${mes}/${ano}`;
  }

  const hora = String(d.getHours()).padStart(2, '0');
  const minuto = String(d.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
}

/**
 * Máscara para CPF: 000.000.000-00
 */
export function mascararCPF(valor: string): string {
  let v = valor.replace(/\D/g, '');
  if (v.length > 11) v = v.substring(0, 11);
  return v
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Máscara para CNPJ: 00.000.000/0001-00
 */
export function mascararCNPJ(valor: string): string {
  let v = valor.replace(/\D/g, '');
  if (v.length > 14) v = v.substring(0, 14);
  return v
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/**
 * Máscara para CEP: 00000-000
 */
export function mascararCEP(valor: string): string {
  let v = valor.replace(/\D/g, '');
  if (v.length > 8) v = v.substring(0, 8);
  return v.replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Máscara para Telefone / Celular: (00) 00000-0000 ou (00) 0000-0000
 */
export function mascararTelefone(valor: string): string {
  let v = valor.replace(/\D/g, '');
  if (v.length > 11) v = v.substring(0, 11);
  if (v.length <= 10) {
    return v
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return v
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}
