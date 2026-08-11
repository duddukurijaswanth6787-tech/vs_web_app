'use client';

import React, { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { useAuditLog } from '@/features/audit/audit.hooks';

function redactSecrets(obj: unknown, depth = 0): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (depth > 5) return '[MAX_DEPTH]';
  const sensitive = ['password', 'token', 'secret', 'authorization', 'api_key', 'apiKey', 'access_key', 'secret_key', 'gemini', 'openai', 'razorpay', 'aws_secret', 'jwt'];
  if (Array.isArray(obj)) return obj.map((v) => redactSecrets(v, depth + 1));
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (sensitive.some((s) => key.toLowerCase().includes(s))) result[key] = '[REDACTED]';
    else result[key] = typeof val === 'object' && val !== null ? redactSecrets(val, depth + 1) : val;
  }
  return result;
}

interface AuditDetailsDrawerProps {
  auditId: string | null;
  onClose: () => void;
  onCompare?: (id: string) => void;
  open?: boolean;
}

export default function AuditDetailsDrawer({ auditId, onClose, onCompare, open }: AuditDetailsDrawerProps) {
  const { data, isLoading } = useAuditLog(auditId ?? '');
  const isOpen = open ?? !!auditId;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-neutral-900/30" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-xl flex flex-col" role="dialog" aria-label="Audit details" aria-modal="true">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 shrink-0">
          <h3 className="text-sm font-semibold text-neutral-900">Audit Details</h3>
          <div className="flex items-center gap-2">
            {auditId && onCompare && (
              <button onClick={() => onCompare(auditId)} className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-neutral-600 hover:bg-neutral-100">
                <ExternalLink className="h-3 w-3" /> Compare
              </button>
            )}
            <button onClick={onClose} className="rounded p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-xs text-neutral-400">Loading...</div>
          ) : !data ? (
            <div className="text-center py-12 text-xs text-neutral-400">Not found</div>
          ) : (
            <>
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3">
                <Info label="Action" value={data.action} />
                <Info label="Module" value={data.module} />
                <Info label="Resource" value={data.resource} />
                <Info label="Resource ID" value={data.resourceId ? `${data.resourceId.substring(0, 12)}...` : '-'} />
                <Info label="User ID" value={data.userId ? `${data.userId.substring(0, 12)}...` : '-'} />
                <Info label="Status" value={data.status} />
                <Info label="IP Address" value={data.ipAddress || '-'} />
                <Info label="User Agent" value={data.userAgent || '-'} />
                <div className="col-span-2">
                  <Info label="Timestamp" value={new Date(data.createdAt).toLocaleString()} />
                </div>
              </div>

              {/* Old Value */}
              {data.oldValue && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-700 mb-1">Old Value</h4>
                  <pre className="text-[11px] bg-red-50/30 border border-red-100 rounded-lg p-3 font-mono text-neutral-700 whitespace-pre-wrap overflow-x-auto max-h-40">
                    {JSON.stringify(redactSecrets(data.oldValue), null, 2)}
                  </pre>
                </div>
              )}

              {/* New Value */}
              {data.newValue && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-700 mb-1">New Value</h4>
                  <pre className="text-[11px] bg-green-50/30 border border-green-100 rounded-lg p-3 font-mono text-neutral-700 whitespace-pre-wrap overflow-x-auto max-h-40">
                    {JSON.stringify(redactSecrets(data.newValue), null, 2)}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              {data.metadata && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-700 mb-1">Metadata</h4>
                  <pre className="text-[11px] bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono text-neutral-600 whitespace-pre-wrap overflow-x-auto max-h-32">
                    {JSON.stringify(data.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">{label}</p>
      <p className="text-xs text-neutral-800 mt-0.5 break-all">{value}</p>
    </div>
  );
}
