import { apiClient } from './api/client';

// Rate limiting & deduplication to prevent spamming notifications
const reportedErrors = new Set<string>();

export interface ClientErrorReport {
  message: string;
  url?: string;
  status?: number;
  errorCode?: string;
  stack?: string;
  userAgent?: string;
  customerId?: string;
  metadata?: Record<string, unknown>;
}

export async function reportClientError(report: ClientErrorReport): Promise<void> {
  if (typeof window === 'undefined') return;

  // Deduplicate errors within 30 seconds per unique signature
  const signature = `${report.url || window.location.pathname}-${report.errorCode || report.status || report.message?.slice(0, 50)}`;
  if (reportedErrors.has(signature)) return;
  reportedErrors.add(signature);
  setTimeout(() => reportedErrors.delete(signature), 30_000);

  try {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
    const currentUrl = typeof window !== 'undefined' ? window.location.href : undefined;
    let customerId = 'Guest';
    try {
      customerId =
        localStorage.getItem('vd_customer_id') ||
        sessionStorage.getItem('vd_customer_id') ||
        'Guest';
    } catch {
      // safe fallback
    }

    await apiClient.post('/notifications/client-error', {
      message: report.message || 'Unknown client error',
      url: report.url || currentUrl,
      status: report.status,
      errorCode: report.errorCode,
      stack: report.stack,
      userAgent: report.userAgent || userAgent,
      customerId: report.customerId || customerId,
      metadata: report.metadata,
    });
  } catch {
    // Fail silently so error reporting never breaks the UI
  }
}
