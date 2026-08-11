'use client';

import React from 'react';
import { useEntityHistory } from '@/features/audit/audit.hooks';

interface AuditTimelineProps {
  resource: string;
  resourceId: string;
}

const actionColors: Record<string, string> = {
  CREATED: 'bg-green-500',
  UPDATED: 'bg-blue-500',
  DELETED: 'bg-red-500',
  RESTORED: 'bg-purple-500',
  CANCELLED: 'bg-orange-500',
  CONFIRMED: 'bg-emerald-500',
};

function getColor(action: string): string {
  for (const [key, color] of Object.entries(actionColors)) {
    if (action.includes(key)) return color;
  }
  return 'bg-neutral-400';
}

function timeAgo(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function AuditTimeline({ resource, resourceId }: AuditTimelineProps) {
  const { data, isLoading } = useEntityHistory(resource, resourceId);
  const events = data ?? [];

  return (
    <div className="space-y-1">
      {isLoading ? (
        <div className="text-center py-8 text-xs text-neutral-400">Loading timeline...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-8 text-xs text-neutral-400">No history found</div>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-2.5 top-2 bottom-2 w-px bg-neutral-200" />
          {events.map((event) => (
            <div key={event.id} className="relative pb-4 last:pb-0">
              <div className={`absolute -left-4 mt-1.5 h-3 w-3 rounded-full border-2 border-white ${getColor(event.action)}`} />
              <div className="ml-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-800">{event.action}</span>
                  <span className="text-[10px] text-neutral-400">{timeAgo(event.createdAt)}</span>
                </div>
                {event.message && (
                  <p className="text-[11px] text-neutral-500 mt-0.5">{event.message}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">{event.module}</span>
                  {event.userId && (
                    <span className="text-[9px] text-neutral-400">{event.userId.substring(0, 8)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
