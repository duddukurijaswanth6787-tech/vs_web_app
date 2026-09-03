'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  PackagePlus,
  Printer,
  FileText,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import CommandPalette from '@/components/CommandPalette';
import { ToastProvider } from '@/components/toast/ToastProvider';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { PageLoader } from '@/components/feedback/FeedbackStates';

const NAV_LINKS = [
  { href: '/pos', label: 'Billing', Icon: ShoppingBag },
  { href: '/pos/dashboard', label: 'Dashboard', Icon: BarChart3 },
  { href: '/pos/quotations', label: 'Quotations', Icon: FileText },
  { href: '/pos/add-stock', label: 'Add Stock', Icon: PackagePlus },
  { href: '/pos/printers', label: 'Printers', Icon: Printer },
];

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isStaffUser, isInitializing, logout } = useAuth();
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);

  const isSuperAdmin =
    user?.roles?.includes('super_admin') || user?.roles?.includes('admin');

  useEffect(() => {
    if (pathname === '/pos/login') return;
    if (!isInitializing && !isStaffUser) {
      router.push(`/pos/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isInitializing, isStaffUser, pathname, router]);

  if (pathname === '/pos/login') {
    return <>{children}</>;
  }

  if (!mounted || isInitializing) {
    return <PageLoader />;
  }

  if (!isStaffUser) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-neutral-100 text-neutral-900 font-sans">
      {/* Command Palette (Ctrl+K) */}
      <CommandPalette />

      {/* POS Standalone Top Header */}
      <header className="flex h-16 w-full shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6 shadow-2xs z-30">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary)] p-1.5 shadow-2xs">
            <Image src="/brand/logo-icon.png" alt="Vasanthi's Signature" width={1024} height={1024} className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold font-serif leading-none text-[var(--brand-primary)]">Shopora POS</p>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5 text-amber-600" />
                {isSuperAdmin ? 'Super Admin' : 'POS Operator'}
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 leading-none mt-1">Vasanthi&apos;s Signature — Counter Billing Terminal</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-neutral-50 p-1 rounded-xl border border-neutral-200">
          {NAV_LINKS.map(({ href, label, Icon }) => {
            const active = href === '/pos' ? pathname === '/pos' : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-white text-[var(--brand-primary)] shadow-2xs font-bold'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold text-neutral-900 leading-none">
              {user?.firstName} {user?.lastName || ''}
            </p>
            <p className="text-[10px] text-amber-800 font-semibold capitalize leading-none mt-1">
              {user?.roles?.[0]?.replace('_', ' ') || 'POS Staff'}
            </p>
          </div>

          {isSuperAdmin && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
              <span className="hidden sm:inline">Admin Console</span>
            </Link>
          )}

          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100/80 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto bg-neutral-100">
        <ToastProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </ToastProvider>
      </main>
    </div>
  );
}
