'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Package, Warehouse, Headset, UserCircle, Clock } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/staff/dashboard', label: 'Shift & Tasks', icon: LayoutGrid },
  { href: '/staff/attendance', label: 'Work Hours', icon: Clock },
  { href: '/staff/profile', label: 'Staff Profile', icon: UserCircle },
];

export function StaffPortalNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-14 z-20 shadow-2xs">
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
  );
}
