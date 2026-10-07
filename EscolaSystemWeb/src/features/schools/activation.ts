import type { School } from '../../types';
import { schoolApi } from '../../services/api';
import type { useConfirm } from '../../components/ui';
import { plural } from '../../lib/format';

/** Ligar ou desligar a escola afeta todo mundo dela: confirma dizendo quantas pessoas. */
export const confirmActivation = async (confirm: ReturnType<typeof useConfirm>, target: School, activate: boolean) => {
  let people: number | null = null;
  try {
    // O admin não lista as pessoas da escola: a API manda só quantas têm conta ativa
    people = (await schoolApi.get(target.id)).activeUsers ?? null;
  } catch {
    // Sem a contagem, a confirmação continua, só sem o número
  }
  const who = people === null ? 'As pessoas desta escola' : people === 0 ? 'Ninguém' : plural(people, 'pessoa', 'pessoas');
  return confirm(
    activate
      ? {
          title: `Reativar ${target.name}?`,
          consequence: `${who} com conta ativa ${people === 1 ? 'volta' : 'voltam'} a entrar no sistema.`,
          confirmLabel: 'Reativar escola',
          reversible: true,
          tone: 'primary',
        }
      : {
          title: `Desativar ${target.name}?`,
          consequence:
            people === 0
              ? 'Ninguém da escola tem conta ativa agora. Nada é apagado, e a escola pode ser reativada depois.'
              : `${who} ${people === 1 ? 'perde' : 'perdem'} o acesso na hora: não ${people === 1 ? 'consegue' : 'conseguem'} entrar até a escola ser reativada. Nada é apagado.`,
          confirmLabel: 'Desativar escola',
          reversible: true,
        },
  );
};
