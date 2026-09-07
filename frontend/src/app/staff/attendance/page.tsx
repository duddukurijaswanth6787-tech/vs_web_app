'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock3,
  UserCheck,
  TrendingUp,
  RefreshCw,
  Award,
  LogOut,
  MapPin,
  FileText,
  ArrowUpRight,
  UserCircle,
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

interface StaffProfileData {
  id: string;
  employeeId: string;
  department: string;
  designation: string;
  firstName: string;
  lastName?: string;
  email: string;
}

export default function StaffAttendanceHistoryPage() {
  const { user, isAuthenticated, isStaffUser, isInitializing, logout } = useAuth();
  const [profile, setProfile] = useState<StaffProfileData | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Load Staff Profile Details
  const fetchProfile = useCallback(async () => {
    try {
      const res = await apiClient.get('/staff/me');
      if (res.data?.data) {
        setProfile(res.data.data);
      }
    } catch {
      // no-op
    }
  }, []);

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
      fetchProfile();
      fetchAttendance();
    }
  }, [isAuthenticated, fetchProfile, fetchAttendance]);

  // Performance calculations
  const totalHours = records.reduce((sum, r) => sum + Number(r.totalHours || 0), 0);
  const presentDays = records.filter((r) => ['PRESENT', 'LATE'].includes(r.status)).length;
  const lateDays = records.filter((r) => r.status === 'LATE').length;
  const onTimePercentage = presentDays > 0 ? Math.round(((presentDays - lateDays) / presentDays) * 100) : 100;

  if (!isInitializing && (!isAuthenticated || !isStaffUser)) {
    return <StaffLoginGate redirect="/staff/attendance" />;
  }

  const staffDisplayName = profile
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : user
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : 'Staff Member';

  const employeeId = profile?.employeeId || 'EMP-STAFF';

  return (
    <div className="w-full min-h-screen bg-neutral-50 text-neutral-900 font-sans antialiased pb-24 sm:pb-8 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30 px-4 py-3 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--brand-primary)] p-1.5 shadow-xs flex items-center justify-center">
              <Image
                src="/brand/logo-icon.png"
                alt="Vasanthi's Signature"
                width={1024}
                height={1024}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-neutral-900 tracking-wide font-serif">{staffDisplayName}</h1>
                <span className="text-[10px] bg-sky-50 text-sky-700 font-mono font-bold px-2 py-0.5 rounded-md border border-sky-200">
                  {employeeId}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                {profile?.department || 'Staff Member'} · {profile?.designation || 'Staff Associate'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchProfile();
                fetchAttendance();
              }}
              className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <StaffPortalNav />

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-6 w-full space-y-6 flex-1">
        {/* MONTH SUMMARY & KPIS */}
        <section className="bg-white rounded-2xl border border-neutral-200/90 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Clock className="w-5 h-5 text-[var(--brand-primary)]" />
                <h2 className="text-base font-bold text-neutral-900">Monthly Working Hours & Summary</h2>
              </div>
              <p className="text-xs text-neutral-500">Total payable hours, shifts, and punctuality score</p>
            </div>
            <div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-neutral-200 text-neutral-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[var(--brand-primary)] shadow-2xs cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                <Clock className="w-4 h-4 text-[var(--brand-primary)]" />
                <span>Total Hours</span>
              </div>
              <div className="text-2xl font-mono font-bold text-neutral-900">
                {totalHours.toFixed(1)} <span className="text-xs font-normal text-neutral-500">hrs</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Present Days</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700">
                {presentDays} <span className="text-xs font-normal text-neutral-500">days</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                <Clock3 className="w-4 h-4 text-amber-600" />
                <span>Late Arrivals</span>
              </div>
              <div className="text-2xl font-bold text-amber-700">{lateDays}</div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>On-Time Score</span>
              </div>
              <div className="text-2xl font-bold text-indigo-700">{onTimePercentage}%</div>
            </div>
          </div>
        </section>

        {/* ATTENDANCE SHIFT LOG TABLE */}
        <section className="bg-white rounded-2xl border border-neutral-200/90 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-100">
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--brand-primary)]" />
              Daily Shift Logs
            </h2>
            <span className="text-xs text-neutral-500 font-bold bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200">
              {records.length} {records.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-neutral-400 text-xs">Loading shift records...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500 text-xs bg-red-50 rounded-xl border border-red-200">
              {error}
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
              <Calendar className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-800">No shift logs found</p>
              <p className="text-xs text-neutral-500 mt-0.5">No attendance recorded for {selectedMonth}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px] bg-neutral-50/50">
                    <th className="py-3 px-3.5">Date</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5">Punch In</th>
                    <th className="py-3 px-3.5">Punch Out</th>
                    <th className="py-3 px-3.5">Total Hours</th>
                    <th className="py-3 px-3.5">Location / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {records.map((rec) => {
                    const statusColors: Record<string, string> = {
                      PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      LATE: 'bg-amber-50 text-amber-700 border-amber-200',
                      HALF_DAY: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                      ON_LEAVE: 'bg-purple-50 text-purple-700 border-purple-200',
                    };

                    return (
                      <tr key={rec.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-3.5 px-3.5 font-bold text-neutral-900">
                          {new Date(rec.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>
                        <td className="py-3.5 px-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              statusColors[rec.status] || 'bg-neutral-100 text-neutral-600 border-neutral-200'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3.5 font-mono text-neutral-800">
                          {rec.punchInAt
                            ? new Date(rec.punchInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="py-3.5 px-3.5 font-mono text-neutral-800">
                          {rec.punchOutAt ? (
                            new Date(rec.punchOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          ) : rec.punchInAt ? (
                            <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200">
                              Active Now
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3.5 px-3.5 font-mono font-bold text-[var(--brand-primary)]">
                          {Number(rec.totalHours || 0).toFixed(1)} hrs
                        </td>
                        <td className="py-3.5 px-3.5 text-neutral-600 text-[11px]">
                          {rec.punchInLocation && (
                            <span className="inline-flex items-center gap-1 font-semibold text-neutral-800 mr-2">
                              <MapPin className="w-3 h-3 text-neutral-400" /> {rec.punchInLocation}
                            </span>
                          )}
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

        {/* QUICK LINKS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/staff/dashboard"
            className="p-5 rounded-2xl bg-white border border-neutral-200 hover:border-[var(--brand-primary)] transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[var(--brand-primary)]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 group-hover:text-[var(--brand-primary)] transition-colors">
                  Today's Shift & Tasks
                </h4>
                <p className="text-xs text-neutral-500">Clock in/out & complete assigned tasks</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-[var(--brand-primary)] transition-colors" />
          </Link>

          <Link
            href="/staff/profile"
            className="p-5 rounded-2xl bg-white border border-neutral-200 hover:border-indigo-500 transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <UserCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">
                  Staff Profile & Security
                </h4>
                <p className="text-xs text-neutral-500">Employee ID, contact & password</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-indigo-600 transition-colors" />
          </Link>
        </div>
      </main>
    </div>
  );
}
