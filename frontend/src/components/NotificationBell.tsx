'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useUnreadNotificationCount } from '@/features/notifications/notifications.hooks';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData ?? 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 p-2 text-neutral-600 hover:bg-neutral-100 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
