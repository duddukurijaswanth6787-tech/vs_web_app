export interface SubsystemHealth {
  status: 'up' | 'down' | 'degraded';
  message?: string;
  enabled?: boolean;
  provider?: string;
  llm?: {
    provider?: string;
    status?: string;
  };
  embedding?: {
    provider?: string;
    status?: string;
  };
  ingestionQueue?: {
    status?: string;
  };
  vectorDatabase?: {
    status?: string;
  };
  [key: string]: unknown;
}

export interface SystemHealth {
  status: 'ok' | 'error' | 'shutting_down';
  info?: {
    database?: SubsystemHealth;
    migrations?: SubsystemHealth;
    redis?: SubsystemHealth;
    queue?: SubsystemHealth;
    storage?: SubsystemHealth;
    rag?: SubsystemHealth;
    app?: SubsystemHealth;
  };
  error?: Record<string, SubsystemHealth>;
  details?: {
    database?: SubsystemHealth;
    migrations?: SubsystemHealth;
    redis?: SubsystemHealth;
    queue?: SubsystemHealth;
    storage?: SubsystemHealth;
    rag?: SubsystemHealth;
    app?: SubsystemHealth;
  };
}
