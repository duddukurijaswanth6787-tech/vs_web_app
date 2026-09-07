'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  ListTodo,
  Calendar,
  Sparkles,
  MapPin,
  FileText,
  RefreshCw,
  LogOut,
  UserCheck,
  Check,
  ArrowUpRight,
  TrendingUp,
  Award,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { StaffPortalNav } from '@/components/staff/StaffPortalNav';
import { StaffLoginGate } from '@/components/staff/StaffLoginGate';

interface StaffAttendance {
  id: string;
  staffProfileId: string;
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

interface StaffTask {
  id: string;
  title: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'BLOCKED';
  dueDate?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  assignedBy?: {
    firstName: string;
    lastName?: string;
  } | null;
}

interface StaffProfileData {
  id: string;
  employeeId: string;
  department: string;
  designation: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  jobTitle?: string;
}

export default function StaffDashboardPage() {
  const { user, isAuthenticated, isStaffUser, isInitializing, logout } = useAuth();

  // Profile metadata
  const [profile, setProfile] = useState<StaffProfileData | null>(null);

  // Attendance state
  const [attendance, setAttendance] = useState<StaffAttendance | null>(null);
  const [isClockedIn, setIsClockedIn] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [location, setLocation] = useState<string>('Main Store');
  const [punchNotes, setPunchNotes] = useState<string>('');
  const [breakMinutes, setBreakMinutes] = useState<number>(0);

  // Tasks state
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(true);
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Load Staff Profile Details (Employee ID, Department, Designation)
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

  // Load Today Attendance
  const fetchTodayAttendance = useCallback(async () => {
    setLoadingAttendance(true);
    try {
      const res = await apiClient.get('/staff/attendance/today');
      const data = res.data?.data;
      if (data) {
        setAttendance(data.attendance || null);
        setIsClockedIn(!!data.isClockedIn);
      }
    } catch {
      // no-op
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  // Load Staff Tasks
  const fetchMyTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const res = await apiClient.get('/staff/tasks/my-tasks');
      const data = res.data?.data;
      if (Array.isArray(data)) {
        setTasks(data);
      }
    } catch {
      // no-op
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
      fetchTodayAttendance();
      fetchMyTasks();
    }
  }, [isAuthenticated, fetchProfile, fetchTodayAttendance, fetchMyTasks]);

  // Live stopwatch when clocked in
  useEffect(() => {
    if (!isClockedIn || !attendance?.punchInAt) {
      setElapsedSeconds(0);
      return;
    }

    const punchInTime = new Date(attendance.punchInAt).getTime();
    const updateElapsed = () => {
      const diffMs = Math.max(0, Date.now() - punchInTime);
      setElapsedSeconds(Math.floor(diffMs / 1000));
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [isClockedIn, attendance]);

  // Stopwatch formatted string
  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Punch In Action
  const handlePunchIn = async () => {
    setActionLoading(true);
    try {
      await apiClient.post('/staff/attendance/punch-in', {
        location,
        notes: punchNotes || undefined,
        shiftType: 'GENERAL',
      });
      await fetchTodayAttendance();
      setPunchNotes('');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to punch in');
    } finally {
      setActionLoading(false);
    }
  };

  // Punch Out Action
  const handlePunchOut = async () => {
    if (!confirm('Are you sure you want to punch out for today?')) return;
    setActionLoading(true);
    try {
      await apiClient.post('/staff/attendance/punch-out', {
        breakMinutes: breakMinutes > 0 ? breakMinutes : undefined,
        notes: punchNotes || undefined,
      });
      await fetchTodayAttendance();
      setPunchNotes('');
      setBreakMinutes(0);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to punch out');
    } finally {
      setActionLoading(false);
    }
  };

  // Task Status Update
  const handleUpdateTaskStatus = async (taskId: string, newStatus: StaffTask['status']) => {
    setUpdatingTaskId(taskId);
    try {
      await apiClient.patch(`/staff/tasks/${taskId}`, { status: newStatus });
      await fetchMyTasks();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to update task');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'PENDING') {
      return tasks.filter((t) => t.status !== 'COMPLETED');
    }
    if (taskFilter === 'COMPLETED') {
      return tasks.filter((t) => t.status === 'COMPLETED');
    }
    return tasks;
  }, [tasks, taskFilter]);

  const completedTasksCount = useMemo(() => tasks.filter((t) => t.status === 'COMPLETED').length, [tasks]);

  if (!isInitializing && (!isAuthenticated || !isStaffUser)) {
    return <StaffLoginGate redirect="/staff/dashboard" />;
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
              <Image src="/brand/logo-icon.png" alt="Vasanthi's Signature" width={1024} height={1024} className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-neutral-900 tracking-wide font-serif">{staffDisplayName}</h1>
                <span className="text-[10px] bg-sky-50 text-sky-700 font-mono font-bold px-2 py-0.5 rounded-md border border-sky-200">
                  {employeeId}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                {profile?.department || 'Sales'} · {profile?.designation || 'Staff Associate'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchProfile();
                fetchTodayAttendance();
                fetchMyTasks();
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
        {/* HERO SHIFT CARD: Clock-In / Clock-Out */}
        <section className="bg-white rounded-2xl border border-neutral-200/90 p-5 sm:p-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-[var(--brand-primary)]" />
                <h2 className="text-base font-bold text-neutral-900">Today's Shift & Attendance</h2>
              </div>
              <p className="text-xs text-neutral-500">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {isClockedIn ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Active On Duty
                </span>
              ) : attendance?.punchOutAt ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-bold border border-neutral-200">
                  Shift Completed ({attendance.totalHours} hrs)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                  Not Clocked In
                </span>
              )}
            </div>
          </div>

          {/* Stopwatch & Action Grid */}
          <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Stopwatch Section */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
              <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-bold mb-2">
                {isClockedIn ? 'Active Working Time' : 'Total Hours Today'}
              </span>
              <div className="text-4xl sm:text-5xl font-mono font-bold text-neutral-900 tracking-wider">
                {isClockedIn ? formatTimer(elapsedSeconds) : `${attendance?.totalHours || 0} hrs`}
              </div>
              {attendance?.punchInAt && (
                <div className="mt-3 text-xs text-neutral-600 flex items-center gap-3">
                  <span>
                    In:{' '}
                    <strong className="text-neutral-900 font-mono">
                      {new Date(attendance.punchInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </span>
                  {attendance?.punchOutAt && (
                    <span>
                      Out:{' '}
                      <strong className="text-neutral-900 font-mono">
                        {new Date(attendance.punchOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                    </span>
                  )}
                  {attendance?.status === 'LATE' && (
                    <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                      Late Arrival
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {!isClockedIn ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Work Location</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Main Store', 'Warehouse', 'Remote'].map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setLocation(loc)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                            location === loc
                              ? 'bg-sky-50 border-[var(--brand-primary)] text-[var(--brand-primary)] shadow-2xs'
                              : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handlePunchIn}
                    disabled={actionLoading || !!attendance?.punchOutAt}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {actionLoading ? 'Clocking In...' : attendance?.punchOutAt ? 'Shift Completed Today' : 'Punch In Now'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">
                      Break Deduction (minutes, if any)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={breakMinutes || ''}
                      onChange={(e) => setBreakMinutes(Number(e.target.value))}
                      placeholder="e.g. 30"
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[var(--brand-primary)]"
                    />
                  </div>

                  <button
                    onClick={handlePunchOut}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    {actionLoading ? 'Punching Out...' : 'Punch Out (End Shift)'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* TODAY'S ASSIGNED TASKS CARD */}
        <section className="bg-white rounded-2xl border border-neutral-200/90 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-[var(--brand-primary)]" />
                <h2 className="text-base font-bold text-neutral-900">Today's Assigned Tasks</h2>
                <span className="text-xs font-bold bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded-full border border-neutral-200">
                  {completedTasksCount} / {tasks.length} Completed
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">Tasks assigned to you by admin / store manager</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200 self-start sm:self-auto">
              {(['ALL', 'PENDING', 'COMPLETED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTaskFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    taskFilter === filter ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Task List */}
          <div className="mt-4 space-y-3">
            {loadingTasks ? (
              <div className="py-8 text-center text-neutral-400 text-xs">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="py-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-bold text-neutral-800">All tasks completed!</p>
                <p className="text-xs text-neutral-500">No pending tasks for you right now.</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isDone = task.status === 'COMPLETED';
                const priorityColors = {
                  URGENT: 'bg-red-50 text-red-700 border-red-200',
                  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
                  MEDIUM: 'bg-sky-50 text-sky-700 border-sky-200',
                  LOW: 'bg-neutral-100 text-neutral-600 border-neutral-200',
                };

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isDone
                        ? 'bg-neutral-50/60 border-neutral-200/60 opacity-80'
                        : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, isDone ? 'TODO' : 'COMPLETED')}
                          disabled={updatingTaskId === task.id}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all mt-0.5 ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                              : 'border-neutral-300 hover:border-emerald-500 text-transparent'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                        <div>
                          <h3
                            className={`text-sm font-bold ${
                              isDone ? 'line-through text-neutral-400' : 'text-neutral-900'
                            }`}
                          >
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{task.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                priorityColors[task.priority] || priorityColors.MEDIUM
                              }`}
                            >
                              {task.priority} Priority
                            </span>
                            {task.dueDate && (
                              <span className="text-[10px] text-neutral-600 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-200 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-neutral-400" />
                                Due: {new Date(task.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            {task.assignedBy && (
                              <span className="text-[10px] text-neutral-500">
                                Assigned by {task.assignedBy.firstName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {!isDone && (
                        <div className="flex items-center gap-1.5 self-start">
                          {task.status !== 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                              disabled={updatingTaskId === task.id}
                              className="text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              Start
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                            disabled={updatingTaskId === task.id}
                            className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Done
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* SUMMARY / QUICK LINKS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/staff/attendance"
            className="p-5 rounded-2xl bg-white border border-neutral-200 hover:border-[var(--brand-primary)] transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[var(--brand-primary)]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 group-hover:text-[var(--brand-primary)] transition-colors">
                  Monthly Working Hours
                </h4>
                <p className="text-xs text-neutral-500">View your attendance logs & payable hours</p>
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
                <UserCheck className="w-5 h-5" />
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
