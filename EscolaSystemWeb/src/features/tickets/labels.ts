import { TicketStatus, TicketType } from '../../types';

export const TICKET_TYPE_LABEL: Record<TicketType, string> = {
  [TicketType.BUG]: 'Bug',
  [TicketType.IMPROVEMENT]: 'Melhoria',
  [TicketType.QUESTION]: 'Dúvida',
  [TicketType.OTHER]: 'Outro',
};

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: 'Aberto',
  [TicketStatus.IN_PROGRESS]: 'Em andamento',
  [TicketStatus.RESOLVED]: 'Resolvido',
  [TicketStatus.CLOSED]: 'Fechado',
};

/** Aberto pede ação da administração; em andamento já tem alguém; resolvido e fechado saem da fila */
export const TICKET_STATUS_TONE: Record<TicketStatus, 'blue' | 'amber' | 'lousa' | 'neutral'> = {
  [TicketStatus.OPEN]: 'blue',
  [TicketStatus.IN_PROGRESS]: 'amber',
  [TicketStatus.RESOLVED]: 'lousa',
  [TicketStatus.CLOSED]: 'neutral',
};

/** Onde fica a área de tickets de cada lado */
export const TICKETS_BASE = { admin: '/admin/tickets', director: '/director/support' } as const;
export type TicketAudience = keyof typeof TICKETS_BASE;
