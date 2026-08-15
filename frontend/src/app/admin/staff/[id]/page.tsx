'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useStaff,
} from '@/features/staff/staff.hooks';
import {
  useRoles,
  useAssignRoleToStaff,
  useRemoveRoleFromStaff,
} from '@/features/access/access.hooks';
import {
  User,
  ArrowLeft,
  Shield,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { StaffResponse } from '@/features/staff/staff.types';
import { RoleResponse } from '@/features/access/access.types';
import { getApiErrorMessage } from '@/utils/api-error';
import { useToast } from '@/components/toast/ToastProvider';
import { useAuth } from '@/hooks/useAuth';

export default function StaffDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const id = params.id as string;

  const { data: staff, isLoading: staffLoading, error: staffError, refetch: refetchStaff } = useStaff(id);
  const { data: allRoles } = useRoles();

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'permissions'>('overview');

  // Role Assignment State
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const assignRoleMutation = useAssignRoleToStaff();
  const removeRoleMutation = useRemoveRoleFromStaff();

  const handleRetry = () => {
    refetchStaff();
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff?.userId || !selectedRoleId) return;
    setIsAssigning(true);
    try {
      await assignRoleMutation.mutateAsync({
        staffUserId: staff.userId,
        roleId: selectedRoleId,
      });
      toast('success', 'Role assigned');
      setSelectedRoleId('');
      refetchStaff();
    } catch (err: unknown) {
      toast('error', 'Role assignment failed', getApiErrorMessage(err, 'Role assignment failed.'));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!staff?.userId) return;
    if (confirm('Are you sure you want to remove this role from the staff member?')) {
      try {
        await removeRoleMutation.mutateAsync({
          staffUserId: staff.userId,
          roleId,
        });
        toast('success', 'Role removed');
        refetchStaff();
      } catch (err: unknown) {
        toast('error', 'Role removal failed', getApiErrorMessage(err, 'Role removal failed.'));
      }
    }
  };

  if (staffLoading) {
    return <SectionLoader message="Loading staff details workspace..." />;
  }

  if (staffError || !staff) {
    return (
      <PageError
        title="Staff Profile Load Failure"
        message="Could not retrieve operator details from database."
        retry={handleRetry}
      />
    );
  }

  // Extract roles assigned to this staff user from basic profile model (if mapped)
  // Wait, let's look at getRoles or permissions mappings.
  // In `users.types.ts` `UserDetailResponse` contains roles and permissions!
  // Wait! In `staff.controller.ts`, `findById` returns `StaffResponse`.
  // Does `StaffResponse` include user roles? Let's check `users.controller.ts` getRoles:
  // We can fetch user roles using `GET /users/:id/roles` or `GET /users/:id/permissions` which are exposed in `users.controller.ts`!
  // Wait, our hook `useStaff` targets `/staff/:id` which returns staff profile details.
  // To get the roles/permissions of this user ID, we can fetch `/users/:userId` (using `useCustomer(userId)`) which returns the user roles and permissions!
  // Let's use `useCustomer(staff.userId)` inside this component. That is extremely smart and reuses existing APIs!
  return (
    <StaffDetailContent
      staff={staff}
      allRoles={allRoles || []}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      selectedRoleId={selectedRoleId}
      setSelectedRoleId={setSelectedRoleId}
      isAssigning={isAssigning}
      handleAssignRole={handleAssignRole}
      handleRemoveRole={handleRemoveRole}
    />
  );
}

// Separate component to safely use conditional hook of useCustomer
interface StaffDetailContentProps {
  staff: StaffResponse;
  allRoles: RoleResponse[];
  activeTab: 'overview' | 'roles' | 'permissions';
  setActiveTab: (t: 'overview' | 'roles' | 'permissions') => void;
  selectedRoleId: string;
  setSelectedRoleId: (id: string) => void;
  isAssigning: boolean;
  handleAssignRole: (e: React.FormEvent) => void;
  handleRemoveRole: (roleId: string) => void;
}

import { useCustomer } from '@/features/customers/customers.hooks';

function StaffDetailContent({
  staff,
  allRoles,
  activeTab,
  setActiveTab,
  selectedRoleId,
  setSelectedRoleId,
  isAssigning,
  handleAssignRole,
  handleRemoveRole,
}: StaffDetailContentProps) {
  // Fetch full User details (which includes roles and permissions array!) using the staff's userId
  const { data: userDetails, isLoading: userLoading } = useCustomer(staff.userId);
  const { user: currentUser } = useAuth();
  const isSuperAdmin = !!currentUser?.roles?.includes('super_admin');

  if (userLoading) {
    return <SectionLoader message="Loading operator access privileges..." />;
  }

  const assignedRoleNames = userDetails?.roles || [];
  const effectivePermissions = userDetails?.permissions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/staff"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to staff directory
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-3 text-neutral-600 shadow-sm">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                {staff.firstName} {staff.lastName || ''}
              </h1>
              <p className="text-xs font-mono text-neutral-400 mt-0.5">{staff.email}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border uppercase
              ${
                staff.accountStatus === 'ACTIVE'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-neutral-100 text-neutral-500 border-neutral-300'
              }
            `}
          >
            {staff.accountStatus}
          </span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-6 text-xs font-bold uppercase tracking-wider">
          {(['overview', 'roles', 'permissions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 border-b-2 transition-all
                ${
                  activeTab === tab
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm md:col-span-2 space-y-4">
            <h3 className="font-bold text-neutral-900 border-b border-neutral-50 pb-2">Profile details</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-neutral-400 uppercase">First Name</span>
                <p className="font-semibold text-neutral-800 mt-1">{staff.firstName}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase">Last Name</span>
                <p className="font-semibold text-neutral-800 mt-1">{staff.lastName || 'N/A'}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase">Phone</span>
                <p className="font-semibold text-neutral-800 mt-1">{staff.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase">Department</span>
                <p className="font-semibold text-neutral-800 mt-1">{staff.department}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase">Designation</span>
                <p className="font-semibold text-neutral-800 mt-1">{staff.designation}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase">Job Title</span>
                <p className="font-semibold text-neutral-800 mt-1">{staff.jobTitle || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm md:col-span-1 space-y-4 h-fit">
            <h3 className="font-bold text-neutral-900 border-b border-neutral-50 pb-2">Employment Meta</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Employee ID</span>
                <span className="font-mono text-neutral-800 font-semibold">{staff.employeeId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Employment Status</span>
                <span className="font-bold text-neutral-800 uppercase">{staff.employmentStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Joined date</span>
                <span className="font-semibold text-neutral-800">
                  {staff.joinedAt ? new Date(staff.joinedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roles Assignment Tab */}
      {activeTab === 'roles' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Roles list */}
          <div className="md:col-span-2 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase border-b border-neutral-50 pb-2">
              Assigned Access Roles
            </h3>
            <div className="space-y-3">
              {assignedRoleNames.length > 0 ? (
                allRoles
                  .filter((r) => assignedRoleNames.includes(r.name))
                  .map((role) => (
                    <div
                      key={role.id}
                      className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-neutral-800">{role.displayName}</span>
                        <p className="text-[10px] text-neutral-400 mt-1">{role.description || 'No description'}</p>
                      </div>
                      {isSuperAdmin && !(role.name === 'super_admin' && staff.userId === currentUser?.id) && (
                        <button
                          onClick={() => handleRemoveRole(role.id)}
                          className="rounded p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 border border-transparent transition-all"
                          title="Remove assignment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))
              ) : (
                <p className="text-xs text-neutral-400 py-6 text-center">No roles assigned to this staff operator.</p>
              )}
            </div>
          </div>

          {/* Assign Role form — super_admin only; changing what a staff member
              can access is a grant of trust, not routine account upkeep. */}
          <div className="md:col-span-1 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4 h-fit">
            <h3 className="text-xs font-bold text-neutral-900 uppercase border-b border-neutral-50 pb-2">
              Assign new role
            </h3>
            {isSuperAdmin ? (
              <form onSubmit={handleAssignRole} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Available Roles</label>
                  <select
                    required
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none bg-white"
                  >
                    <option value="">Select Role...</option>
                    {allRoles
                      .filter((r) => !assignedRoleNames.includes(r.name) && r.isActive)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.displayName}
                        </option>
                      ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isAssigning || !selectedRoleId}
                  className="w-full rounded-lg bg-neutral-900 hover:bg-neutral-800 py-2 text-xs font-semibold text-white disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Assign Role
                </button>
              </form>
            ) : (
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Only a Super Admin can grant or remove roles. Ask a Super Admin if this operator needs different access.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-neutral-900 uppercase border-b border-neutral-50 pb-2">
            Effective permissions catalog
          </h3>
          {effectivePermissions.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-3 text-xs">
              {effectivePermissions.map((code) => (
                <div
                  key={code}
                  className="p-3 rounded-lg border border-neutral-100 bg-neutral-50/50 flex items-center gap-2 font-mono font-bold text-neutral-600"
                >
                  <Shield className="h-3.5 w-3.5 text-neutral-400" /> {code}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-400 py-6 text-center">No administrative permissions mapped.</p>
          )}
        </div>
      )}
    </div>
  );
}
