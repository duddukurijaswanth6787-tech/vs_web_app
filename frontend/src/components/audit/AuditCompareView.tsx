'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useCompareVersions } from '@/features/audit/audit.hooks';

interface AuditCompareViewProps {
  auditId: string | null;
  onClose: () => void;
}

export default function AuditCompareView({ auditId, onClose }: AuditCompareViewProps) {
  const { data, isLoading } = useCompareVersions(auditId ?? '');

  useEffect(() => {
    if (!auditId) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [auditId, onClose]);

  if (!auditId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4">
      <div className="w-full max-w-3xl max-h-[85vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 shrink-0">
          <h3 className="text-sm font-semibold text-neutral-900">Compare Versions</h3>
          <button onClick={onClose} className="rounded p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12 text-xs text-neutral-400">Loading...</div>
        ) : !data ? (
          <div className="flex-1 flex items-center justify-center py-12 text-xs text-neutral-400">No data</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-4">
              <span className="font-medium text-neutral-700">{data.action}</span>
              <span className="text-neutral-300">·</span>
              <span>{data.module}</span>
              <span className="text-neutral-300">·</span>
              <span>{data.resource}</span>
              {data.resourceId && <><span className="text-neutral-300">·</span><code className="text-[10px]">{data.resourceId.substring(0, 8)}</code></>}
            </div>

            {data.changes.length === 0 ? (
              <div className="text-xs text-neutral-400 text-center py-8">No changes detected</div>
            ) : (
              <div className="space-y-2">
                {data.changes.map((change) => (
                  <div key={change.field} className="border border-neutral-200 rounded-lg overflow-hidden">
                    <div className="bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700 border-b border-neutral-200">
                      {change.field}
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-neutral-200">
                      <div className="p-3 bg-red-50/30">
                        <p className="text-[10px] font-medium text-red-600 mb-1">Old</p>
                        <pre className="text-[11px] text-neutral-700 whitespace-pre-wrap font-mono">
                          {change.oldValue !== undefined ? JSON.stringify(change.oldValue, null, 2) : <span className="text-neutral-400">undefined</span>}
                        </pre>
                      </div>
                      <div className="p-3 bg-green-50/30">
                        <p className="text-[10px] font-medium text-green-600 mb-1">New</p>
                        <pre className="text-[11px] text-neutral-700 whitespace-pre-wrap font-mono">
                          {change.newValue !== undefined ? JSON.stringify(change.newValue, null, 2) : <span className="text-neutral-400">undefined</span>}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
