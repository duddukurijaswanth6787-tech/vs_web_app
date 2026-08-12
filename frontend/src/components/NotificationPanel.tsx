'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { X, Bell, CheckCheck, Trash2, Loader2, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications, useUnreadNotificationCount, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification, useDeleteAllReadNotifications } from '@/features/notifications/notifications.hooks';
import NotificationCard from './NotificationCard';
import { NOTIFICATION_GROUPS, Notification } from '@/features/notifications/notifications.types';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'Orders', label: 'Orders' },
  { key: 'Inventory', label: 'Inventory' },
  { key: 'System', label: 'System' },
];

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const queryParams: Record<string, string | number | boolean> = { limit: 20 };
  if (activeTab === 'unread') queryParams.isRead = false;
  if (activeTab !== 'all' && activeTab !== 'unread') {
    const types = NOTIFICATION_GROUPS[activeTab as keyof typeof NOTIFICATION_GROUPS];
    if (types) queryParams.type = types[0];
  }

  const { data: notificationsData, isLoading } = useNotifications(queryParams);
  const { data: unreadCount } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();
  const deleteAllRead = useDeleteAllReadNotifications();

  const notifications = notificationsData?.data ?? [];
  const count = unreadCount ?? 0;

  const handleMarkAllRead = useCallback(() => {
    markAllRead.mutate();
  }, [markAllRead]);

  const handleDeleteRead = useCallback(() => {
    deleteAllRead.mutate();
  }, [deleteAllRead]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-neutral-900/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col"
        role="dialog"
        aria-label="Notifications panel"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-neutral-600" />
            <h2 className="text-base font-semibold text-neutral-900">Notifications</h2>
            {count > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white min-w-[20px]">
                {count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded p-1.5 ${showFilters ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
              aria-label="Toggle filters"
            >
              <Filter className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              aria-label="Close notifications panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-100 overflow-x-auto shrink-0" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {tab.label}
              {tab.key === 'unread' && count > 0 && (
                <span className="ml-1.5 text-[10px] text-red-500">({count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-100 bg-neutral-50 shrink-0">
            <button
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending || count === 0}
              className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-neutral-600 hover:bg-neutral-200 disabled:opacity-40"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
            <button
              onClick={handleDeleteRead}
              disabled={deleteAllRead.isPending}
              className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-neutral-600 hover:bg-neutral-200 disabled:opacity-40"
            >
              <Trash2 className="h-3 w-3" />
              Delete read
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto" role="list">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-neutral-400">
              No notifications yet
            </div>
          ) : (
            notifications.map((notif: Notification) => (
              <NotificationCard
                key={notif.id}
                notification={notif}
                onMarkRead={() => !notif.isRead && markRead.mutate(notif.id)}
                onDelete={() => deleteNotif.mutate(notif.id)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-100 px-4 py-2.5 shrink-0">
          <button
            onClick={() => { onClose(); router.push('/admin/notifications'); }}
            className="w-full text-center text-xs font-medium text-neutral-600 hover:text-neutral-900 py-1"
          >
            View all notifications
          </button>
        </div>
      </div>
    </>
  );
}
