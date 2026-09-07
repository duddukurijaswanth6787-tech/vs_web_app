'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Package, Warehouse, Headset, UserCircle, Clock } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/staff/dashboard', label: 'Shift & Tasks', icon: LayoutGrid },
  { href: '/staff/attendance', label: 'Work Hours', icon: Clock },
  { href: '/staff/packing', label: 'Packing', icon: Package },
  { href: '/staff/warehouse', label: 'Warehouse', icon: Warehouse },
  { href: '/staff/profile', label: 'Profile', icon: UserCircle },
];

export function StaffPortalNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-neutral-950/90 backdrop-blur-md border-t border-neutral-800 fixed bottom-0 inset-x-0 z-40 flex items-stretch sm:static sm:border-t-0 sm:border-b sm:px-4">
      <div className="max-w-4xl mx-auto w-full flex items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 sm:px-4 text-[11px] sm:text-xs font-semibold transition-colors ${
                active
                  ? 'text-sky-400 bg-sky-500/10 border-t-2 border-sky-400 sm:border-t-0 sm:border-b-2'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
