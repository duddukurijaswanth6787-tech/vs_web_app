export interface StandardResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  meta: {
    timestamp: string;
    correlationId: string;
    path: string;
    apiVersion: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  success: boolean;
  error: string;
  code: string;
  message: string;
  timestamp: string;
  correlationId: string;
  path: string;
  metadata: {
    validationErrors?: string[];
    [key: string]: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Query/params bag for axios without resorting to Record<string, any>. */
export type QueryParams = Record<string, string | number | boolean | undefined | null>;
