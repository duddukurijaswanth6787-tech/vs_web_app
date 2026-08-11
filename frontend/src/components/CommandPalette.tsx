'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '@/stores/ui.store';
import { queryKeys } from '@/lib/query/client';
import { apiClient } from '@/lib/api/client';
import { adminNavigation } from '@/config/navigation';
import {
  Search,
  X,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Clock,
  Trash2,
  Package,
  ShoppingCart,
  Users,
  FolderOpen,
  Tag,
  Gift,
  Star,
  ImageIcon,
  BarChart3,
  FileText,
  Plus,
} from 'lucide-react';

// ponytail: all in one file, no separate SearchProvider/SearchResult/SearchDialog

interface GlobalSearchResult {
  products: { id: string; name: string; sku: string; slug: string; basePrice: number }[];
  orders: { id: string; orderNumber: string; status: string; grandTotal: number; currency: string }[];
  customers: { id: string; firstName: string; lastName: string; email: string }[];
  categories: { id: string; name: string; slug: string }[];
  brands: { id: string; name: string; slug: string }[];
  coupons: { id: string; code: string; name: string; type: string }[];
  reviews: { id: string; title: string; status: string; rating: number }[];
  banners: { id: string; title: string; placement: string }[];
  invoices: { id: string; invoiceNumber: string; status: string }[];
  offers: { id: string; name: string; type: string }[];
  faqs: { id: string; question: string; category: string }[];
}

interface CommandItem {
  id: string;
  type: 'command' | 'recent' | 'product' | 'order' | 'customer' | 'category' | 'brand' | 'coupon' | 'review' | 'banner' | 'invoice' | 'offer' | 'faq' | 'page';
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ponytail: reuse navigation items as commands
const NAVIGATION_ITEMS = adminNavigation.flatMap((g) =>
  g.items.filter((i) => i.implemented).map((i) => ({
    id: i.id,
    type: 'page' as const,
    label: i.title,
    href: i.href,
    icon: i.icon,
  }))
);

const RECENT_SEARCHES_KEY = 'vd_command_palette_recent';
const MAX_RECENT = 10;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch {
    return [];
  }
}

function addRecentSearch(q: string) {
  const recent = getRecentSearches().filter((s) => s !== q);
  recent.unshift(q);
  if (recent.length > MAX_RECENT) recent.pop();
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

// Icon mapping for search result types
const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  product: Package,
  order: ShoppingCart,
  customer: Users,
  category: FolderOpen,
  brand: Tag,
  coupon: Gift,
  review: Star,
  banner: ImageIcon,
  invoice: FileText,
  offer: Gift,
  faq: FileText,
  page: BarChart3,
};

const TYPE_COLORS: Record<string, string> = {
  product: 'text-blue-600',
  order: 'text-green-600',
  customer: 'text-purple-600',
  category: 'text-amber-600',
  brand: 'text-pink-600',
  coupon: 'text-orange-600',
  review: 'text-yellow-600',
  banner: 'text-cyan-600',
  invoice: 'text-indigo-600',
  offer: 'text-rose-600',
  faq: 'text-teal-600',
  page: 'text-neutral-600',
};

// Create commands
const CREATE_COMMANDS: CommandItem[] = [
  { id: 'create-product', type: 'command', label: 'Create Product', href: '/admin/catalog/products/new', icon: Plus },
  { id: 'create-category', type: 'command', label: 'Create Category', href: '/admin/catalog/categories', icon: Plus },
  { id: 'create-brand', type: 'command', label: 'Create Brand', href: '/admin/catalog/brands', icon: Plus },
  { id: 'create-coupon', type: 'command', label: 'Create Coupon', href: '/admin/promotions/coupons', icon: Plus },
  { id: 'create-banner', type: 'command', label: 'Create Banner', href: '/admin/banners', icon: Plus },
];

export default function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, closeCommandPalette } = useUIStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load recent searches on open
  useEffect(() => {
    if (commandPaletteOpen) {
      setRecentSearches(getRecentSearches());
      setQuery('');
      setSelectedIndex(0);
      // Focus input on next tick
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  // Fetch global search results
  const { data: searchResults, isLoading } = useQuery({
    queryKey: queryKeys.search.global(query),
    queryFn: async () => {
      const response = await apiClient.get<GlobalSearchResult>('/search/global', {
        params: { q: query, limit: 5 },
      });
      return response.data;
    },
    enabled: commandPaletteOpen && query.length >= 2,
    staleTime: 30000, // ponytail: 30s cache, good enough
  });

  // Build items list based on query
  const items: CommandItem[] = React.useMemo(() => {
    if (query.length < 2) {
      // Show recent searches and commands when no query
      const recentItems: CommandItem[] = recentSearches.map((s) => ({
        id: `recent-${s}`,
        type: 'recent',
        label: s,
        href: '#',
        icon: Clock,
      }));

      return [...recentItems, ...CREATE_COMMANDS, ...NAVIGATION_ITEMS.slice(0, 8)];
    }

    if (!searchResults) return [];

    // Map search results to CommandItems
    const resultItems: CommandItem[] = [];

    for (const product of searchResults.products || []) {
      resultItems.push({
        id: `product-${product.id}`,
        type: 'product',
        label: product.name,
        sublabel: `${product.sku} · ₹${product.basePrice}`,
        href: `/admin/catalog/products/${product.id}`,
        icon: Package,
      });
    }

    for (const order of searchResults.orders || []) {
      resultItems.push({
        id: `order-${order.id}`,
        type: 'order',
        label: order.orderNumber,
        sublabel: `${order.status} · ₹${order.grandTotal}`,
        href: `/admin/orders/${order.id}`,
        icon: ShoppingCart,
      });
    }

    for (const customer of searchResults.customers || []) {
      resultItems.push({
        id: `customer-${customer.id}`,
        type: 'customer',
        label: `${customer.firstName} ${customer.lastName}`,
        sublabel: customer.email,
        href: `/admin/customers/${customer.id}`,
        icon: Users,
      });
    }

    for (const category of searchResults.categories || []) {
      resultItems.push({
        id: `category-${category.id}`,
        type: 'category',
        label: category.name,
        sublabel: `/${category.slug}`,
        href: `/admin/catalog/categories`,
        icon: FolderOpen,
      });
    }

    for (const brand of searchResults.brands || []) {
      resultItems.push({
        id: `brand-${brand.id}`,
        type: 'brand',
        label: brand.name,
        sublabel: `/${brand.slug}`,
        href: `/admin/catalog/brands`,
        icon: Tag,
      });
    }

    for (const coupon of searchResults.coupons || []) {
      resultItems.push({
        id: `coupon-${coupon.id}`,
        type: 'coupon',
        label: coupon.code,
        sublabel: `${coupon.name} · ${coupon.type}`,
        href: `/admin/promotions/coupons`,
        icon: Gift,
      });
    }

    for (const review of searchResults.reviews || []) {
      resultItems.push({
        id: `review-${review.id}`,
        type: 'review',
        label: review.title || 'Untitled Review',
        sublabel: `${review.status} · ${review.rating}★`,
        href: `/admin/customers/reviews`,
        icon: Star,
      });
    }

    for (const banner of searchResults.banners || []) {
      resultItems.push({
        id: `banner-${banner.id}`,
        type: 'banner',
        label: banner.title,
        sublabel: banner.placement,
        href: `/admin/banners`,
        icon: ImageIcon,
      });
    }

    for (const invoice of searchResults.invoices || []) {
      resultItems.push({
        id: `invoice-${invoice.id}`,
        type: 'invoice',
        label: invoice.invoiceNumber,
        sublabel: invoice.status,
        href: `/admin/invoices/${invoice.id}`,
        icon: FileText,
      });
    }

    for (const offer of searchResults.offers || []) {
      resultItems.push({
        id: `offer-${offer.id}`,
        type: 'offer',
        label: offer.name,
        sublabel: offer.type,
        href: `/admin/promotions/offers`,
        icon: Gift,
      });
    }

    for (const faq of searchResults.faqs || []) {
      resultItems.push({
        id: `faq-${faq.id}`,
        type: 'faq',
        label: faq.question,
        sublabel: faq.category,
        href: `/admin/faqs`,
        icon: FileText,
      });
    }

    // Also add matching navigation items
    const matchingPages = NAVIGATION_ITEMS.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );
    for (const page of matchingPages) {
      resultItems.push({
        ...page,
        id: `page-${page.id}`,
        type: 'page',
        icon: page.icon,
      });
    }

    return resultItems;
  }, [query, searchResults, recentSearches]);

  // Clamp selected index when items change
  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.querySelector(`[data-index="${selectedIndex}"]`);
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (item: CommandItem) => {
      if (item.type === 'recent') {
        setQuery(item.label);
        return;
      }
      if (query.length >= 2) {
        addRecentSearch(query);
      }
      router.push(item.href);
      closeCommandPalette();
    },
    [query, router, closeCommandPalette]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (items[selectedIndex]) {
            handleSelect(items[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          closeCommandPalette();
          break;
      }
    },
    [items, selectedIndex, handleSelect, closeCommandPalette]
  );

  // Close on click outside
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        closeCommandPalette();
      }
    },
    [closeCommandPalette]
  );

  if (!commandPaletteOpen) return null;

  // Group items by type for display
  const grouped = items.reduce<Record<string, CommandItem[]>>((acc, item) => {
    const group = item.type === 'recent' ? 'Recent Searches' :
                  item.type === 'command' ? 'Quick Actions' :
                  item.type === 'page' ? 'Pages' :
                  `${item.type.charAt(0).toUpperCase()}${item.type.slice(1)}s`;
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[20vh]"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="w-full max-w-2xl rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
          <Search className="h-5 w-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search products, orders, customers..."
            className="flex-1 bg-transparent text-sm text-neutral-900 placeholder-neutral-400 outline-none"
            aria-label="Search"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="rounded p-1 text-neutral-400 hover:text-neutral-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-mono text-neutral-500">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto">
          {isLoading && query.length >= 2 && (
            <div className="px-4 py-8 text-center text-sm text-neutral-400">
              Searching...
            </div>
          )}

          {!isLoading && query.length >= 2 && items.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-neutral-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {Object.entries(grouped).map(([group, groupItems]) => (
            <div key={group}>
              <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-50">
                {group}
              </div>
              {groupItems.map((item) => {
                const globalIndex = items.indexOf(item);
                const isSelected = globalIndex === selectedIndex;
                const Icon = item.icon || TYPE_ICONS[item.type] || Search;
                const colorClass = TYPE_COLORS[item.type] || 'text-neutral-500';

                return (
                  <button
                    key={item.id}
                    data-index={globalIndex}
                    onClick={() => handleSelect(item)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                    }`}
                    aria-selected={isSelected}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {item.label}
                      </p>
                      {item.sublabel && (
                        <p className="text-xs text-neutral-500 truncate">
                          {item.sublabel}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 px-4 py-2.5 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-3 text-[10px] text-neutral-500">
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              <ArrowDown className="h-3 w-3" />
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-neutral-200 bg-white px-1 py-0.5 text-[9px] font-mono">Esc</kbd>
              Close
            </span>
          </div>
          {recentSearches.length > 0 && query.length < 2 && (
            <button
              onClick={() => {
                clearRecentSearches();
                setRecentSearches([]);
              }}
              className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-600"
            >
              <Trash2 className="h-3 w-3" />
              Clear history
            </button>
          )}
        </div>
      </div>
    </div>
  );
}