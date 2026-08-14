'use client';

import React, { useState } from 'react';
import {
  useStaffList,
  useCreateStaff,
  useActivateStaff,
  useDeactivateStaff,
  useSuspendStaff,
} from '@/features/staff/staff.hooks';
import { StaffResponse, StaffDepartment, StaffDesignation } from '@/features/staff/staff.types';
import {
  User,
  Plus,
  Search,
  Eye,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { SectionLoader } from '@/components/feedback/FeedbackStates';
import { useToast } from '@/components/toast/ToastProvider';
import { getApiErrorMessage } from '@/utils/api-error';

const DEPARTMENTS: StaffDepartment[] = [
  'MANAGEMENT',
  'SALES',
  'MARKETING',
  'WAREHOUSE',
  'PACKING',
  'CUSTOMER_SUPPORT',
  'INVENTORY',
  'ACCOUNTING',
  'IT',
];

const DESIGNATIONS: StaffDesignation[] = [
  'MANAGER',
  'SUPERVISOR',
  'EXECUTIVE',
  'ASSOCIATE',
  'TRAINEE',
];

export default function StaffPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState<string>('');
  const [desg, setDesg] = useState<string>('');

  const { data, isLoading, refetch } = useStaffList({
    page,
    limit: 10,
    search: search || undefined,
    department: (dept as StaffDepartment) || undefined,
    designation: (desg as StaffDesignation) || undefined,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    department: 'SALES' as StaffDepartment,
    designation: 'ASSOCIATE' as StaffDesignation,
    employeeId: '',
    jobTitle: '',
  });

  const { toast } = useToast();
  const createMutation = useCreateStaff();
  const activateMutation = useActivateStaff();
  const deactivateMutation = useDeactivateStaff();
  const suspendMutation = useSuspendStaff();

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(formData);
      toast('success', 'Staff operator created', `${formData.firstName} ${formData.lastName} can now sign in.`);
      setIsCreateOpen(false);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        department: 'SALES',
        designation: 'ASSOCIATE',
        employeeId: '',
        jobTitle: '',
      });
      refetch();
    } catch (err) {
      // Keep the dialog open with the entered data so the field that failed
      // (e.g. a duplicate email or employee ID) can be fixed and resubmitted.
      toast('error', 'Could not create staff operator', getApiErrorMessage(err, 'Please check the form and try again.'));
    }
  };

  const handleToggleStatus = async (staff: StaffResponse) => {
    if (staff.accountStatus === 'ACTIVE') {
      if (confirm('Are you sure you want to deactivate this staff account?')) {
        await deactivateMutation.mutateAsync(staff.id);
        refetch();
      }
    } else {
      if (confirm('Are you sure you want to activate this staff account?')) {
        await activateMutation.mutateAsync(staff.id);
        refetch();
      }
    }
  };

  const handleSuspend = async (staff: StaffResponse) => {
    if (confirm('Are you sure you want to suspend this staff account?')) {
      await suspendMutation.mutateAsync(staff.id);
      refetch();
    }
  };

  if (isLoading) {
    return <SectionLoader message="Loading staff directory..." />;
  }

  const staffList = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Staff Management</h1>
          <p className="text-sm text-neutral-500 mt-1">Configure system operators and administrative permissions.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" /> Add Staff Member
        </button>
      </div>

      {/* Filters bar */}
      <div className="grid gap-3 sm:grid-cols-3 bg-white border border-neutral-200 p-4 rounded-xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950"
          />
        </div>

        <select
          value={dept}
          onChange={(e) => {
            setDept(e.target.value);
            setPage(1);
          }}
          className="py-2 px-3 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950 bg-white"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={desg}
          onChange={(e) => {
            setDesg(e.target.value);
            setPage(1);
          }}
          className="py-2 px-3 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950 bg-white"
        >
          <option value="">All Designations</option>
          {DESIGNATIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-500 font-semibold uppercase tracking-wider">
              <th className="p-4">Staff Details</th>
              <th className="p-4">Employee ID</th>
              <th className="p-4">Department / Designation</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {staffList.length > 0 ? (
              staffList.map((s: StaffResponse) => (
                <tr key={s.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-2 text-neutral-500">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <Link
                          href={`/admin/staff/${s.id}`}
                          className="font-bold text-neutral-900 hover:underline"
                        >
                          {s.firstName} {s.lastName || ''}
                        </Link>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-neutral-600">{s.employeeId}</td>
                  <td className="p-4">
                    <span className="font-semibold text-neutral-700">{s.department}</span>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{s.designation} {s.jobTitle ? `(${s.jobTitle})` : ''}</p>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase
                        ${s.accountStatus === 'ACTIVE' && 'bg-green-50 text-green-700 border border-green-100'}
                        ${s.accountStatus === 'INACTIVE' && 'bg-neutral-100 text-neutral-600 border border-neutral-200'}
                        ${s.accountStatus === 'SUSPENDED' && 'bg-red-50 text-red-700 border border-red-100'}
                      `}
                    >
                      {s.accountStatus}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        href={`/admin/staff/${s.id}`}
                        className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 border border-transparent hover:border-neutral-200 transition-all"
                        title="View detail workspace"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(s)}
                        className={`rounded p-1.5 border border-transparent transition-all
                          ${
                            s.accountStatus === 'ACTIVE'
                              ? 'text-green-600 hover:bg-green-50 hover:border-green-200'
                              : 'text-neutral-500 hover:bg-neutral-100 hover:border-neutral-200'
                          }
                        `}
                        title={s.accountStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      >
                        {s.accountStatus === 'ACTIVE' ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </button>
                      {s.accountStatus !== 'SUSPENDED' && (
                        <button
                          onClick={() => handleSuspend(s)}
                          className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:border-red-200 border border-transparent transition-all"
                          title="Suspend operator"
                        >
                          <ShieldAlert className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-400">
                  No staff operators registered.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/50 px-4 py-3">
            <span className="text-xs text-neutral-500">
              Page {page} of {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                disabled={page === meta.totalPages}
                className="rounded border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE STAFF DIALOG */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4">
              <h3 className="font-bold text-neutral-900">Add new staff operator</h3>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                    placeholder="EMP-1002"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value as StaffDepartment })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none bg-white"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Designation</label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value as StaffDesignation })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none bg-white"
                  >
                    {DESIGNATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Job Title</label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                  placeholder="e.g. Head Warehouse Officer"
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
                  {createMutation.isPending ? 'Adding…' : 'Add Operator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
