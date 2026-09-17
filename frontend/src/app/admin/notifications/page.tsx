'use client';

import React, { useState } from 'react';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/features/notifications';
import { NOTIFICATION_GROUPS, NotificationType } from '@/features/notifications/notifications.types';
import {
  Bell,
  Trash2,
  MailOpen,
  CheckSquare,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  ShoppingBag,
  Package,
  User,
  Activity,
} from 'lucide-react';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'Errors', label: 'Errors & Alerts' },
  { key: 'Orders', label: 'Orders' },
  { key: 'Inventory', label: 'Inventory' },
  { key: 'System', label: 'System' },
];

function getNotificationIcon(type: string, isRead: boolean) {
  if (type === 'USER_ERROR' || type === 'SYSTEM_ERROR' || type === 'ERROR') {
    return {
      icon: <AlertTriangle className="h-4.5 w-4.5" />,
      containerClass: isRead
        ? 'bg-neutral-50 text-neutral-400 border-neutral-100'
        : 'bg-rose-50 text-rose-600 border-rose-200 ring-2 ring-rose-100',
      badgeClass: 'bg-rose-100 text-rose-700 border border-rose-200',
      badgeLabel: type === 'USER_ERROR' ? 'User Error' : type === 'SYSTEM_ERROR' ? 'System Error' : 'Error',
    };
  }
  if (type === 'PAYMENT_FAILED' || type === 'WARNING') {
    return {
      icon: <AlertCircle className="h-4.5 w-4.5" />,
      containerClass: isRead
        ? 'bg-neutral-50 text-neutral-400 border-neutral-100'
        : 'bg-amber-50 text-amber-600 border-amber-200',
      badgeClass: 'bg-amber-100 text-amber-700 border border-amber-200',
      badgeLabel: type.replace('_', ' '),
    };
  }
  if (type.startsWith('ORDER_') || type === 'REFUND_COMPLETED') {
    return {
      icon: <ShoppingBag className="h-4.5 w-4.5" />,
      containerClass: isRead
        ? 'bg-neutral-50 text-neutral-400 border-neutral-100'
        : 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      badgeLabel: 'Order',
    };
  }
  if (type === 'LOW_STOCK' || type === 'OUT_OF_STOCK' || type === 'NEGATIVE_STOCK') {
    return {
      icon: <Package className="h-4.5 w-4.5" />,
      containerClass: isRead
        ? 'bg-neutral-50 text-neutral-400 border-neutral-100'
        : 'bg-orange-50 text-orange-600 border-orange-200',
      badgeClass: 'bg-orange-100 text-orange-700 border border-orange-200',
      badgeLabel: 'Inventory',
    };
  }
  if (type === 'NEW_CUSTOMER' || type.startsWith('REVIEW_')) {
    return {
      icon: <User className="h-4.5 w-4.5" />,
      containerClass: isRead
        ? 'bg-neutral-50 text-neutral-400 border-neutral-100'
        : 'bg-purple-50 text-purple-600 border-purple-200',
      badgeClass: 'bg-purple-100 text-purple-700 border border-purple-200',
      badgeLabel: 'Customer',
    };
  }
  return {
    icon: <Bell className="h-4.5 w-4.5" />,
    containerClass: isRead
      ? 'bg-neutral-50 text-neutral-400 border-neutral-100'
      : 'bg-indigo-50 text-indigo-600 border-indigo-200',
    badgeClass: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
    badgeLabel: type.replace(/_/g, ' '),
  };
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  const queryParams: Record<string, string | number | boolean> = { page, limit: 15 };
  if (activeTab === 'unread') {
    queryParams.isRead = false;
  } else if (activeTab !== 'all') {
    const types = NOTIFICATION_GROUPS[activeTab as keyof typeof NOTIFICATION_GROUPS];
    if (types && types.length > 0) {
      queryParams.type = types[0];
    }
  }

  const { data, isLoading, error, refetch } = useNotifications(queryParams);
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
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Notifications & Error Alerts</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Real-time feed of storefront errors, user failure alerts, order updates, and system events.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount && unreadCount > 0 ? (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-xs font-bold text-white bg-neutral-950 rounded-lg px-4 py-2 hover:bg-neutral-850 transition flex items-center gap-1.5 shadow-sm"
            >
              <CheckSquare className="h-4 w-4" />
              Mark All Read ({unreadCount})
            </button>
          ) : null}
          <button
            onClick={handleRetry}
            className="text-xs font-bold text-neutral-900 border border-neutral-300 bg-white rounded-lg px-4 py-2 hover:bg-neutral-50 transition flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'border-neutral-950 text-neutral-950'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {tab.key === 'Errors' && <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />}
              {tab.label}
              {tab.key === 'unread' && unreadCount && unreadCount > 0 ? (
                <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Notifications list */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        {notifications.length > 0 ? (
          <div className="space-y-4">
            <div className="divide-y divide-neutral-100">
              {notifications.map((notif) => {
                const iconInfo = getNotificationIcon(notif.type, notif.isRead);
                const isError = notif.type === 'USER_ERROR' || notif.type === 'SYSTEM_ERROR' || notif.type === 'ERROR';

                return (
                  <div
                    key={notif.id}
                    className={`py-4 flex items-start justify-between gap-4 transition first:pt-0 last:pb-0 ${
                      !notif.isRead && isError ? 'bg-rose-50/40 -mx-3 px-3 rounded-lg' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className={`rounded-lg p-2 border shrink-0 mt-0.5 ${iconInfo.containerClass}`}>
                        {iconInfo.icon}
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-sm font-semibold ${notif.isRead ? 'text-neutral-600' : 'text-neutral-900'}`}>
                            {notif.title}
                          </h4>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${iconInfo.badgeClass}`}>
                            {iconInfo.badgeLabel}
                          </span>
                          {!notif.isRead && (
                            <span className="w-2 h-2 bg-indigo-600 rounded-full shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed max-w-[700px] break-words">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-neutral-400 block pt-0.5">
                          {new Date(notif.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!notif.isRead && (
                        <button
                          onClick={() => markRead.mutate(notif.id)}
                          disabled={markRead.isPending}
                          title="Mark as Read"
                          className="p-1.5 text-neutral-400 hover:text-neutral-900 transition hover:bg-neutral-100 rounded-md"
                        >
                          <MailOpen className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotif.mutate(notif.id)}
                        disabled={deleteNotif.isPending}
                        title="Delete Notification"
                        className="p-1.5 text-neutral-400 hover:text-red-600 transition hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center border-t pt-4">
              <span className="text-xs text-neutral-400">Page {page} of {meta.totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={!meta.hasPrevious}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-xs font-semibold text-neutral-900 border border-neutral-300 rounded px-3 py-1 hover:bg-neutral-50 disabled:opacity-50 bg-white"
                >
                  Previous
                </button>
                <button
                  disabled={!meta.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs font-semibold text-neutral-900 border border-neutral-300 rounded px-3 py-1 hover:bg-neutral-50 disabled:opacity-50 bg-white"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-xs text-neutral-400">No notifications found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

