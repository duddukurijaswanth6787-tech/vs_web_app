'use client';

import React, { useState } from 'react';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/features/notifications';
import { Bell, Trash2, MailOpen, CheckSquare, RefreshCw } from 'lucide-react';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useNotifications({ page, limit: 10 });
  const { data: unreadCount, refetch: refetchUnread } = useUnreadNotificationCount();

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();

  const handleRetry = () => {
    refetch();
    refetchUnread();
  };

  if (isLoading) return <SectionLoader message="Loading notification log..." />;
  if (error) return <PageError title="Load Failure" message="Could not retrieve notifications." retry={handleRetry} />;

  const notifications = data?.data || [];
  const meta = data?.meta || { totalPages: 1, hasNext: false, hasPrevious: false };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-neutral-100">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Notifications</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Display system alerts, customer sign-ups, and operational tasks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount && unreadCount > 0 ? (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-xs font-bold text-white bg-neutral-950 rounded px-4.5 py-2 hover:bg-neutral-850 transition flex items-center gap-1.5 shadow-sm"
            >
              <CheckSquare className="h-4 w-4" />
              Mark All Read ({unreadCount})
            </button>
          ) : null}
          <button
            onClick={handleRetry}
            className="text-xs font-bold text-neutral-900 border border-neutral-300 bg-white rounded px-4 py-2 hover:bg-neutral-50 transition flex items-center gap-1 shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        {notifications.length > 0 ? (
          <div className="space-y-4">
            <div className="divide-y divide-neutral-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`py-4 flex items-start justify-between gap-4 transition first:pt-0 last:pb-0`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`rounded-lg p-2 border shrink-0 mt-0.5
                      ${notif.isRead 
                        ? 'bg-neutral-50 text-neutral-400 border-neutral-100' 
                        : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                      }`}
                    >
                      <Bell className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-semibold ${notif.isRead ? 'text-neutral-500' : 'text-neutral-900'}`}>
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed max-w-[500px]">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-neutral-400 block pt-0.5">
                        {new Date(notif.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!notif.isRead && (
                      <button
                        onClick={() => markRead.mutate(notif.id)}
                        disabled={markRead.isPending}
                        title="Mark as Read"
                        className="p-1 text-neutral-400 hover:text-neutral-900 transition hover:bg-neutral-50 rounded"
                      >
                        <MailOpen className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotif.mutate(notif.id)}
                      disabled={deleteNotif.isPending}
                      title="Delete Notification"
                      className="p-1 text-neutral-400 hover:text-red-600 transition hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center border-t pt-4">
              <span className="text-xs text-neutral-450">Page {page} of {meta.totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={!meta.hasPrevious}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-xs font-bold text-neutral-900 border border-neutral-350 rounded px-3 py-1 hover:bg-neutral-50 disabled:opacity-50 bg-white"
                >
                  Previous
                </button>
                <button
                  disabled={!meta.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs font-bold text-neutral-900 border border-neutral-350 rounded px-3 py-1 hover:bg-neutral-50 disabled:opacity-50 bg-white"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-xs text-neutral-450">No notifications found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
