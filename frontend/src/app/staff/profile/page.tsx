'use client';

import React, { useState } from 'react';
import { UserCircle, KeyRound, Clock, LogOut, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentShift, useOpenShift, useCloseShift } from '@/features/pos/pos.hooks';
import { authService } from '@/lib/auth/auth.service';
import { StaffPortalNav } from '@/components/staff/StaffPortalNav';
import { StaffLoginGate } from '@/components/staff/StaffLoginGate';
import { getApiErrorMessage } from '@/utils/api-error';

export default function StaffProfilePage() {
  const { user, isAuthenticated, isStaffUser, isInitializing, logout } = useAuth();

  const shiftQuery = useCurrentShift();
  const openShiftMutation = useOpenShift();
  const closeShiftMutation = useCloseShift();

  const [terminalId, setTerminalId] = useState('MOBILE-1');
  const [openingCash, setOpeningCash] = useState(0);
  const [closingCashCounted, setClosingCashCounted] = useState(0);
  const [shiftMessage, setShiftMessage] = useState('');
  const [closedResult, setClosedResult] = useState<{ variance: number } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!isInitializing && (!isAuthenticated || !isStaffUser)) {
    return <StaffLoginGate redirect="/staff/profile" />;
  }

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setShiftMessage('');
    try {
      await openShiftMutation.mutateAsync({ terminalId, openingCash });
      setShiftMessage('Shift opened.');
    } catch (err) {
      setShiftMessage(getApiErrorMessage(err));
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftQuery.data) return;
    setShiftMessage('');
    setClosedResult(null);
    try {
      const closed = await closeShiftMutation.mutateAsync({
        shiftId: shiftQuery.data.id,
        payload: { closingCashCounted },
      });
      setClosedResult({ variance: Number(closed.variance ?? 0) });
      setShiftMessage('Shift closed.');
    } catch (err) {
      setShiftMessage(getApiErrorMessage(err));
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    if (newPassword.length < 8) {
      setPasswordMessage('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('New password and confirmation do not match.');
      return;
    }
    setIsChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage(getApiErrorMessage(err));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-neutral-900 text-white font-sans antialiased pb-20 sm:pb-0">
      <header className="bg-neutral-950 border-b border-neutral-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
            <UserCircle className="w-4 h-4" />
            My Profile
          </h1>
          <button onClick={() => logout()} className="text-[10px] font-bold text-neutral-400 hover:text-sky-400 flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </header>

      <StaffPortalNav />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Account info */}
        <div className="bg-neutral-800 rounded-2xl border border-neutral-700/80 p-4 space-y-1.5">
          <p className="text-sm font-bold">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-neutral-400">{user?.email}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {user?.roles.map((r) => (
              <span key={r} className="bg-sky-950/50 text-sky-300 border border-sky-800/60 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {r.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Shift management */}
        <div className="bg-neutral-800 rounded-2xl border border-neutral-700/80 p-4 space-y-3">
          <h2 className="text-xs font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            Personal Till Shift
          </h2>

          {shiftMessage && (
            <p className={`text-xs ${shiftMessage.includes('successfully') || shiftMessage.includes('opened') || shiftMessage.includes('closed') ? 'text-emerald-400' : 'text-red-400'}`}>
              {shiftMessage}
            </p>
          )}

          {closedResult && (
            <div className={`text-xs rounded-xl p-2.5 border ${closedResult.variance === 0 ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-amber-950/40 border-amber-800 text-amber-300'}`}>
              Cash variance: {closedResult.variance === 0 ? 'Exact match' : `₹${closedResult.variance.toFixed(2)}`}
            </div>
          )}

          {shiftQuery.isLoading ? (
            <p className="text-xs text-neutral-400">Checking shift status...</p>
          ) : shiftQuery.data ? (
            <form onSubmit={handleCloseShift} className="space-y-2.5">
              <p className="text-[11px] text-neutral-400">
                Open on <span className="font-bold text-white">{shiftQuery.data.terminalId}</span> since{' '}
                {new Date(shiftQuery.data.openedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}.
                Opening float: ₹{shiftQuery.data.openingCash}
              </p>
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-neutral-300">Cash counted at close (₹)</span>
                <input
                  type="number"
                  min={0}
                  value={closingCashCounted}
                  onChange={(e) => setClosingCashCounted(Number(e.target.value) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-600"
                />
              </label>
              <button
                type="submit"
                disabled={closeShiftMutation.isPending}
                className="w-full bg-sky-700 hover:bg-sky-800 disabled:opacity-60 text-white text-xs font-bold py-2.5 rounded-xl"
              >
                {closeShiftMutation.isPending ? 'Closing...' : 'Close Shift'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOpenShift} className="space-y-2.5">
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-neutral-300">Terminal ID</span>
                <input
                  type="text"
                  value={terminalId}
                  onChange={(e) => setTerminalId(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-600"
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-neutral-300">Opening cash float (₹)</span>
                <input
                  type="number"
                  min={0}
                  value={openingCash}
                  onChange={(e) => setOpeningCash(Number(e.target.value) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-600"
                />
              </label>
              <button
                type="submit"
                disabled={openShiftMutation.isPending}
                className="w-full bg-sky-700 hover:bg-sky-800 disabled:opacity-60 text-white text-xs font-bold py-2.5 rounded-xl"
              >
                {openShiftMutation.isPending ? 'Opening...' : 'Open Shift'}
              </button>
            </form>
          )}
        </div>

        {/* Password change */}
        <div className="bg-neutral-800 rounded-2xl border border-neutral-700/80 p-4 space-y-3">
          <h2 className="text-xs font-bold flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-sky-400" />
            Change Password
          </h2>

          {passwordMessage && (
            <p className={`text-xs flex items-center gap-1.5 ${passwordMessage.includes('successfully') ? 'text-emerald-400' : 'text-red-400'}`}>
              {passwordMessage.includes('successfully') ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {passwordMessage}
            </p>
          )}

          <form onSubmit={handleChangePassword} className="space-y-2.5">
            <input
              type="password"
              required
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-600"
            />
            <input
              type="password"
              required
              placeholder="New password (min. 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-600"
            />
            <input
              type="password"
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-600"
            />
            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full bg-neutral-700 hover:bg-neutral-600 disabled:opacity-60 text-white text-xs font-bold py-2.5 rounded-xl"
            >
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
