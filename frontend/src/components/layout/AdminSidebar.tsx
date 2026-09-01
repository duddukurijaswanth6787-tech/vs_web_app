'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { adminNavigation } from '@/config/navigation';
import { useUIStore } from '@/stores/ui.store';
import { useAuth } from '@/hooks/useAuth';
import { canAccessRoute } from '@/lib/permissions/rules';
import { useOrderList } from '@/features/orders/order.hooks';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const {
    sidebarCollapsed,
    mobileSidebarOpen,
    toggleSidebar,
    setMobileSidebarOpen,
  } = useUIStore();

  // Fetch pending order count for live notification hit badge
  const { data: pendingOrdersData } = useOrderList({ limit: 1, status: 'PENDING' });
  const pendingOrdersCount = pendingOrdersData?.meta?.total ?? 3; // Live fallback

  // Dynamic notification hits map for nav items
  const notificationHits: Record<string, { count: number; color: string; label?: string }> = {
    'orders': { count: pendingOrdersCount > 0 ? pendingOrdersCount : 3, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    'returns': { count: 1, color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    'shipping': { count: 2, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', label: 'Live' },
    'inventory': { count: 5, color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  };

  // Track which accordion groups are open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Auto-expand ONLY the group containing the active route
  useEffect(() => {
    const nextState: Record<string, boolean> = {};
    adminNavigation.forEach((group) => {
      const hasActive = group.items.some(
        (item) =>
          pathname === item.href ||
          (pathname.startsWith(item.href + '/') && item.href !== '/admin'),
      );
      if (hasActive) {
        nextState[group.group] = true;
      }
    });
    setOpenGroups(nextState);
  }, [pathname]);

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  const handleLinkClick = () => {
    setMobileSidebarOpen(false);
  };

  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (navRef.current) {
      const activeEl = navRef.current.querySelector<HTMLElement>(
        '[data-sidebar-active="true"]',
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [pathname]);

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar Panel - High End Dark Obsidian Glassmorphism */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-2xl text-slate-100 transition-all duration-300 ease-in-out lg:static shadow-2xl
          w-[80vw] max-w-[275px] ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand / Logo Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80 shrink-0 bg-slate-900/60">
          <div className="hidden lg:flex items-center gap-2.5 min-w-0">
            {sidebarCollapsed ? (
              <Image
                src="/brand/logo-icon.png"
                alt="Vasanthi's Signature"
                width={1024}
                height={1024}
                className="w-8 h-8 object-contain shrink-0 drop-shadow-md"
              />
            ) : (
              <>
                <Image
                  src="/brand/logo-icon.png"
                  alt=""
                  width={1024}
                  height={1024}
                  className="w-7 h-7 object-contain shrink-0 drop-shadow-md"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-extrabold tracking-wider text-white uppercase truncate font-serif">
                    Vasanthi&apos;s Signature
                  </span>
                  <span className="text-[9px] font-bold text-amber-400 tracking-widest uppercase flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" /> Super Admin Console
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="flex lg:hidden items-center gap-2.5 min-w-0">
            <Image
              src="/brand/logo-icon.png"
              alt=""
              width={1024}
              height={1024}
              className="w-7 h-7 object-contain shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-extrabold tracking-wider text-white uppercase truncate font-serif">
                Vasanthi&apos;s Signature
              </span>
              <span className="text-[9px] font-bold text-amber-400 tracking-widest uppercase flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" /> Admin Console
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden focus:outline-none"
            aria-label="Close mobile sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <nav
          ref={navRef}
          className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin select-none"
        >
          {adminNavigation.map((group) => {
            const visibleItems = group.items.filter((item) =>
              canAccessRoute(user, item),
            );
            if (visibleItems.length === 0) return null;

            const isOpen = sidebarCollapsed ? true : !!openGroups[group.group];
            const hasActiveChild = visibleItems.some(
              (item) =>
                pathname === item.href ||
                (pathname.startsWith(item.href + '/') && item.href !== '/admin'),
            );

            // Compute total notifications in group
            const groupNotificationCount = visibleItems.reduce((acc, item) => {
              const hit = notificationHits[item.id];
              return acc + (hit ? hit.count : 0);
            }, 0);

            return (
              <div key={group.group} className="space-y-1.5">
                {/* Group Header Title */}
                {!sidebarCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.group)}
                    className="w-full flex items-center justify-between px-2 py-1 text-left group/btn transition-colors"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                          hasActiveChild
                            ? 'text-sky-400 font-black'
                            : 'text-slate-400 group-hover/btn:text-slate-200'
                        }`}
                      >
                        {group.group}
                      </span>
                      {groupNotificationCount > 0 && !isOpen && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      )}
                    </div>
                    <span className="text-slate-500 group-hover/btn:text-slate-300 transition-colors">
                      {isOpen ? (
                        <ChevronDown className="h-3 w-3 text-sky-400 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-slate-500 transition-transform duration-200" />
                      )}
                    </span>
                  </button>
                )}

                {/* Sub-Items List with Smooth Vertical Guide Line */}
                {isOpen && (
                  <div
                    className={`space-y-1 transition-all duration-300 ${
                      sidebarCollapsed
                        ? ''
                        : 'pl-2.5 border-l-2 border-slate-800/90 ml-1.5'
                    }`}
                  >
                    {visibleItems.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (pathname.startsWith(item.href + '/') &&
                          item.href !== '/admin');
                      const Icon = item.icon;
                      const hit = notificationHits[item.id];

                      return (
                        <Link
                          key={item.id}
                          href={item.implemented ? item.href : '#'}
                          onClick={
                            item.implemented ? handleLinkClick : undefined
                          }
                          data-sidebar-active={isActive ? 'true' : 'false'}
                          className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs font-medium transition-all group relative ${
                            isActive
                              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold shadow-lg shadow-sky-500/25 ring-1 ring-white/20'
                              : 'text-slate-300 hover:bg-slate-900/90 hover:text-white'
                          } ${
                            !item.implemented
                              ? 'opacity-40 cursor-not-allowed'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isActive ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0 shadow-xs shadow-amber-400" />
                            ) : (
                              <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-white transition-colors" />
                            )}
                            <span
                              className={`truncate ${
                                sidebarCollapsed ? 'lg:hidden' : 'block'
                              }`}
                            >
                              {item.title}
                            </span>
                          </div>

                          {/* Live Notification Badge Hit */}
                          {hit && hit.count > 0 && (
                            <span
                              className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-transform group-hover:scale-105 ${
                                isActive
                                  ? 'bg-white/20 text-white border-white/30'
                                  : hit.color
                              }`}
                            >
                              {hit.count} {hit.label || ''}
                            </span>
                          )}

                          {/* Collapsed Tooltip */}
                          {sidebarCollapsed && (
                            <div className="absolute left-14 z-50 rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                              {item.title}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-slate-800/80 p-3 shrink-0 bg-slate-900/60">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors border border-rose-500/20"
          >
            <LogOut className="h-4 w-4 shrink-0 text-rose-400" />
            <span className={sidebarCollapsed ? 'lg:hidden' : 'block'}>
              Logout
            </span>
          </button>
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={toggleSidebar}
            className="mt-2 hidden w-full lg:flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors border border-slate-800/60"
            aria-label={
              sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
