'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  LogOut,
} from 'lucide-react';
import { adminNavigation, findNavItemForPath } from '@/config/navigation';
import { useUIStore } from '@/stores/ui.store';
import { useAuth } from '@/hooks/useAuth';
import { canAccessRoute } from '@/lib/permissions/rules';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const {
    sidebarCollapsed,
    mobileSidebarOpen,
    toggleSidebar,
    setMobileSidebarOpen,
  } = useUIStore();

  // Find active nav item to auto-expand its group
  const activeItem = useMemo(() => findNavItemForPath(pathname), [pathname]);

  // Track which accordion groups are open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Auto-expand group containing current active pathname
  useEffect(() => {
    adminNavigation.forEach((group) => {
      const hasActive = group.items.some(
        (item) => pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/admin'),
      );
      if (hasActive) {
        setOpenGroups((prev) => ({ ...prev, [group.group]: true }));
      }
    });
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
          className="fixed inset-0 z-40 bg-neutral-900/50 lg:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-neutral-200 bg-white transition-all duration-300 ease-in-out lg:static
          w-[80vw] max-w-[280px] ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand / Logo Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-100 shrink-0">
          <div className="hidden lg:flex items-center gap-2 min-w-0">
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
                <span className="text-xs font-bold tracking-wider text-neutral-900 uppercase truncate">
                  Vasanthi&apos;s Signature Admin
                </span>
              </>
            )}
          </div>
          <div className="flex lg:hidden items-center gap-2 min-w-0">
            <Image
              src="/brand/logo-icon.png"
              alt=""
              width={1024}
              height={1024}
              className="w-7 h-7 object-contain shrink-0"
            />
            <span className="text-xs font-bold tracking-wider text-neutral-900 uppercase truncate">
              Vasanthi&apos;s Signature Admin
            </span>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 lg:hidden focus:outline-none"
            aria-label="Close mobile sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Accordion Navigation */}
        <nav
          ref={navRef}
          className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin select-none"
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

            return (
              <div
                key={group.group}
                className="rounded-xl border border-neutral-200/70 bg-neutral-50/50 overflow-hidden transition-all shadow-2xs"
              >
                {/* Accordion Group Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.group)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                    hasActiveChild
                      ? 'bg-sky-100/70 text-sky-950 font-bold border-b border-sky-200/60'
                      : 'hover:bg-neutral-100/80 text-neutral-800 font-semibold'
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      sidebarCollapsed ? 'lg:hidden' : 'block'
                    }`}
                  >
                    {group.group}
                  </span>
                  <span
                    className={`text-[10px] text-neutral-400 font-bold ${
                      sidebarCollapsed ? 'lg:block hidden' : 'hidden'
                    }`}
                  >
                    •••
                  </span>
                  {!sidebarCollapsed && (
                    <span className="text-neutral-400 shrink-0">
                      {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 text-neutral-600" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                      )}
                    </span>
                  )}
                </button>

                {/* Accordion Sub-Items List */}
                {isOpen && (
                  <div className="p-1 space-y-0.5 border-t border-neutral-100 bg-white">
                    {visibleItems.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (pathname.startsWith(item.href + '/') &&
                          item.href !== '/admin');
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.id}
                          href={item.implemented ? item.href : '#'}
                          onClick={
                            item.implemented ? handleLinkClick : undefined
                          }
                          data-sidebar-active={isActive ? 'true' : 'false'}
                          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all group relative ${
                            isActive
                              ? 'bg-neutral-900 text-white font-bold shadow-xs'
                              : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                          } ${
                            !item.implemented
                              ? 'opacity-40 cursor-not-allowed'
                              : ''
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span
                            className={`truncate ${
                              sidebarCollapsed ? 'lg:hidden' : 'block'
                            }`}
                          >
                            {item.title}
                          </span>
                          {/* Collapsed Tooltip */}
                          {sidebarCollapsed && (
                            <div className="absolute left-14 z-50 rounded-md bg-neutral-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
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
        <div className="border-t border-neutral-100 p-3 shrink-0">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={sidebarCollapsed ? 'lg:hidden' : 'block'}>
              Logout
            </span>
          </button>
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={toggleSidebar}
            className="mt-2 hidden w-full lg:flex items-center justify-center rounded-xl p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
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
