'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useRole,
  usePermissions,
  useAssignPermissions,
  useRemovePermission,
  useUpdateRole,
} from '@/features/access/access.hooks';
import {
  Shield,
  ArrowLeft,
  Lock,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/api-error';
import { useToast } from '@/components/toast/ToastProvider';

export default function RoleDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const id = params.id as string;

  const { data: role, isLoading: roleLoading, error: roleError, refetch: refetchRole } = useRole(id);
  const { data: allPermissions, isLoading: permissionsLoading } = usePermissions();

  const assignMutation = useAssignPermissions();
  const removeMutation = useRemovePermission();
  const updateMutation = useUpdateRole();

  const [activeTab, setActiveTab] = useState<'permissions' | 'details'>('permissions');

  // Edit details states — reset when role id changes (React docs: adjust state during render)
  const [prevRoleId, setPrevRoleId] = useState(role?.id);
  const [displayName, setDisplayName] = useState(role?.displayName ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [hierarchy, setHierarchy] = useState(role?.hierarchy ?? 0);
  const [isUpdating, setIsUpdating] = useState(false);

  if (role && role.id !== prevRoleId) {
    setPrevRoleId(role.id);
    setDisplayName(role.displayName);
    setDescription(role.description || '');
    setHierarchy(role.hierarchy);
  }

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateMutation.mutateAsync({
        id,
        dto: { displayName, description, hierarchy },
      });
      toast('success', 'Role updated');
      refetchRole();
    } catch {}
    setIsUpdating(false);
  };

  if (roleLoading || permissionsLoading) {
    return <SectionLoader message="Loading role config workspace..." />;
  }

  if (roleError || !role) {
    return (
      <PageError
        title="Role Access Load Failure"
        message="Could not retrieve role details from database."
        retry={refetchRole}
      />
    );
  }

  const assignedPermissions = role.permissions || [];
  const permissions = allPermissions || [];

  const handleTogglePermission = async (permissionId: string, permissionCode: string, checked: boolean) => {
    if (role.name === 'super_admin') {
      toast('warning', 'Protected role', 'System super_admin permissions cannot be altered.');
      return;
    }
    try {
      if (checked) {
        // Add permission
        await assignMutation.mutateAsync({ id, permissionIds: [permissionId] });
      } else {
        // Remove permission
        await removeMutation.mutateAsync({ id, permissionId });
      }
      refetchRole();
    } catch (err: unknown) {
      toast('error', 'Permission toggle failed', getApiErrorMessage(err, 'Permission toggle failed.'));
    }
  };

  // Group permissions by module/domain
  const groupedPermissions = permissions.reduce((acc, curr) => {
    const group = curr.module.toUpperCase();
    if (!acc[group]) acc[group] = [];
    acc[group].push(curr);
    return acc;
  }, {} as Record<string, typeof permissions>);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/access/roles"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to roles
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-purple-100 bg-purple-50 p-3 text-purple-600 shadow-sm">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{role.displayName}</h1>
              <p className="text-xs font-mono text-neutral-400 mt-0.5">Role Key: {role.name}</p>
            </div>
          </div>
          {role.isSystem && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 uppercase">
              <Lock className="h-3.5 w-3.5" /> System Role
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-6 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`pb-4 border-b-2 transition-all
              ${
                activeTab === 'permissions'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }
            `}
          >
            Role Permissions Matrix
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-4 border-b-2 transition-all
              ${
                activeTab === 'details'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }
            `}
          >
            Edit Settings
          </button>
        </nav>
      </div>

      {/* Permissions Workspace */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([group, list]) => (
            <div key={group} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-neutral-900 uppercase border-b border-neutral-50 pb-2">
                {group} Domain Scope
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((perm) => {
                  const isChecked = assignedPermissions.includes(perm.code);
                  return (
                    <label
                      key={perm.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer
                        ${
                          isChecked
                            ? 'border-purple-200 bg-purple-50/20'
                            : 'border-neutral-100 hover:bg-neutral-50/50'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={role.name === 'super_admin'}
                        onChange={(e) => handleTogglePermission(perm.id, perm.code, e.target.checked)}
                        className="mt-1 h-3.5 w-3.5 accent-purple-600 border-neutral-300 rounded disabled:opacity-50"
                      />
                      <div>
                        <span className="text-xs font-bold text-neutral-850 block">{perm.name}</span>
                        <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">{perm.code}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings Form */}
      {activeTab === 'details' && (
        <form onSubmit={handleUpdateDetails} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-5 max-w-lg">
          <h3 className="font-bold text-neutral-900 border-b border-neutral-50 pb-2">Edit Role Parameters</h3>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase">Display Name</label>
            <input
              type="text"
              required
              disabled={role.isSystem}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase">Description</label>
            <textarea
              required
              disabled={role.isSystem}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none h-24 resize-none disabled:bg-neutral-50 disabled:text-neutral-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase">Hierarchy Level</label>
            <input
              type="number"
              min="0"
              disabled={role.isSystem}
              value={hierarchy}
              onChange={(e) => setHierarchy(Number(e.target.value))}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-400"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-neutral-100">
            <button
              type="submit"
              disabled={isUpdating || role.isSystem}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <CheckCircle className="h-4 w-4" /> {isUpdating ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
