'use client';

import { useDashboard } from '@/features/storefront/storefront.hooks';
import { PageLoader, SectionLoader } from '@/components/feedback/FeedbackStates';
import { Store, Layout, ToggleLeft, Link2, Share2, Newspaper, Wrench, Eye, Settings, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const quickActions = [
  { label: 'Store Information', href: '/admin/storefront/store', icon: Settings, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'Homepage', href: '/admin/storefront/homepage', icon: Layout, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { label: 'Feature Toggles', href: '/admin/storefront/features', icon: ToggleLeft, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Preview Store', href: '/', icon: ExternalLink, color: 'bg-green-50 text-green-700 border-green-200' },
];

export default function StorefrontDashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <PageLoader />;

  const widgets = [
    { label: 'Store Name', value: data?.storeName ?? '-', icon: Store, color: 'text-blue-600 bg-blue-50' },
    { label: 'Homepage Sections', value: data ? `${data.homepageSectionsEnabled}/${data.homepageSectionsTotal}` : '-', icon: Layout, color: 'text-purple-600 bg-purple-50' },
    { label: 'Features Enabled', value: data ? `${data.featuresEnabled}/${data.featuresTotal}` : '-', icon: ToggleLeft, color: 'text-amber-600 bg-amber-50' },
    { label: 'Footer Links', value: data?.footerLinks ?? 0, icon: Link2, color: 'text-teal-600 bg-teal-50' },
    { label: 'Social Links', value: data?.socialLinks ?? 0, icon: Share2, color: 'text-pink-600 bg-pink-50' },
    { label: 'Newsletter Subs', value: data?.newsletterSubscribers ?? 0, icon: Newspaper, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Maintenance Mode', value: data?.maintenanceMode ? 'ON' : 'OFF', icon: Wrench, color: data?.maintenanceMode ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Storefront Dashboard</h1>
        <p className="text-xs text-neutral-400 mt-1">Overview of your customer-facing store configuration</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {widgets.map((w) => (
          <div key={w.label} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${w.color}`}><w.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-2xs font-semibold text-neutral-500 uppercase">{w.label}</p>
                <p className="text-lg font-bold text-neutral-900">{String(w.value)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" /> Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => (
              <Link key={a.label} href={a.href} className={`flex items-center gap-2.5 p-3 rounded-xl border ${a.color} hover:opacity-80 transition-opacity`}>
                <a.icon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900 mb-3">Recent Changes</h2>
          {/* ponytail: static placeholder — real audit log integration when needed */}
          <p className="text-xs text-neutral-400">Audit log integration coming soon.</p>
        </div>
      </div>
    </div>
  );
}
