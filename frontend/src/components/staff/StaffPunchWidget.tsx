'use client';

import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, CheckCircle2, ListTodo, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

export interface TodayAttendanceState {
  isPunchedIn: boolean;
  attendance?: {
    id: string;
    staffProfileId: string;
    employeeId: string;
    staffName: string;
    department: string;
    punchInAt: string;
    punchOutAt?: string;
    totalHours: number;
    breakMinutes: number;
    status: string;
    shiftType: string;
    punchInLocation?: string;
  };
}

export default function StaffPunchWidget() {
  const [data, setData] = useState<TodayAttendanceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'IN' | 'OUT'>('IN');
  const [shiftType, setShiftType] = useState('GENERAL');
  const [location, setLocation] = useState('Main Store Counter');
  const [notes, setNotes] = useState('');
  const [breakMins, setBreakMins] = useState(0);
  const [elapsedSecs, setElapsedSecs] = useState(0);

  const fetchTodayStatus = async () => {
    try {
      const res = await apiClient.get('/staff/attendance/today');
      setData(res.data?.data || null);
    } catch {
      // User might not have staff access or unauthenticated silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  // Live stopwatch when punched in
  useEffect(() => {
    if (!data?.isPunchedIn || !data.attendance?.punchInAt) {
      setElapsedSecs(0);
      return;
    }

    const punchInDate = new Date(data.attendance.punchInAt).getTime();
    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((Date.now() - punchInDate) / 1000));
      setElapsedSecs(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data]);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handlePunchIn = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.post('/staff/attendance/punch-in', {
        shiftType,
        location,
        notes: notes || undefined,
      });
      setIsModalOpen(false);
      setNotes('');
      await fetchTodayStatus();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to punch in');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePunchOut = async () => {
    setActionLoading(true);
    try {
      await apiClient.post('/staff/attendance/punch-out', {
        breakMinutes: Number(breakMins) || 0,
        notes: notes || undefined,
      });
      setIsModalOpen(false);
      setNotes('');
      await fetchTodayStatus();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to punch out');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return null;

  const isPunchedIn = !!data?.isPunchedIn;
  const isCompleted = !!data?.attendance?.punchOutAt;

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {isPunchedIn ? (
          <button
            onClick={() => {
              setModalMode('OUT');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 sm:px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs min-h-[36px]"
            title={`Punched in at ${new Date(data.attendance!.punchInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="font-mono font-bold text-[11px] sm:text-xs">{formatElapsed(elapsedSecs)}</span>
            <span className="hidden md:inline font-semibold text-[11px] text-emerald-700">· Clock Out</span>
          </button>
        ) : isCompleted ? (
          <div className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 sm:px-3 py-1 text-xs font-semibold text-neutral-600 min-h-[36px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px]">Shift Done ({data.attendance?.totalHours}h)</span>
          </div>
        ) : (
          <button
            onClick={() => {
              setModalMode('IN');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-full border border-neutral-300 bg-neutral-900 px-3 py-1 text-xs font-bold text-white hover:bg-neutral-800 transition shadow-xs min-h-[36px]"
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-400" />
            <span>Punch In</span>
          </button>
        )}
      </div>

      {/* Punch In / Out Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-neutral-100 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${modalMode === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {modalMode === 'IN' ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                    {modalMode === 'IN' ? 'Staff Daily Attendance Clock-In' : 'Staff Daily Attendance Clock-Out'}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-base font-bold"
              >
                ✕
              </button>
            </div>

            {modalMode === 'IN' ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Shift Type</label>
                  <select
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-neutral-900"
                  >
                    <option value="GENERAL">General Shift (09:30 AM - 07:00 PM)</option>
                    <option value="MORNING">Morning Shift (08:00 AM - 04:30 PM)</option>
                    <option value="EVENING">Evening Shift (01:00 PM - 09:30 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Clock-In Location / Terminal</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Counter 1, Jubilee Hills Main Store"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Remarks / Shift Notes (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any notes for store supervisor..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-neutral-600">
                    <span>Clock-In Time:</span>
                    <span className="font-bold text-neutral-900">
                      {new Date(data!.attendance!.punchInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Active Shift Duration:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatElapsed(elapsedSecs)}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Break Duration (Minutes)</label>
                  <input
                    type="number"
                    value={breakMins}
                    onChange={(e) => setBreakMins(Number(e.target.value))}
                    min={0}
                    max={120}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Shift Handover / EOD Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Completed tasks, cash handover notes..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-neutral-200 hover:bg-neutral-100 rounded-xl text-xs font-bold text-neutral-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={modalMode === 'IN' ? handlePunchIn : handlePunchOut}
                disabled={actionLoading}
                className={`inline-flex items-center gap-1.5 px-5 py-2 text-white rounded-xl text-xs font-bold transition shadow-sm ${
                  modalMode === 'IN' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-neutral-900 hover:bg-neutral-800'
                }`}
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : modalMode === 'IN' ? <LogIn className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
                {modalMode === 'IN' ? 'Confirm Clock-In' : 'Confirm Clock-Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
