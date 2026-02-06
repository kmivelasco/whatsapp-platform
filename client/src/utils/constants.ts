export const API_URL = import.meta.env.VITE_API_URL || '/api';
export const WS_URL = import.meta.env.VITE_WS_URL || '';

export const ROLES = {
  ADMIN: 'ADMIN',
  AGENT: 'AGENT',
  VIEWER: 'VIEWER',
} as const;

export const CONVERSATION_STATUS = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
} as const;

export const CONVERSATION_MODE = {
  BOT: 'BOT',
  HUMAN: 'HUMAN',
} as const;

export const SENDER_TYPE = {
  CLIENT: 'CLIENT',
  BOT: 'BOT',
  AGENT: 'AGENT',
} as const;
