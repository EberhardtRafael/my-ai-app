export const TICKET_CONTEXT_OPTIONS = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'full-stack', label: 'Full-stack' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'testing', label: 'Testing' },
] as const;

export type TicketContext = (typeof TICKET_CONTEXT_OPTIONS)[number]['value'];
