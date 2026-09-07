'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  TrendingUp,
  BarChart3,
  Activity,
  Award,
  ChevronRight,
  UserCircle,
  Timer,
  CalendarDays,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
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

interface AttendanceHistoryItem {
  id: string;
  staffProfileId: string;
  employeeId: string;
  staffName: string;
  department: string;
  designation: string;
  date: string;
  punchInAt: string | null;
  punchOutAt: string | null;
  totalHours: number;
  breakMinutes: number;
  status: string;
  shiftType: string;
  punchInLocation?: string | null;
  notes?: string | null;
}

export default function StaffAttendancePage() {
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'ROSTER'>('ANALYTICS');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedStaffId, setSelectedStaffId] = useState<string>('ALL');
  const [department, setDepartment] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [rosterData, setRosterData] = useState<RosterData | null>(null);
  const [monthlyHistory, setMonthlyHistory] = useState<AttendanceHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // 1. Fetch Daily Roster
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

  // 2. Fetch Monthly Attendance History for Graph Analytics
  const fetchMonthlyHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      params.set('month', selectedMonth);
      if (selectedStaffId && selectedStaffId !== 'ALL') {
        params.set('staffProfileId', selectedStaffId);
      }
      if (department) {
        params.set('department', department);
      }
      const res = await apiClient.get(`/staff/attendance/history?${params.toString()}`);
      const list = res.data?.data;
      if (Array.isArray(list)) {
        setMonthlyHistory(list);
      }
    } catch {
      // no-op
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedMonth, selectedStaffId, department]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  useEffect(() => {
    fetchMonthlyHistory();
  }, [fetchMonthlyHistory]);

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

  // =========================================================================
  // GRAPH DATA PROCESSING
  // =========================================================================

  // Convert decimal hours (e.g. 9.75) to "HH:MM AM/PM" format
  const formatTimeFromDecimal = (decimalHour: number) => {
    if (!decimalHour || isNaN(decimalHour)) return '—';
    const hours = Math.floor(decimalHour);
    const minutes = Math.round((decimalHour - hours) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  // Process data for Arrival Time & Punctuality Curve
  const chartData = useMemo(() => {
    // Group records by Date (sorted ascending)
    const sorted = [...monthlyHistory].sort((a, b) => a.date.localeCompare(b.date));

    // Days in selected month
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const dayMap = new Map<string, AttendanceHistoryItem[]>();
    for (const item of sorted) {
      const existing = dayMap.get(item.date) || [];
      existing.push(item);
      dayMap.set(item.date, existing);
    }

    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayKey = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      const dayLabel = `${d} ${new Date(year, month - 1, d).toLocaleString('en-IN', { month: 'short' })}`;
      const dayItems = dayMap.get(dayKey) || [];

      if (dayItems.length > 0) {
        // Average or single punchIn time
        let totalPunchInDecimal = 0;
        let punchInCount = 0;
        let totalHoursWorked = 0;
        let isLate = false;
        let employeeNames: string[] = [];

        dayItems.forEach((item) => {
          if (item.punchInAt) {
            const punchDate = new Date(item.punchInAt);
            const decTime = punchDate.getHours() + punchDate.getMinutes() / 60;
            totalPunchInDecimal += decTime;
            punchInCount++;
            if (item.status === 'LATE') isLate = true;
          }
          totalHoursWorked += Number(item.totalHours || 0);
          employeeNames.push(item.staffName || item.employeeId);
        });

        const avgPunchIn = punchInCount > 0 ? Number((totalPunchInDecimal / punchInCount).toFixed(2)) : null;

        // Calculate late minutes relative to 09:45 AM (9.75)
        const lateMinutes = avgPunchIn && avgPunchIn > 9.75 ? Math.round((avgPunchIn - 9.75) * 60) : 0;

        result.push({
          date: dayKey,
          day: dayLabel,
          punchInTime: avgPunchIn,
          displayTime: avgPunchIn ? formatTimeFromDecimal(avgPunchIn) : '—',
          workHours: Number(totalHoursWorked.toFixed(1)),
          lateMinutes,
          isLate,
          status: isLate ? 'LATE' : 'PRESENT',
          employees: employeeNames.join(', '),
          recordCount: dayItems.length,
        });
      } else {
        result.push({
          date: dayKey,
          day: dayLabel,
          punchInTime: null,
          displayTime: 'No Entry',
          workHours: 0,
          lateMinutes: 0,
          isLate: false,
          status: 'OFF_ABSENT',
          employees: '',
          recordCount: 0,
        });
      }
    }

    return result;
  }, [monthlyHistory, selectedMonth]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const presentRecords = monthlyHistory.filter((r) => ['PRESENT', 'LATE', 'HALF_DAY'].includes(r.status));
    const lateRecords = monthlyHistory.filter((r) => r.status === 'LATE');
    const totalHours = monthlyHistory.reduce((sum, r) => sum + Number(r.totalHours || 0), 0);

    let totalPunchInDecimal = 0;
    let punchInCount = 0;
    let totalLateMinutes = 0;

    monthlyHistory.forEach((r) => {
      if (r.punchInAt) {
        const d = new Date(r.punchInAt);
        const dec = d.getHours() + d.getMinutes() / 60;
        totalPunchInDecimal += dec;
        punchInCount++;
        if (dec > 9.75) {
          totalLateMinutes += Math.round((dec - 9.75) * 60);
        }
      }
    });

    const avgPunchInDecimal = punchInCount > 0 ? totalPunchInDecimal / punchInCount : 0;
    const onTimeRate = presentRecords.length > 0 ? Math.round(((presentRecords.length - lateRecords.length) / presentRecords.length) * 100) : 100;

    const statusCounts = [
      { name: 'On Time (<= 9:45 AM)', value: Math.max(0, presentRecords.length - lateRecords.length), color: '#10b981' },
      { name: 'Late Check-Ins (> 9:45 AM)', value: lateRecords.length, color: '#f59e0b' },
      { name: 'Half Day Shifts', value: monthlyHistory.filter((r) => r.status === 'HALF_DAY').length, color: '#38bdf8' },
    ].filter((s) => s.value > 0);

    return {
      totalShifts: presentRecords.length,
      totalHours: totalHours.toFixed(1),
      avgCheckIn: avgPunchInDecimal > 0 ? formatTimeFromDecimal(avgPunchInDecimal) : '09:30 AM',
      lateCount: lateRecords.length,
      totalLateMinutes,
      onTimeRate,
      statusCounts,
    };
  }, [monthlyHistory]);

  const columns: Column<RosterMember>[] = [
    {
      key: 'employee',
      label: 'Staff / Employee',
      render: (r) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-neutral-900 text-xs">{r.name}</span>
            <span className="font-mono text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded font-bold">
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
          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Active
          </span>
        ) : (
          <span className="text-neutral-400 font-medium text-xs">—</span>
        ),
    },
    {
      key: 'hours',
      label: 'Work Hours',
      render: (r) => (
        <span className="font-mono font-bold text-[var(--brand-primary)] text-xs">
          {r.totalHours > 0 ? `${r.totalHours} hrs` : r.isClockedIn ? 'In Progress' : '0 hrs'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Daily Status',
      render: (r) => {
        if (r.status === 'PRESENT') {
          return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">PRESENT</span>;
        }
        if (r.status === 'LATE') {
          return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md">LATE ENTRY</span>;
        }
        if (r.status === 'HALF_DAY') {
          return <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-md">HALF DAY</span>;
        }
        return <span className="bg-neutral-100 text-neutral-500 text-[10px] font-medium px-2 py-0.5 rounded-md">NOT RECORDED</span>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedStaffId(r.staffProfileId);
              setActiveTab('ANALYTICS');
            }}
            className="inline-flex items-center gap-1 text-[11px] bg-sky-50 hover:bg-sky-100 text-[var(--brand-primary)] border border-sky-200 font-bold px-2.5 py-1 rounded-lg transition"
          >
            <BarChart3 className="w-3 h-3" /> View Graph
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-[var(--brand-primary)] border border-sky-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight font-serif">
                Staff Attendance &amp; Timing Analytics
              </h1>
              <p className="text-xs text-neutral-500">
                Visual punctuality graphs, check-in timing curves, daily working hours, and live shift roster.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab Switcher */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200">
            <button
              onClick={() => setActiveTab('ANALYTICS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ANALYTICS' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              <span>Timing Graphs</span>
            </button>
            <button
              onClick={() => setActiveTab('ROSTER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ROSTER' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-neutral-600" />
              <span>Daily Live Roster</span>
            </button>
          </div>

          <button
            onClick={() => {
              fetchRoster();
              fetchMonthlyHistory();
            }}
            disabled={loading || loadingHistory}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || loadingHistory ? 'animate-spin' : ''}`} /> Refresh
          </button>

          <button
            onClick={handleExportCsv}
            disabled={!rosterData?.roster.length}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
          </button>
        </div>
      </div>

      {/* FILTER & EMPLOYEE SELECTOR BAR */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Employee Selector */}
          <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5">
            <UserCircle className="w-4 h-4 text-neutral-400" />
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-neutral-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Staff Members (Team View)</option>
              {(rosterData?.roster || []).map((st) => (
                <option key={st.staffProfileId} value={st.staffProfileId}>
                  {st.name} ({st.employeeId})
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5">
            <CalendarDays className="w-4 h-4 text-neutral-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-neutral-900 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Department Filter */}
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

        {activeTab === 'ROSTER' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
            />
            <div className="relative w-full lg:w-64">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, ID or phone..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-8 pr-4 py-1.5 text-xs focus:outline-none focus:border-neutral-900"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2" />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: TIMING GRAPHS & VISUAL ANALYTICS                                   */}
      {/* ========================================================================= */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          {/* Monthly KPI Analytics Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Total Shifts Logged
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-neutral-900">{metrics.totalShifts}</span>
                <span className="text-xs text-neutral-400">days</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Total Hours Worked
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-[var(--brand-primary)] font-mono">{metrics.totalHours}</span>
                <span className="text-xs text-neutral-400">hrs</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Avg Check-in Time
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-neutral-900 font-mono">{metrics.avgCheckIn}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                Late Arrivals (&gt;9:45 AM)
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-amber-700">{metrics.lateCount}</span>
                <span className="text-xs text-amber-600 font-medium">{metrics.totalLateMinutes} mins late</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                Punctuality Score
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-emerald-700">{metrics.onTimeRate}%</span>
                <span className="text-xs text-emerald-600 font-medium">on-time</span>
              </div>
            </div>
          </div>

          {/* GRAPH 1: CHECK-IN TIMING & PUNCTUALITY CURVE */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--brand-primary)]" />
                  Daily Check-in Time &amp; Arrival Punctuality Trend
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Plots daily punch-in time against the 09:45 AM shift arrival threshold.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> On Time (&le; 9:45 AM)
                </span>
                <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late Arrival (&gt; 9:45 AM)
                </span>
              </div>
            </div>

            {loadingHistory ? (
              <div className="h-72 flex items-center justify-center text-xs text-neutral-400">Loading timing graph...</div>
            ) : chartData.filter((d) => d.punchInTime !== null).length === 0 ? (
              <div className="h-72 flex flex-col items-center justify-center text-center p-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                <Clock className="w-8 h-8 text-neutral-300 mb-2" />
                <p className="text-xs font-bold text-neutral-700">No shift arrival records in {selectedMonth}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Recorded punch-ins will automatically plot on this curve.</p>
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis
                      domain={[8, 13]}
                      ticks={[8, 9, 9.75, 10, 11, 12, 13]}
                      tickFormatter={(val) => formatTimeFromDecimal(val)}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        if (!data.punchInTime) return null;
                        return (
                          <div className="bg-neutral-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1">
                            <p className="font-bold border-b border-neutral-700 pb-1">{data.date}</p>
                            <p className="flex justify-between gap-4 text-neutral-300">
                              <span>Punch-In Time:</span>
                              <strong className="text-white font-mono">{data.displayTime}</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span>Status:</span>
                              <strong className={data.isLate ? 'text-amber-400' : 'text-emerald-400'}>
                                {data.isLate ? `Late (${data.lateMinutes}m delay)` : 'On Time'}
                              </strong>
                            </p>
                            {data.employees && (
                              <p className="text-[10px] text-neutral-400 pt-1 border-t border-neutral-800">
                                Staff: {data.employees}
                              </p>
                            )}
                          </div>
                        );
                      }}
                    />
                    {/* Shift late threshold line */}
                    <ReferenceLine
                      y={9.75}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Late Threshold (09:45 AM)',
                        position: 'insideTopRight',
                        fill: '#d97706',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="punchInTime"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#timeGradient)"
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (!payload.punchInTime) return null;
                        const fillColor = payload.isLate ? '#f59e0b' : '#10b981';
                        return (
                          <circle
                            key={props.key || `${cx}-${cy}`}
                            cx={cx}
                            cy={cy}
                            r={4.5}
                            fill={fillColor}
                            stroke="#ffffff"
                            strokeWidth={1.5}
                          />
                        );
                      }}
                      activeDot={{ r: 7, stroke: '#0284c7', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* GRAPH 2 & 3: DAILY WORKING HOURS & STATUS BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* GRAPH 2: DAILY WORKING HOURS (2 COLS) */}
            <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <Timer className="w-4 h-4 text-[var(--brand-primary)]" />
                    Daily Working Hours (Shift Duration)
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Total hours clocked per day across the month.</p>
                </div>
                <span className="text-[11px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md">
                  Target: 8.0 hrs/day
                </span>
              </div>

              {loadingHistory ? (
                <div className="h-64 flex items-center justify-center text-xs text-neutral-400">Loading hours graph...</div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                      <YAxis
                        domain={[0, 12]}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(v) => `${v}h`}
                        tickLine={false}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="bg-neutral-900 text-white p-2.5 rounded-xl shadow-lg text-xs space-y-1">
                              <p className="font-bold border-b border-neutral-700 pb-1">{d.date}</p>
                              <p className="flex justify-between gap-4 text-sky-400 font-mono">
                                <span>Hours Worked:</span>
                                <strong>{d.workHours} hrs</strong>
                              </p>
                              {d.displayTime !== 'No Entry' && (
                                <p className="text-[10px] text-neutral-400">Checked In: {d.displayTime}</p>
                              )}
                            </div>
                          );
                        }}
                      />
                      <ReferenceLine y={8} stroke="#10b981" strokeDasharray="3 3" />
                      <Bar dataKey="workHours" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => {
                          const fill = entry.workHours >= 8 ? '#0284c7' : entry.workHours > 0 ? '#38bdf8' : '#e2e8f0';
                          return <Cell key={`cell-${index}`} fill={fill} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* GRAPH 3: PUNCTUALITY PIE / BREAKDOWN (1 COL) */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2 pb-3 border-b border-neutral-100">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Punctuality Breakdown
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Distribution of on-time versus late shift arrivals.
                </p>
              </div>

              {metrics.statusCounts.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400">No shift data recorded for this period.</div>
              ) : (
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.statusCounts}
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {metrics.statusCounts.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Legend Badges */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                {metrics.statusCounts.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-neutral-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                    <strong className="font-bold text-neutral-900 font-mono">{s.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: DAILY LIVE ROSTER & TABLE                                         */}
      {/* ========================================================================= */}
      {activeTab === 'ROSTER' && (
        <div className="space-y-6">
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
      )}
    </div>
  );
}
