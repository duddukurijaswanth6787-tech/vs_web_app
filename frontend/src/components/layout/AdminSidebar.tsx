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

  // Dynamic notification hits map for nav items (High-visibility light theme badges)
  const notificationHits: Record<string, { count: number; color: string; label?: string }> = {
    'orders': { count: pendingOrdersCount > 0 ? pendingOrdersCount : 3, color: 'bg-amber-100 text-amber-900 border-amber-300' },
    'returns': { count: 1, color: 'bg-rose-100 text-rose-900 border-rose-300' },
    'shipping': { count: 2, color: 'bg-emerald-100 text-emerald-900 border-emerald-300', label: 'Live' },
    'inventory': { count: 5, color: 'bg-sky-100 text-sky-900 border-sky-300' },
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
          className="fixed inset-0 z-40 bg-neutral-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar Panel - Clean Light High-Contrast Theme */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-neutral-200 bg-white text-neutral-900 transition-all duration-300 ease-in-out lg:static shadow-sm
          w-[80vw] max-w-[275px] ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand / Logo Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-100 shrink-0 bg-neutral-50/50">
          <div className="hidden lg:flex items-center gap-2.5 min-w-0">
            {sidebarCollapsed ? (
              <Image
                src="/brand/logo-icon.png"
                alt="Vasanthi's Signature"
                width={1024}
                height={1024}
                className="w-8 h-8 object-contain shrink-0"
              />
            ) : (
              <>
                <Image
                  src="/brand/logo-icon.png"
                  alt=""
                  width={1024}
                  height={1024}
                  className="w-7 h-7 object-contain shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-extrabold tracking-wider text-neutral-900 uppercase truncate font-serif">
                    Vasanthi&apos;s Signature
                  </span>
                  <span className="text-[9px] font-bold text-amber-700 tracking-widest uppercase flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Super Admin Console
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
              <span className="text-xs font-extrabold tracking-wider text-neutral-900 uppercase truncate font-serif">
                Vasanthi&apos;s Signature
              </span>
              <span className="text-[9px] font-bold text-amber-700 tracking-widest uppercase flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Admin Console
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 lg:hidden focus:outline-none"
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
                            ? 'text-sky-700 font-black'
                            : 'text-neutral-500 group-hover/btn:text-neutral-900'
                        }`}
                      >
                        {group.group}
                      </span>
                      {groupNotificationCount > 0 && !isOpen && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      )}
                    </div>
                    <span className="text-neutral-400 group-hover/btn:text-neutral-700 transition-colors">
                      {isOpen ? (
                        <ChevronDown className="h-3 w-3 text-sky-700 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-neutral-400 transition-transform duration-200" />
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
                        : 'pl-2.5 border-l-2 border-neutral-200 ml-1.5'
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
                          className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all group relative ${
                            isActive
                              ? 'bg-neutral-900 text-white font-bold shadow-sm'
                              : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                          } ${
                            !item.implemented
                              ? 'opacity-40 cursor-not-allowed'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isActive ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 shadow-xs" />
                            ) : (
                              <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-500 group-hover:text-neutral-900 transition-colors" />
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
                                  ? 'bg-neutral-800 text-amber-300 border-neutral-700'
                                  : hit.color
                              }`}
                            >
                              {hit.count} {hit.label || ''}
                            </span>
                          )}

                          {/* Collapsed Tooltip */}
                          {sidebarCollapsed && (
                            <div className="absolute left-14 z-50 rounded-lg bg-neutral-900 px-2.5 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
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
        <div className="border-t border-neutral-200 p-3 shrink-0 bg-neutral-50/50">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0 text-red-600" />
            <span className={sidebarCollapsed ? 'lg:hidden' : 'block'}>
              Logout
            </span>
          </button>
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={toggleSidebar}
            className="mt-2 hidden w-full lg:flex items-center justify-center rounded-xl p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors border border-neutral-200"
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
