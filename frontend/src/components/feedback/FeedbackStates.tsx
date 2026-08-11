'use client';

import React from 'react';
import { Loader2, AlertCircle, ShieldAlert, Inbox } from 'lucide-react';
import Link from 'next/link';

export function ButtonLoader() {
  return <Loader2 className="h-4 w-4 animate-spin mr-2 inline-block" />;
}

export function PageLoader() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-2">
      <Loader2 className="h-10 w-10 animate-spin text-neutral-800" />
      <p className="text-sm font-medium text-neutral-500">Loading admin panel...</p>
    </div>
  );
}

export function SectionLoader({ message = 'Loading data...' }: { message?: string }) {
  return (
    <div className="flex h-48 w-full flex-col items-center justify-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-neutral-600" />
      <p className="text-sm text-neutral-500">{message}</p>
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function PageError({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this page.',
  retry,
}: {
  title?: string;
  message?: string;
  retry?: () => void;
}) {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <div>
        <h2 className="text-xl font-bold text-neutral-800">{title}</h2>
        <p className="text-sm text-neutral-500 mt-1 max-w-md">{message}</p>
      </div>
      {retry && (
        <button
          onClick={retry}
          className="rounded-md bg-neutral-900 px-4 h-9 text-sm font-medium text-white hover:bg-neutral-800 transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title = 'No items found',
  description = 'There is no data available to display at this moment.',
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-4 border border-dashed border-neutral-200 rounded-lg p-6 text-center">
      <Inbox className="h-10 w-10 text-neutral-300" />
      <div>
        <h3 className="text-sm font-semibold text-neutral-700">{title}</h3>
        <p className="text-xs text-neutral-400 mt-1">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function AccessDenied() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
      <ShieldAlert className="h-16 w-16 text-yellow-500" />
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Access Denied</h1>
        <p className="text-sm text-neutral-500 mt-2 max-w-md">
          You do not have the required permissions or administrative privileges to view this page.
        </p>
      </div>
      <Link
        href="/login"
        className="rounded-md bg-neutral-900 px-4 h-9 flex items-center text-sm font-medium text-white hover:bg-neutral-800 transition"
      >
        Return to Login
      </Link>
    </div>
  );
}

export function ApiErrorAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-red-700">
      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-semibold">Request Failed</p>
        <p className="opacity-90">{message}</p>
      </div>
    </div>
  );
}
