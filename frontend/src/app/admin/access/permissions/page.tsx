'use client';

import React, { useState } from 'react';
import {
  usePermissions,
  useCreatePermission,
} from '@/features/access/access.hooks';
import {
  Shield,
  Search,
  Lock,
  Plus,
} from 'lucide-react';
import { SectionLoader } from '@/components/feedback/FeedbackStates';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/toast/ToastProvider';
import { getApiErrorMessage } from '@/utils/api-error';

export default function PermissionsPage() {
  const { data: permissions, isLoading, refetch } = usePermissions();
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const isSuperAdmin = !!user?.roles?.includes('super_admin');
  const { toast } = useToast();
  const createMutation = useCreatePermission();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ module: '', name: '', code: '', description: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(form);
      toast('success', 'Permission created', `${form.code} is now available to assign from any role's page.`);
      setIsCreateOpen(false);
      setForm({ module: '', name: '', code: '', description: '' });
      refetch();
    } catch (err) {
      toast('error', 'Could not create permission', getApiErrorMessage(err, 'Please check the form and try again.'));
    }
  };

  if (isLoading) {
    return <SectionLoader message="Loading permissions catalog..." />;
  }

  const list = permissions || [];

  const filtered = list.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.module.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Group by module/domain
  const grouped = filtered.reduce((acc, curr) => {
    const group = curr.module.toUpperCase();
    if (!acc[group]) acc[group] = [];
    acc[group].push(curr);
    return acc;
  }, {} as Record<string, typeof filtered>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Permissions Catalog</h1>
          <p className="text-sm text-neutral-500 mt-1">
            System-seeded security rules, plus any custom permissions a Super Admin has added.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 text-neutral-600 border uppercase border-neutral-200">
            <Lock className="h-3.5 w-3.5" /> System Seeded
          </span>
          {isSuperAdmin && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" /> Create Permission
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950"
          />
        </div>
      </div>

      {/* Grouped list */}
      <div className="space-y-6">
        {Object.keys(grouped).length > 0 ? (
          Object.entries(grouped).map(([group, permissionsList]) => (
            <div key={group} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-neutral-950 uppercase border-b border-neutral-50 pb-2">
                {group} Module Permissions
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {permissionsList.map((perm) => (
                  <div
                    key={perm.id}
                    className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50/50 flex items-start gap-3"
                  >
                    <div className="rounded p-1 bg-white text-neutral-400 border border-neutral-100 mt-0.5">
                      <Shield className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-neutral-800">{perm.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">{perm.code}</span>
                      {perm.description && (
                        <p className="text-[10px] text-neutral-400 mt-1.5 leading-relaxed">
                          {perm.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-xs text-neutral-400 border border-dashed rounded-xl bg-white">
            No permissions found matching search query.
          </div>
        )}
      </div>

      {/* CREATE PERMISSION DIALOG */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4">
              <h3 className="font-bold text-neutral-900">Create permission</h3>
              <p className="text-[11px] text-neutral-500 mt-1">
                Grant it to a role from Roles → that role → Role Permissions Matrix.
              </p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Module</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. staff, inventory, storefront"
                  value={form.module}
                  onChange={(e) => setForm({ ...form, module: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. staff:export"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs font-mono focus:border-neutral-950 focus:outline-none"
                />
                <p className="text-[10px] text-neutral-400">
                  The exact string a role's checkbox will toggle. Must be unique.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Export Staff Records"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none h-20 resize-none"
                  placeholder="What this permission unlocks, for your own reference"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating…' : 'Create Permission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
