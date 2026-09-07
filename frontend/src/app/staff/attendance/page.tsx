'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock3,
  UserCheck,
  TrendingUp,
  FileSpreadsheet,
  RefreshCw,
  Award,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { StaffPortalNav } from '@/components/staff/StaffPortalNav';
import { StaffLoginGate } from '@/components/staff/StaffLoginGate';

interface AttendanceRecord {
  id: string;
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

export default function StaffAttendanceHistoryPage() {
  const { user, isAuthenticated, isStaffUser, isInitializing } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(`/staff/attendance/history?month=${selectedMonth}`);
      const data = res.data?.data;
      if (Array.isArray(data)) {
        setRecords(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAttendance();
    }
  }, [isAuthenticated, fetchAttendance]);

  // Performance calculations
  const totalHours = records.reduce((sum, r) => sum + Number(r.totalHours || 0), 0);
  const presentDays = records.filter((r) => ['PRESENT', 'LATE'].includes(r.status)).length;
  const lateDays = records.filter((r) => r.status === 'LATE').length;
  const onTimePercentage = presentDays > 0 ? Math.round(((presentDays - lateDays) / presentDays) * 100) : 100;

  if (!isInitializing && (!isAuthenticated || !isStaffUser)) {
    return <StaffLoginGate redirect="/staff/attendance" />;
  }

  return (
    <div className="w-full min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased pb-24 sm:pb-8 flex flex-col">
      <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-30 px-4 py-3 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            <h1 className="text-sm font-bold text-white tracking-wide">My Working Hours & Attendance</h1>
          </div>
          <button
            onClick={fetchAttendance}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <StaffPortalNav />

      <main className="max-w-4xl mx-auto px-4 py-6 w-full space-y-6 flex-1">
        {/* Month Selector & KPI Grid */}
        <section className="bg-neutral-900 rounded-3xl border border-neutral-800 p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
            <div>
              <h2 className="text-base font-bold text-white">Monthly Summary</h2>
              <p className="text-xs text-neutral-400">Total payable hours and punctuality records</p>
            </div>
            <div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>Total Hours</span>
              </div>
              <div className="text-2xl font-mono font-bold text-white">{totalHours.toFixed(1)} <span className="text-xs font-normal text-neutral-400">hrs</span></div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Present Days</span>
              </div>
              <div className="text-2xl font-bold text-emerald-400">{presentDays} <span className="text-xs font-normal text-neutral-400">days</span></div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
                <Clock3 className="w-4 h-4 text-amber-400" />
                <span>Late Check-ins</span>
              </div>
              <div className="text-2xl font-bold text-amber-400">{lateDays}</div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
                <Award className="w-4 h-4 text-indigo-400" />
                <span>On-Time Score</span>
              </div>
              <div className="text-2xl font-bold text-indigo-400">{onTimePercentage}%</div>
            </div>
          </div>
        </section>

        {/* Attendance Log Table */}
        <section className="bg-neutral-900 rounded-3xl border border-neutral-800 p-5 sm:p-6 shadow-xl">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-400" />
            Shift Log History
          </h2>

          {loading ? (
            <div className="py-12 text-center text-neutral-400 text-xs">Loading shift logs...</div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center bg-neutral-950/40 rounded-2xl border border-dashed border-neutral-800">
              <Calendar className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-300">No shift logs found</p>
              <p className="text-xs text-neutral-500">No attendance recorded for {selectedMonth}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Punch In</th>
                    <th className="py-3 px-3">Punch Out</th>
                    <th className="py-3 px-3">Hours</th>
                    <th className="py-3 px-3">Location / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {records.map((rec) => {
                    const statusColors: Record<string, string> = {
                      PRESENT: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                      LATE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                      HALF_DAY: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
                      ON_LEAVE: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                    };

                    return (
                      <tr key={rec.id} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3 px-3 font-semibold text-white">
                          {new Date(rec.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              statusColors[rec.status] || 'bg-neutral-800 text-neutral-400 border-neutral-700'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {rec.punchInAt
                            ? new Date(rec.punchInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {rec.punchOutAt
                            ? new Date(rec.punchOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : rec.punchInAt
                            ? 'Active'
                            : '—'}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-sky-400">
                          {Number(rec.totalHours || 0).toFixed(1)} hrs
                        </td>
                        <td className="py-3 px-3 text-neutral-400 text-[11px]">
                          {rec.punchInLocation && <span>{rec.punchInLocation}</span>}
                          {rec.notes && <span className="text-neutral-500 italic block">{rec.notes}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
