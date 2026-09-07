'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock3,
  UserCheck,
  UserX,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Phone,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';
import Link from 'next/link';

interface RosterMember {
  staffProfileId: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  phone?: string;
  status: string;
  isClockedIn: boolean;
  punchInAt: string | null;
  punchOutAt: string | null;
  totalHours: number;
  notes: string | null;
}

interface RosterData {
  date: string;
  stats: {
    totalStaff: number;
    currentlyClockedIn: number;
    completedShifts: number;
    absentCount: number;
    lateCount: number;
  };
  roster: RosterMember[];
}

export default function StaffAttendancePage() {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rosterData, setRosterData] = useState<RosterData | null>(null);

  const fetchRoster = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      if (department) params.set('department', department);
      const res = await apiClient.get(`/staff/attendance/admin/live?${params.toString()}`);
      setRosterData(res.data?.data || null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load attendance roster');
    } finally {
      setLoading(false);
    }
  }, [date, department]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const handleExportCsv = () => {
    if (!rosterData?.roster.length) return;
    const headers = ['Employee ID', 'Name', 'Department', 'Designation', 'Phone', 'Date', 'Status', 'Punch In', 'Punch Out', 'Total Hours (h)'];
    const rows = rosterData.roster.map((r) => [
      r.employeeId,
      `"${r.name}"`,
      r.department,
      r.designation,
      r.phone || '',
      rosterData.date,
      r.status,
      r.punchInAt ? new Date(r.punchInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      r.punchOutAt ? new Date(r.punchOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      r.totalHours,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Staff_Attendance_${rosterData.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRoster = (rosterData?.roster || []).filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.employeeId.toLowerCase().includes(q) ||
      (r.phone && r.phone.includes(q))
    );
  });

  const columns: Column<RosterMember>[] = [
    {
      key: 'employee',
      label: 'Staff / Employee',
      render: (r) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-neutral-900 text-xs">{r.name}</span>
            <span className="font-mono text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-bold">
              {r.employeeId}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
            <span>{r.department}</span> · <span>{r.designation}</span>
            {r.phone && <span className="font-mono">{r.phone}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'punchIn',
      label: 'Clock In',
      render: (r) =>
        r.punchInAt ? (
          <div>
            <span className="font-mono font-bold text-neutral-900 text-xs block">
              {new Date(r.punchInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] text-neutral-400">Recorded</span>
          </div>
        ) : (
          <span className="text-neutral-400 font-medium text-xs">—</span>
        ),
    },
    {
      key: 'punchOut',
      label: 'Clock Out',
      render: (r) =>
        r.punchOutAt ? (
          <div>
            <span className="font-mono font-bold text-neutral-900 text-xs block">
              {new Date(r.punchOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] text-neutral-400">Shift Ended</span>
          </div>
        ) : r.isClockedIn ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
            ● Active Shift
          </span>
        ) : (
          <span className="text-neutral-400 font-medium text-xs">—</span>
        ),
    },
    {
      key: 'hours',
      label: 'Work Hours',
      render: (r) => (
        <span className="font-mono font-bold text-neutral-900 text-xs">
          {r.totalHours > 0 ? `${r.totalHours} hrs` : r.isClockedIn ? 'In Progress' : '0 hrs'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Daily Status',
      render: (r) => {
        if (r.status === 'PRESENT') {
          return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">PRESENT</span>;
        }
        if (r.status === 'LATE') {
          return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">LATE ENTRY</span>;
        }
        if (r.status === 'HALF_DAY') {
          return <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full">HALF DAY</span>;
        }
        return <span className="bg-neutral-100 text-neutral-500 text-[10px] font-medium px-2 py-0.5 rounded-full">NOT CLOCKED IN</span>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <Link
            href={`/admin/staff/tasks?staffId=${r.staffProfileId}`}
            className="inline-flex items-center gap-1 text-2xs bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold px-2.5 py-1 rounded-lg transition"
          >
            Tasks &amp; Perf <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
              Staff Attendance &amp; Live Shift Roster
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Monitor real-time clock-in status, daily working hours, late arrivals, and payroll exports.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchRoster}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={handleExportCsv}
            disabled={!rosterData?.roster.length}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export for Payroll (CSV)
          </button>
        </div>
      </div>

      {/* Roster KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Total Staff</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-neutral-900">{rosterData?.stats?.totalStaff ?? 0}</span>
            <span className="text-xs text-neutral-400">members</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Clocked In Now</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-emerald-700">{rosterData?.stats?.currentlyClockedIn ?? 0}</span>
            <span className="text-xs text-emerald-600 font-semibold">active shift</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Completed Shifts</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-neutral-900">{rosterData?.stats?.completedShifts ?? 0}</span>
            <span className="text-xs text-neutral-400">clocked out</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Late Check-Ins</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-amber-800">{rosterData?.stats?.lateCount ?? 0}</span>
            <span className="text-xs text-amber-600">after 9:45 AM</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Not Recorded</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-neutral-600">{rosterData?.stats?.absentCount ?? 0}</span>
            <span className="text-xs text-neutral-400">absent/pending</span>
          </div>
        </div>
      </div>

      {/* Date & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-neutral-100 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-800">
            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-none focus:outline-none font-bold text-xs"
            />
          </div>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-neutral-900"
          >
            <option value="">All Departments</option>
            <option value="SALES">Sales &amp; Counter</option>
            <option value="INVENTORY">Inventory &amp; Stock</option>
            <option value="TAILORING">Tailoring &amp; Alterations</option>
            <option value="ACCOUNTS">Accounts &amp; Billing</option>
            <option value="DISPATCH">Logistics &amp; Dispatch</option>
          </select>
        </div>

        <div className="relative w-full lg:w-72">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee name, ID or phone..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-neutral-900"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Attendance Roster DataTable */}
      <DataTable
        columns={columns}
        data={filteredRoster}
        total={filteredRoster.length}
        page={1}
        pageSize={50}
        loading={loading}
        error={!!error}
        onRetry={fetchRoster}
        onPageChange={() => {}}
        rowKey={(r) => r.staffProfileId}
        emptyMessage="No staff records found for the selected department/date."
      />
    </div>
  );
}
