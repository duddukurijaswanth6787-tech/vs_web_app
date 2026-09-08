'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Clock, UserCircle, CheckSquare } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/staff/dashboard', label: 'Shift & Tasks', shortLabel: 'Tasks', icon: LayoutGrid },
  { href: '/staff/attendance', label: 'Work Hours', shortLabel: 'Hours', icon: Clock },
  { href: '/staff/profile', label: 'Staff Profile', shortLabel: 'Profile', icon: UserCircle },
];

export function StaffPortalNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop / Tablet Top Nav */}
      <nav className="hidden sm:block bg-white border-b border-neutral-200 sticky top-14 z-20 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-2 overflow-x-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                  active
                    ? 'text-[var(--brand-primary)] border-[var(--brand-primary)] bg-sky-50/50'
                    : 'text-neutral-500 border-transparent hover:text-neutral-900 hover:border-neutral-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[var(--brand-primary)]' : 'text-neutral-400'}`} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Fixed Bottom Navigation Bar - Optimized for Smart Phones */}
      <nav
        aria-label="Mobile Navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-3 pt-2 pb-[max(0.65rem,env(safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-3 gap-1.5 max-w-md mx-auto">
          {NAV_ITEMS.map(({ href, label, shortLabel, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-center transition-all duration-200 active:scale-95 ${
                  active
                    ? 'text-[var(--brand-primary)] bg-sky-50/80 font-bold shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 mb-0.5 ${active ? 'text-[var(--brand-primary)] stroke-[2.4]' : 'text-neutral-400'}`} />
                  {active && (
                    <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[var(--brand-primary)] ring-2 ring-white" />
                  )}
                </div>
                <span className={`text-[11px] leading-tight tracking-tight truncate w-full ${active ? 'font-bold' : 'font-medium'}`}>
                  {shortLabel || label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

