'use client';

import React from 'react';
import { Check, Trash2 } from 'lucide-react';

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

const typeStyles: Record<string, { bg: string; text: string }> = {
  ORDER_CREATED: { bg: 'bg-green-100', text: 'text-green-700' },
  ORDER_CONFIRMED: { bg: 'bg-green-100', text: 'text-green-700' },
  ORDER_CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
  ORDER_RETURNED: { bg: 'bg-orange-100', text: 'text-orange-700' },
  ORDER_DELIVERED: { bg: 'bg-blue-100', text: 'text-blue-700' },
  PAYMENT_FAILED: { bg: 'bg-red-100', text: 'text-red-700' },
  REFUND_COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-700' },
  LOW_STOCK: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  OUT_OF_STOCK: { bg: 'bg-red-100', text: 'text-red-700' },
  PRODUCT_CREATED: { bg: 'bg-purple-100', text: 'text-purple-700' },
  PRODUCT_UPDATED: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  NEW_CUSTOMER: { bg: 'bg-purple-100', text: 'text-purple-700' },
  REVIEW_SUBMITTED: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  UPLOAD_COMPLETE: { bg: 'bg-teal-100', text: 'text-teal-700' },
  ERROR: { bg: 'bg-red-100', text: 'text-red-700' },
  WARNING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  INFO: { bg: 'bg-blue-100', text: 'text-blue-700' },
};

const defaultStyle = { bg: 'bg-neutral-100', text: 'text-neutral-600' };

function getTypeStyle(type: string) {
  return typeStyles[type] || defaultStyle;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationCardProps {
  notification: Notification;
  onMarkRead?: () => void;
  onDelete?: () => void;
}

export default function NotificationCard({ notification, onMarkRead, onDelete }: NotificationCardProps) {
  const style = getTypeStyle(notification.type);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border-b border-neutral-50 transition-colors ${
        notification.isRead ? 'bg-white' : 'bg-blue-50/30'
      }`}
      role="listitem"
      aria-label={`${notification.title} - ${notification.isRead ? 'read' : 'unread'}`}
    >
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
        <span className={`text-[10px] font-bold ${style.text}`}>
          {notification.type?.charAt(0) || '?'}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-relaxed ${notification.isRead ? 'text-neutral-600' : 'text-neutral-900 font-medium'}`}>
          {notification.title}
        </p>
        <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[10px] text-neutral-300 mt-1">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!notification.isRead && onMarkRead && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkRead(); }}
            className="rounded p-1 text-neutral-400 hover:text-green-600 hover:bg-green-50"
            title="Mark as read"
            aria-label="Mark notification as read"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50"
            title="Delete"
            aria-label="Delete notification"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
