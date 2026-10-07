/** Rótulos das ações do registro de atividades (códigos estáveis da API em /api/audit). */
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  'school.created': 'Escola cadastrada',
  'school.updated': 'Escola editada',
  'school.deactivated': 'Escola desativada',
  'school.reactivated': 'Escola reativada',
  'school.deleted': 'Escola excluída',
  'user.created': 'Conta criada',
  'user.updated': 'Conta editada',
  'user.role_changed': 'Perfil trocado',
  'user.deactivated': 'Conta desativada',
  'user.reactivated': 'Conta reativada',
  'user.password_reset': 'Senha redefinida',
  'user.unlocked': 'Conta desbloqueada',
  'user.sessions_revoked': 'Desconectada dos aparelhos',
  'user.joined_school': 'Entrou na escola',
  'user.left_school': 'Saiu da escola',
};

export const auditActionLabel = (action: string) => AUDIT_ACTION_LABEL[action] ?? action;

/** Ações que tiram acesso: destacadas na lista (texto e cor, nunca só cor). */
export const AUDIT_RESTRICTIVE = new Set(['school.deactivated', 'school.deleted', 'user.deactivated', 'user.sessions_revoked', 'user.left_school']);
