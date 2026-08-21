'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, LogOut, ShoppingBag, PackagePlus, Printer } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/toast/ToastProvider';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { PageLoader } from '@/components/feedback/FeedbackStates';

/**
 * Standalone shell for Shopora POS billing — deliberately not nested under
 * AdminLayout. A cashier signed in here never sees the admin sidebar, the
 * dashboard, analytics, reports, or anything else a super_admin can reach;
 * they get exactly this screen. Any authenticated staff account can use it
 * (the backend has no role restriction on completing a sale) — Add Stock is
 * still admin/super_admin-only server-side, this shell doesn't relax that.
 */
const NAV_LINKS = [
  { href: '/pos', label: 'Billing', Icon: ShoppingBag },
  { href: '/pos/add-stock', label: 'Add Stock', Icon: PackagePlus },
  { href: '/pos/printers', label: 'Printers', Icon: Printer },
];

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isStaffUser, isInitializing, logout } = useAuth();
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);

  useEffect(() => {
    if (!isInitializing && !isStaffUser) {
      router.push('/login?redirect=/pos');
    }
  }, [isInitializing, isStaffUser, router]);

  if (!mounted || isInitializing) {
    return <PageLoader />;
  }

  if (!isStaffUser) {
    return null;
  }

  const canOpenAdminConsole =
    user?.roles?.includes('super_admin') || user?.roles?.includes('admin');

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-neutral-100 text-neutral-900">
      <header className="flex h-16 w-full shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#800020] p-1">
            <Image src="/brand/logo-icon.png" alt="Vasanthi's Signature" width={1024} height={1024} className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold font-serif leading-none text-[#800020]">Shopora POS</p>
            <p className="text-[10px] text-neutral-400 leading-none mt-1">Vasanthi&apos;s Signature — Billing</p>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, Icon }) => {
            const active = href === '/pos' ? pathname === '/pos' : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#800020]/10 text-[#800020]'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold text-neutral-800 leading-none">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-neutral-400 capitalize leading-none mt-1">
              {user?.roles?.[0]?.replace('_', ' ') || 'Staff'}
            </p>
          </div>

          {canOpenAdminConsole && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Admin Console</span>
            </Link>
          )}

          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <ToastProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </ToastProvider>
      </main>
    </div>
  );
}
