// Helper de tradução e formatação de Status e Prioridades

export const STATUS_MAP = {
  RECEIVED: { label: 'Recebido', color: 'neutral', variant: 'neutral' },
  AI_PROCESSING: { label: 'Em Análise (IA)', color: 'info', variant: 'info' },
  TRIAGED: { label: 'Triado', color: 'info', variant: 'info' },
  FORWARDED: { label: 'Encaminhado ao Setor', color: 'primary', variant: 'primary' },
  IN_PROGRESS: { label: 'Em Atendimento', color: 'warning', variant: 'warning' },
  TEAM_DISPATCHED: { label: 'Equipe em Deslocamento', color: 'warning', variant: 'warning' },
  COMPLETED: { label: 'Concluído', color: 'success', variant: 'success' },
  RESOLVED: { label: 'Resolvido', color: 'success', variant: 'success' },
  REJECTED: { label: 'Indeferido / Rejeitado', color: 'danger', variant: 'danger' },
  CANCELLED: { label: 'Cancelado', color: 'neutral', variant: 'neutral' }
};

export const PRIORITY_MAP = {
  LOW: { label: 'Baixa', color: 'neutral', variant: 'neutral' },
  MEDIUM: { label: 'Média', color: 'info', variant: 'info' },
  HIGH: { label: 'Alta', color: 'warning', variant: 'warning' },
  CRITICAL: { label: 'Crítica', color: 'danger', variant: 'danger' },
  URGENT: { label: 'Urgente', color: 'danger', variant: 'danger' }
};

export function getStatusInfo(status) {
  if (!status) return STATUS_MAP.RECEIVED;
  return STATUS_MAP[status] || { label: status, color: 'neutral', variant: 'neutral' };
}

export function getPriorityInfo(priority) {
  if (!priority) return PRIORITY_MAP.MEDIUM;
  return PRIORITY_MAP[priority] || { label: priority, color: 'neutral', variant: 'neutral' };
}
