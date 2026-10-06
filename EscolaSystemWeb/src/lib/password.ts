// Mesma regra da API (PasswordRules.StrongPassword), para avisar antes de enviar

export const PASSWORD_RULE = 'Mínimo de 8 caracteres, com letra maiúscula, letra minúscula, número e símbolo.';

/** O que falta na senha, na ordem da regra; vazio quando ela é aceita. */
export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push('8 caracteres');
  if (password.length > 100) issues.push('no máximo 100 caracteres');
  if (!/[A-Z]/.test(password)) issues.push('uma letra maiúscula');
  if (!/[a-z]/.test(password)) issues.push('uma letra minúscula');
  if (!/[0-9]/.test(password)) issues.push('um número');
  if (!/[^a-zA-Z0-9]/.test(password)) issues.push('um símbolo');
  return issues;
}

/** Mensagem de erro do campo, ou undefined se a senha está vazia ou é válida. */
export function passwordError(password: string): string | undefined {
  if (password === '') return undefined;
  const issues = passwordIssues(password);
  return issues.length === 0 ? undefined : `Falta: ${issues.join(', ')}.`;
}
