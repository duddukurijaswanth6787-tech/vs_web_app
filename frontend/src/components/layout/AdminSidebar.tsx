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
  Sparkles,
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
          className="fixed inset-0 z-40 bg-neutral-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-neutral-200/80 bg-white/95 backdrop-blur-md transition-all duration-300 ease-in-out lg:static
          w-[80vw] max-w-[270px] ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand / Logo Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-100 shrink-0 bg-white/50">
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
                  <span className="text-[9px] font-bold text-[var(--brand-primary)] tracking-widest uppercase flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Super Admin
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
              <span className="text-[9px] font-bold text-[var(--brand-primary)] tracking-widest uppercase flex items-center gap-1">
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

            const isOpen = sidebarCollapsed ? true : openGroups[group.group] !== false; // Default open for clean navigation
            const hasActiveChild = visibleItems.some(
              (item) =>
                pathname === item.href ||
                (pathname.startsWith(item.href + '/') && item.href !== '/admin'),
            );

            return (
              <div key={group.group} className="space-y-1">
                {/* Group Header Title */}
                {!sidebarCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.group)}
                    className="w-full flex items-center justify-between px-2 py-1 text-left group/btn"
                  >
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        hasActiveChild
                          ? 'text-[var(--brand-primary)] font-extrabold'
                          : 'text-neutral-400 group-hover/btn:text-neutral-700'
                      }`}
                    >
                      {group.group}
                    </span>
                    <span className="text-neutral-400 group-hover/btn:text-neutral-600 transition-colors">
                      {isOpen ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </span>
                  </button>
                )}

                {/* Sub-Items List with Vertical Guide Line */}
                {isOpen && (
                  <div className={`space-y-0.5 ${sidebarCollapsed ? '' : 'pl-2 border-l border-neutral-200/80 ml-1.5'}`}>
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
                              : 'text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-950'
                          } ${
                            !item.implemented
                              ? 'opacity-40 cursor-not-allowed'
                              : ''
                          }`}
                        >
                          <Icon
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isActive ? 'text-amber-400' : 'text-neutral-500 group-hover:text-neutral-900'
                            }`}
                          />
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
        <div className="border-t border-neutral-100 p-3 shrink-0 bg-white/50">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={sidebarCollapsed ? 'lg:hidden' : 'block'}>
              Logout
            </span>
          </button>
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={toggleSidebar}
            className="mt-1.5 hidden w-full lg:flex items-center justify-center rounded-xl p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
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
