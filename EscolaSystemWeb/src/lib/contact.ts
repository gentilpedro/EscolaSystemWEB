// Telefone e e-mail com as mesmas regras da API (SchoolRules / BrazilianPhone)

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s.]{2,}$/;

export const digitsOnly = (value: string) => value.replace(/\D/g, '');

/** Máscara enquanto digita: (51) 3333-1200 ou (51) 99999-1200. */
export function maskPhone(value: string): string {
  const d = digitsOnly(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const ddd = `(${d.slice(0, 2)}) `;
  const rest = d.slice(2);
  // Com 11 dígitos é celular (5 + 4); até 10, fixo (4 + 4)
  const split = d.length === 11 ? 5 : 4;
  return rest.length <= split ? ddd + rest : `${ddd}${rest.slice(0, split)}-${rest.slice(split)}`;
}

/** DDD de 11 a 99 + 8 dígitos (fixo) ou 9 começando com 9 (celular). */
export function isValidPhone(value: string): boolean {
  const d = digitsOnly(value);
  if (d.length !== 10 && d.length !== 11) return false;
  if (d[0] === '0') return false;
  return d.length === 10 || d[2] === '9';
}

export const isValidEmail = (value: string) => EMAIL.test(value.trim());

export function phoneError(value: string): string | undefined {
  if (value.trim() === '') return undefined;
  return isValidPhone(value) ? undefined : 'Use DDD e número, ex.: (51) 3333-1200 ou (51) 99999-1200.';
}

export function emailError(value: string): string | undefined {
  if (value.trim() === '') return undefined;
  return isValidEmail(value) ? undefined : 'Use o formato nome@dominio.com.br.';
}

export function minLengthError(value: string, min: number, what: string): string | undefined {
  const v = value.trim();
  return v !== '' && v.length < min ? `${what} precisa ter ao menos ${min} caracteres.` : undefined;
}
