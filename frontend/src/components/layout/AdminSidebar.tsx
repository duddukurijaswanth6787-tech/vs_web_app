'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, X, LogOut } from 'lucide-react';
import { adminNavigation } from '@/config/navigation';
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

  const handleLinkClick = () => {
    setMobileSidebarOpen(false);
  };

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
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-neutral-200 bg-white transition-all duration-300 lg:static
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand / Logo Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-100">
          {!sidebarCollapsed ? (
            <span className="text-xs font-bold tracking-wider text-neutral-900 uppercase">
              Vasanthi's Signature Admin
            </span>
          ) : (
            <span className="text-xs font-black tracking-tighter text-neutral-900">
              VD
            </span>
          )}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100 lg:hidden"
            aria-label="Close mobile sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Navigation Groups */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin">
          {adminNavigation.map((group) => {
            // Filter items by current user permissions
            const visibleItems = group.items.filter((item) => canAccessRoute(user, item));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.group} className="space-y-1.5">
                {!sidebarCollapsed && (
                  <h4 className="px-3 text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                    {group.group}
                  </h4>
                )}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.id}
                        href={item.implemented ? item.href : '#'}
                        onClick={item.implemented ? handleLinkClick : undefined}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors group relative
                          ${isActive 
                            ? 'bg-neutral-900 text-white' 
                            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                          }
                          ${!item.implemented ? 'opacity-40 cursor-not-allowed' : ''}
                        `}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!sidebarCollapsed && (
                          <span className="truncate">{item.title}</span>
                        )}
                        {!item.implemented && !sidebarCollapsed && (
                          <span className="ml-auto text-[9px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded uppercase font-semibold">
                            Phase 2
                          </span>
                        )}
                        {/* Collapsed tooltip */}
                        {sidebarCollapsed && (
                          <div className="absolute left-14 z-50 rounded-md bg-neutral-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {item.title} {!item.implemented && '(Phase 2)'}
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

        {/* Footer actions */}
        <div className="border-t border-neutral-100 p-3">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={toggleSidebar}
            className="mt-2 hidden w-full lg:flex items-center justify-center rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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
