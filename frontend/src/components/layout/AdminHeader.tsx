'use client';

import React from 'react';
import { Menu, Activity, LogOut, Search } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { healthService } from '@/services/health.service';
import { queryKeys } from '@/lib/query/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';
import StaffPunchWidget from '@/components/staff/StaffPunchWidget';


export default function AdminHeader() {
  const { toggleMobileSidebar, openCommandPalette } = useUIStore();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const pathname = usePathname();

  // Poll backend health status silently
  const { data: health, status: healthQueryStatus } = useQuery({
    queryKey: queryKeys.health.status(),
    queryFn: healthService.getHealth,
    refetchInterval: 30000, // Poll every 30 seconds
    retry: 1,
  });

  const getHealthIndicator = () => {
    if (healthQueryStatus === 'pending') {
      return { color: 'bg-neutral-300', text: 'Checking Status' };
    }
    if (healthQueryStatus === 'error') {
      return { color: 'bg-red-500 animate-pulse', text: 'System Down' };
    }
    if (health?.status === 'ok') {
      return { color: 'bg-green-500', text: 'System Healthy' };
    }
    return { color: 'bg-yellow-500', text: 'System Degraded' };
  };

  const healthIndicator = getHealthIndicator();

  const getHeaderTitle = () => {
    if (!pathname) return 'Dashboard';
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Dashboard';
    const last = segments[segments.length - 1];
    const secondLast = segments.length > 1 ? segments[segments.length - 2] : '';
    
    // If the last segment is a UUID or alphanumeric ID
    if (/^[0-9a-fA-F-]{16,}$/.test(last) || /^\d+$/.test(last)) {
      if (secondLast === 'orders') return 'Order Details';
      if (secondLast === 'products') return 'Product Details';
      if (secondLast === 'customers') return 'Customer Profile';
      if (secondLast === 'invoices') return 'Invoice Details';
      if (secondLast === 'returns') return 'Return Details';
      if (secondLast === 'warehouses') return 'Warehouse Details';
      return `${secondLast ? secondLast.replace(/-/g, ' ') : 'Item'} Details`;
    }
    return last.replace(/-/g, ' ');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-neutral-200 bg-white px-2.5 sm:px-4">
      {/* Left section: mobile trigger and page title */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 mr-2">
        <button
          onClick={toggleMobileSidebar}
          className="rounded-lg p-1.5 sm:p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden shrink-0 min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-xs sm:text-base font-bold text-neutral-900 capitalize truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none">
          {getHeaderTitle()}
        </h1>
      </div>

      {/* Right section: Search, System health indicator and profile dropdown */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Command Palette Trigger */}
        <button
          onClick={openCommandPalette}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 sm:px-3 sm:py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 transition-colors min-h-[34px] sm:min-h-[38px] cursor-pointer"
          aria-label="Open command palette"
        >
          <Search className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-neutral-200 bg-white px-1 py-0.5 text-[10px] font-mono text-neutral-400">
            ⌘K
          </kbd>
        </button>

        {/* Staff Attendance Punch-In / Live Stopwatch Widget */}
        <StaffPunchWidget />

        {/* Notification Bell */}
        <NotificationBell />

        {/* Real-time Health Indicator */}
        <Link
          href="/admin/system/health"
          className="hidden sm:flex items-center justify-center gap-2 rounded-full border border-neutral-100 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors min-h-[38px]"
          title={healthIndicator.text}
        >
          <span className={`h-2 w-2 rounded-full shrink-0 ${healthIndicator.color}`} />
          <span>{healthIndicator.text}</span>
        </Link>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-full border border-neutral-200 p-1 hover:bg-neutral-50 transition-colors min-h-[38px]"
            aria-expanded={dropdownOpen}
            aria-label="User menu"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white uppercase">
              {user?.firstName?.[0] || 'A'}
            </div>
            <div className="hidden text-left md:block pr-1">
              <p className="text-xs font-bold text-neutral-800">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-neutral-400 capitalize">
                {user?.roles?.[0]?.replace('_', ' ') || 'Staff'}
              </p>
            </div>
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md border border-neutral-100 bg-white p-1 shadow-lg ring-1 ring-black/5 z-20">
                <div className="px-3 py-2 border-b border-neutral-50">
                  <p className="text-xs font-semibold text-neutral-800 truncate">
                    {user?.email}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    User ID: {user?.id?.substring(0, 8)}...
                  </p>
                </div>
                <div className="py-1">
                  <Link
                    href="/admin/system/health"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    System Status
                  </Link>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
