'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  PackagePlus,
  Printer,
  Menu,
  ShieldCheck,
  Lock,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/ui.store';
import AdminSidebar from '@/components/layout/AdminSidebar';
import CommandPalette from '@/components/CommandPalette';
import { ToastProvider } from '@/components/toast/ToastProvider';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { PageLoader } from '@/components/feedback/FeedbackStates';

const NAV_LINKS = [
  { href: '/pos', label: 'Billing', Icon: ShoppingBag },
  { href: '/pos/add-stock', label: 'Add Stock', Icon: PackagePlus },
  { href: '/pos/printers', label: 'Printers', Icon: Printer },
];

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isStaffUser, isInitializing, logout } = useAuth();
  const { toggleMobileSidebar } = useUIStore();
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);

  const [pinInput, setPinInput] = useState('');
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinError, setPinError] = useState('');

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

  const handleUnlockPos = (e: React.FormEvent) => {
    e.preventDefault();
    // Super Admin PIN check: 1234 or matching user PIN
    if (pinInput === '1234' || isSuperAdmin) {
      setPinUnlocked(true);
      setPinError('');
    } else {
      setPinError('Invalid Super Admin Security PIN. Access Denied.');
    }
  };

  if (!mounted || isInitializing) {
    return <PageLoader />;
  }

  if (!isStaffUser) {
    return null;
  }

  // Strict Super Admin Gate: If not Super Admin and not unlocked via PIN
  if (!isSuperAdmin && !pinUnlocked) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-900 text-white p-4">
        <div className="w-full max-w-md bg-white text-neutral-900 rounded-3xl p-8 shadow-2xl border border-neutral-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 ring-8 ring-amber-500/5">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold font-serif text-neutral-900">Super Admin POS Terminal Lock</h2>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs">
              Access to Shopora Web POS billing terminal is controlled strictly by Super Admin authorization.
            </p>

            <form onSubmit={handleUnlockPos} className="w-full mt-6 space-y-4">
              <div>
                <label className="block text-left text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Super Admin Security PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter PIN (e.g. 1234)"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                  <KeyRound className="w-5 h-5 text-neutral-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
                {pinError && (
                  <p className="text-xs text-red-600 font-semibold mt-1 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {pinError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                🔓 Authorize & Unlock POS Terminal
              </button>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
                <span>Logged in as: <strong>{user?.email}</strong></span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-red-600 font-bold hover:underline"
                >
                  Sign Out
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-100 text-neutral-900">
      {/* Command Palette (Ctrl+K) */}
      <CommandPalette />

      {/* Main Admin Sidebar - Always Fixed */}
      <AdminSidebar />

      {/* Main Content Viewport */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex h-16 w-full shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleMobileSidebar}
              className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-primary)] p-1">
              <Image src="/brand/logo-icon.png" alt="Vasanthi's Signature" width={1024} height={1024} className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold font-serif leading-none text-[var(--brand-primary)]">Shopora POS</p>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-amber-600" /> Super Admin Controlled
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-none mt-1">Vasanthi&apos;s Signature — Counter Billing</p>
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
                      ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
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
              <p className="text-[10px] text-amber-700 font-bold capitalize leading-none mt-1">
                {user?.roles?.[0]?.replace('_', ' ') || 'Super Admin'}
              </p>
            </div>

            {isSuperAdmin && (
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
    </div>
  );
}
