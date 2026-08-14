'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/ui.store';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminHeader from '@/components/layout/AdminHeader';
import CommandPalette from '@/components/CommandPalette';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { ToastProvider } from '@/components/toast/ToastProvider';
import { PageLoader } from '@/components/feedback/FeedbackStates';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isStaffUser, isInitializing } = useAuth();
  const { toggleCommandPalette } = useUIStore();
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const [isOffline, setIsOffline] = useState(false);

  // ponytail: Ctrl+K / Cmd+K keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette]);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (!isInitializing) {
      if (!isStaffUser) {
        router.push('/login');
        return;
      }

      // POS-only staff never see the admin console at all — Shopora POS is
      // its own standalone shell at /pos (see app/pos/layout.tsx), not a
      // page nested inside this one.
      const isPosOnlyRole =
        user?.roles?.includes('pos_operator') ||
        user?.roles?.includes('pos_staff');
      const isAdminOrSuperAdmin =
        user?.roles?.includes('super_admin') ||
        user?.roles?.includes('admin');

      if (isPosOnlyRole && !isAdminOrSuperAdmin) {
        router.push('/pos');
      }
    }
  }, [isInitializing, isStaffUser, user, router]);

  // ponytail: mounted guard ensures server & client render the same thing
  if (!mounted || isInitializing) {
    return <PageLoader />;
  }

  if (!isStaffUser) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50 text-neutral-900">
      {/* Command Palette (Ctrl+K) */}
      <CommandPalette />

      {/* Sidebar Panel */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Sticky Header */}
        <AdminHeader />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {isOffline && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-sm text-amber-800 font-medium text-center">
              You are offline. Some features may be unavailable.
            </div>
          )}
          <div className="p-6">
            <div className="mx-auto max-w-7xl space-y-6">
              <ToastProvider>
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </ToastProvider>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
