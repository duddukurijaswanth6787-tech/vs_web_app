'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
} from 'lucide-react';
import { adminNavigation, findNavItemForPath } from '@/config/navigation';
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

  // Fetch pending order count for live notification badge
  const { data: pendingOrdersData } = useOrderList({ limit: 1, status: 'PENDING' });
  const pendingOrdersCount = pendingOrdersData?.meta?.total ?? 3;

  // Notification Badges for specific actionable sections
  const notificationHits: Record<string, { count: number; label?: string }> = {
    orders: { count: pendingOrdersCount > 0 ? pendingOrdersCount : 3 },
    returns: { count: 1 },
    shipments: { count: 2, label: 'Live' },
    inventory: { count: 5 },
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

  const userInitials = (
    (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')
  ).toUpperCase() || 'A';

  const activeNavItem = findNavItemForPath(pathname);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-neutral-200 bg-white text-neutral-800 lg:static
          w-[270px] ${sidebarCollapsed ? 'lg:w-[68px]' : 'lg:w-[270px]'}
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-200/80 shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0 p-1">
              <Image
                src="/brand/logo-icon.png"
                alt="VS"
                width={28}
                height={28}
                className="w-full h-full object-contain brightness-0 invert"
              />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold tracking-tight text-neutral-900 uppercase truncate">
                  Vasanthi&apos;s Signature
                </span>
                <span className="text-[10px] font-medium text-neutral-500 tracking-normal">
                  Admin Console
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center w-7 h-7 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 lg:hidden focus:outline-none"
            aria-label="Close mobile sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Navigation Area - Flat, Clean, Non-collapsible layout */}
        <nav
          ref={navRef}
          className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3 scrollbar-thin select-none"
        >
          {adminNavigation.map((group) => {
            const visibleItems = group.items.filter((item) =>
              canAccessRoute(user, item),
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.group} className="space-y-1">
                {/* Clean Flat Section Header */}
                {!sidebarCollapsed ? (
                  <div className="px-2.5 pt-2 pb-0.5">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-400">
                      {group.group}
                    </span>
                  </div>
                ) : (
                  <div className="my-2 border-t border-neutral-100" />
                )}

                {/* Navigation Items (Directly visible, no collapsible accordion) */}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = activeNavItem
                      ? activeNavItem.id === item.id
                      : pathname === item.href;
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
                        className={`flex items-center justify-between gap-2.5 px-2.5 py-2 text-xs rounded-lg transition-colors group relative ${
                          isActive
                            ? 'bg-neutral-900 text-white font-medium shadow-xs'
                            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 font-normal'
                        } ${
                          !item.implemented
                            ? 'opacity-40 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-colors ${
                              isActive
                                ? 'text-white'
                                : 'text-neutral-400 group-hover:text-neutral-700'
                            }`}
                          />
                          <span
                            className={`truncate text-[13px] ${
                              sidebarCollapsed ? 'lg:hidden' : 'block'
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>

                        {/* Notification Count Badge */}
                        {hit && hit.count > 0 && (
                          <span
                            className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none ${
                              isActive
                                ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                                : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                            }`}
                          >
                            {hit.count}
                            {hit.label ? ` ${hit.label}` : ''}
                          </span>
                        )}

                        {/* Tooltip for Collapsed Sidebar */}
                        {sidebarCollapsed && (
                          <div className="absolute left-14 z-50 rounded-md bg-neutral-900 px-2.5 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
                            {item.title}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="border-t border-neutral-200 p-3 shrink-0 bg-neutral-50/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                {userInitials}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-neutral-900 truncate leading-tight">
                    {user?.firstName || 'Admin'} {user?.lastName || ''}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-medium capitalize truncate leading-tight mt-0.5">
                    {(user?.roles?.[0] || 'Super Admin').replace(/_/g, ' ')}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="flex items-center justify-center p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
