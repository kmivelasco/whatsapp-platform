import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ConversationFilters {
  clientId?: string;
  status?: string;
  mode?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  assignedAgentId?: string;
}

export interface AnalyticsDateRange {
  from: Date;
  to: Date;
}

export interface TokenCostMap {
  [model: string]: {
    input: number;  // cost per 1M tokens
    output: number; // cost per 1M tokens
  };
}
