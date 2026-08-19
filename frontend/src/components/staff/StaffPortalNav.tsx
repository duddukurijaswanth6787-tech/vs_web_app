'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Package, Warehouse, Headset, UserCircle } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/staff/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/staff/packing', label: 'Packing', icon: Package },
  { href: '/staff/warehouse', label: 'Warehouse', icon: Warehouse },
  { href: '/staff/support', label: 'Support', icon: Headset },
  { href: '/staff/profile', label: 'Profile', icon: UserCircle },
];

export function StaffPortalNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-neutral-950 border-t border-neutral-800 fixed bottom-0 inset-x-0 z-40 flex items-stretch sm:static sm:border-t-0 sm:border-b sm:px-4">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-2 sm:py-3 sm:px-4 text-[10px] sm:text-xs font-bold transition-colors ${
              active ? 'text-rose-400' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Icon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
