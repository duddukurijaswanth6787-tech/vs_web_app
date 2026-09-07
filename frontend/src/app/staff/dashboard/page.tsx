'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
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

export default function StaffDashboardPage() {
  const { user, isAuthenticated, isStaffUser, isInitializing, logout } = useAuth();

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
      fetchTodayAttendance();
      fetchMyTasks();
    }
  }, [isAuthenticated, fetchTodayAttendance, fetchMyTasks]);

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

  const staffName = user ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : 'Staff Member';

  return (
    <div className="w-full min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased pb-24 sm:pb-8 flex flex-col">
      {/* Top Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-30 px-4 py-3 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-inner">
              {user?.firstName?.[0] || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-wide">{staffName}</h1>
                <span className="text-[10px] bg-sky-500/20 text-sky-400 font-bold px-2 py-0.5 rounded-full border border-sky-500/30">
                  Staff Member
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Vasanthi's Signature Staff Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchTodayAttendance();
                fetchMyTasks();
              }}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
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
        <section className="bg-gradient-to-b from-neutral-900 to-neutral-900/90 rounded-3xl border border-neutral-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white">Today's Shift & Punch</h2>
              </div>
              <p className="text-xs text-neutral-400">
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
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Active On Duty
                </span>
              ) : attendance?.punchOutAt ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800 text-neutral-400 text-xs font-bold border border-neutral-700">
                  Shift Completed ({attendance.totalHours} hrs)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                  Not Clocked In
                </span>
              )}
            </div>
          </div>

          {/* Stopwatch & Action Grid */}
          <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Stopwatch Section */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 text-center">
              <span className="text-xs text-neutral-400 uppercase tracking-widest font-bold mb-2">
                {isClockedIn ? 'Active Working Time' : 'Total Hours Today'}
              </span>
              <div className="text-4xl sm:text-5xl font-mono font-black text-white tracking-wider">
                {isClockedIn ? formatTimer(elapsedSeconds) : `${attendance?.totalHours || 0} hrs`}
              </div>
              {attendance?.punchInAt && (
                <div className="mt-3 text-[11px] text-neutral-400 flex items-center gap-3">
                  <span>
                    In:{' '}
                    <strong className="text-neutral-200">
                      {new Date(attendance.punchInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </span>
                  {attendance?.punchOutAt && (
                    <span>
                      Out:{' '}
                      <strong className="text-neutral-200">
                        {new Date(attendance.punchOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                    </span>
                  )}
                  {attendance?.status === 'LATE' && (
                    <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      Late
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
                    <label className="block text-xs font-bold text-neutral-400 mb-1">Work Location</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Main Store', 'Warehouse', 'Remote'].map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setLocation(loc)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                            location === loc
                              ? 'bg-sky-500/20 border-sky-400 text-sky-400'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
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
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {actionLoading ? 'Clocking In...' : attendance?.punchOutAt ? 'Shift Completed Today' : 'Punch In Now'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1">
                      Break Deduction (minutes, if any)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={breakMinutes || ''}
                      onChange={(e) => setBreakMinutes(Number(e.target.value))}
                      placeholder="e.g. 30"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <button
                    onClick={handlePunchOut}
                    disabled={actionLoading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all disabled:opacity-50"
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
        <section className="bg-neutral-900 rounded-3xl border border-neutral-800 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white">Today's Assigned Tasks</h2>
                <span className="text-xs font-bold bg-neutral-800 text-neutral-300 px-2.5 py-0.5 rounded-full border border-neutral-700">
                  {completedTasksCount} / {tasks.length} Completed
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">Tasks assigned to you by admin / store manager</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 self-start sm:self-auto">
              {(['ALL', 'PENDING', 'COMPLETED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTaskFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    taskFilter === filter ? 'bg-sky-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
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
              <div className="py-8 text-center bg-neutral-950/40 rounded-2xl border border-dashed border-neutral-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-bold text-neutral-300">All clear!</p>
                <p className="text-xs text-neutral-500">No tasks pending for you right now.</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isDone = task.status === 'COMPLETED';
                const priorityColors = {
                  URGENT: 'bg-red-500/20 text-red-400 border-red-500/30',
                  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                  MEDIUM: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
                  LOW: 'bg-neutral-800 text-neutral-400 border-neutral-700',
                };

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isDone
                        ? 'bg-neutral-950/40 border-neutral-800/60 opacity-70'
                        : 'bg-neutral-950/90 border-neutral-800 hover:border-neutral-700 shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, isDone ? 'TODO' : 'COMPLETED')}
                          disabled={updatingTaskId === task.id}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all mt-0.5 ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-neutral-950 font-bold'
                              : 'border-neutral-700 hover:border-sky-400 text-transparent'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                        <div>
                          <h3
                            className={`text-sm font-bold ${
                              isDone ? 'line-through text-neutral-400' : 'text-neutral-100'
                            }`}
                          >
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{task.description}</p>
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
                              <span className="text-[10px] text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-800 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-neutral-500" />
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
                              className="text-[11px] font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              Start
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                            disabled={updatingTaskId === task.id}
                            className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-colors"
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
            className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-sky-500/40 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Monthly Working Hours</h4>
                <p className="text-xs text-neutral-400">View your attendance history & logs</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-sky-400 transition-colors" />
          </Link>

          <Link
            href="/staff/profile"
            className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-sky-500/40 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Staff Profile & Details</h4>
                <p className="text-xs text-neutral-400">Emergency contacts & employee info</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
          </Link>
        </div>
      </main>
    </div>
  );
}
