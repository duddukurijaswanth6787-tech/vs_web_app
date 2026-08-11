export interface AuditLogResponse {
  id: string;
  userId?: string;
  staffId?: string;
  action: string;
  module: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: string;
  message?: string;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
  createdAt: string;
}

export interface AuditLogQueryDto {
  module?: string;
  action?: string;
  userId?: string;
  staffId?: string;
  resource?: string;
  resourceId?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditStats {
  total: number;
  today: number;
  uniqueUsers: number;
  modules: Array<{ module: string; count: number }>;
}

export interface CompareChange {
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
  changed: boolean;
}

export interface CompareVersionResponse {
  id: string;
  action: string;
  module: string;
  resource: string;
  resourceId?: string;
  timestamp: string;
  changes: CompareChange[];
  oldValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
}
