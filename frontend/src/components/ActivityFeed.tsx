'use client';

import React from 'react';
import Link from 'next/link';
import { useAuditLogs } from '@/features/audit/audit.hooks';
import { Activity, ExternalLink, RefreshCw } from 'lucide-react';

// ponytail: simple relative time, no dependency
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

// ponytail: action color mapping
const actionColors: Record<string, string> = {
  CREATE: 'text-green-600',
  UPDATE: 'text-blue-600',
  DELETE: 'text-red-600',
  LOGIN: 'text-purple-600',
  LOGOUT: 'text-neutral-500',
  APPROVE: 'text-emerald-600',
  REJECT: 'text-orange-600',
  ARCHIVE: 'text-neutral-400',
};

function getActionColor(action: string): string {
  for (const [key, color] of Object.entries(actionColors)) {
    if (action.toUpperCase().includes(key)) return color;
  }
  return 'text-neutral-600';
}

interface ActivityFeedProps {
  limit?: number;
  showHeader?: boolean;
  showViewAll?: boolean;
  className?: string;
}

export default function ActivityFeed({
  limit = 10,
  showHeader = true,
  showViewAll = true,
  className = '',
}: ActivityFeedProps) {
  const { data, isLoading, refetch } = useAuditLogs({
    page: 1,
    limit,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const activities = data?.data ?? [];

  return (
    <div className={`rounded-xl border border-neutral-200 bg-white ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-neutral-500" />
            <h3 className="text-sm font-semibold text-neutral-900">Recent Activity</h3>
          </div>
          <button
            onClick={() => refetch()}
            className="rounded p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="divide-y divide-neutral-50">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-400">
            Loading activities...
          </div>
        ) : activities.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-400">
            No recent activity
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 px-4 py-3">
              {/* Action indicator */}
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                <span className={`text-[9px] font-bold ${getActionColor(activity.action)}`}>
                  {activity.action?.charAt(0) || '?'}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-700">
                  <span className="font-medium">{activity.action}</span>
                  {activity.resource && (
                    <span className="text-neutral-500">
                      {' '}
                      on{' '}
                      <span className="font-medium text-neutral-700">
                        {activity.resource}
                      </span>
                    </span>
                  )}
                  {activity.resourceId && (
                    <span className="text-neutral-400 font-mono text-[10px]">
                      {' '}
                      {activity.resourceId.substring(0, 8)}...
                    </span>
                  )}
                </p>
                {activity.message && (
                  <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                    {activity.message}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-neutral-300">
                    {timeAgo(activity.createdAt)}
                  </span>
                  {activity.module && (
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-medium text-neutral-500">
                      {activity.module}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showViewAll && (
        <div className="border-t border-neutral-100 px-4 py-2.5">
          <Link
            href="/admin/audit"
            className="flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900"
          >
            View all activity
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}