'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerNotifications } from '@/features/customer/hooks';
import { customerNotificationService } from '@/features/customer/extra.service';
import { useQueryClient } from '@tanstack/react-query';
import { customerKeys } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';

interface NotificationItem {
  id: string;
  title?: string;
  subject?: string;
  message?: string;
  body?: string;
  isRead?: boolean;
  read?: boolean;
}

export default function NotificationsPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { data, isLoading, error } = useCustomerNotifications(isAuthenticated);
  const qc = useQueryClient();

  const items: NotificationItem[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data as NotificationItem[];
    if (Array.isArray(data.data)) return data.data as NotificationItem[];
    return [];
  }, [data]);

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href="/login?redirect=/profile/notifications" className="text-sm font-bold text-[#0284c7]">
          Login required
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <StorefrontHeader />
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="p-1 rounded-lg hover:bg-neutral-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold font-serif text-[#0284c7]">Notifications</h1>
        </div>
        <button
          type="button"
          className="text-xs font-bold text-[#0284c7]"
          onClick={async () => {
            await customerNotificationService.markAllRead();
            qc.invalidateQueries({ queryKey: customerKeys.notifications });
          }}
        >
          Mark all read
        </button>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1 space-y-2">
        {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
        {error && <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>}
        {!isLoading && items.length === 0 && (
          <p className="text-sm text-neutral-500 text-center py-10">No notifications</p>
        )}
        {items.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={async () => {
              if (!n.isRead) {
                await customerNotificationService.markRead(n.id);
                qc.invalidateQueries({ queryKey: customerKeys.notifications });
              }
            }}
            className={`w-full text-left bg-white border rounded-2xl p-4 ${
              n.isRead ? 'border-neutral-200' : 'border-[#0284c7]/30 bg-sky-50/40'
            }`}
          >
            <p className="text-sm font-bold">{n.title || n.subject || 'Notification'}</p>
            <p className="text-xs text-neutral-600 mt-1">{n.message || n.body}</p>
          </button>
        ))}
      </main>
      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
