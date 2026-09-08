'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  UserCircle,
  KeyRound,
  Clock,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Mail,
  Phone,
  Building,
  Briefcase,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  PhoneCall,
  MapPin,
  ArrowUpRight,
  ReceiptText,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentShift, useOpenShift, useCloseShift } from '@/features/pos/pos.hooks';
import { authService } from '@/lib/auth/auth.service';
import { apiClient } from '@/lib/api/client';
import { StaffPortalNav } from '@/components/staff/StaffPortalNav';
import { StaffLoginGate } from '@/components/staff/StaffLoginGate';
import { getApiErrorMessage } from '@/utils/api-error';

interface StaffProfileData {
  id: string;
  userId: string;
  employeeId: string;
  department: string;
  designation: string;
  jobTitle?: string;
  employmentStatus: string;
  accountStatus: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  emergencyContact?: string;
  address?: string;
  roles?: string[];
  joinedAt?: string;
  createdAt: string;
}

export default function StaffProfilePage() {
  const { user, isAuthenticated, isStaffUser, isInitializing, logout } = useAuth();

  // Profile data
  const [profile, setProfile] = useState<StaffProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

  // Till shift hooks
  const shiftQuery = useCurrentShift();
  const openShiftMutation = useOpenShift();
  const closeShiftMutation = useCloseShift();

  const [terminalId, setTerminalId] = useState('MOBILE-1');
  const [openingCash, setOpeningCash] = useState<number>(0);
  const [closingCashCounted, setClosingCashCounted] = useState<number>(0);
  const [shiftMessage, setShiftMessage] = useState('');
  const [closedResult, setClosedResult] = useState<{ variance: number } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch full staff profile details
  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await apiClient.get('/staff/me');
      if (res.data?.data) {
        setProfile(res.data.data);
      }
    } catch {
      // no-op
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, fetchProfile]);

  if (!isInitializing && (!isAuthenticated || !isStaffUser)) {
    return <StaffLoginGate redirect="/staff/profile" />;
  }

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setShiftMessage('');
    try {
      await openShiftMutation.mutateAsync({ terminalId, openingCash });
      setShiftMessage('Shift opened successfully.');
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
      setShiftMessage('Shift closed successfully.');
    } catch (err) {
      setShiftMessage(getApiErrorMessage(err));
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordMessage('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(getApiErrorMessage(err));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const staffDisplayName = profile
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : user
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : 'Staff Member';

  const employeeId = profile?.employeeId || 'EMP-STAFF';
  const displayRoles = profile?.roles || user?.roles || [];

  return (
    <div className="w-full min-h-screen bg-neutral-50 text-neutral-900 font-sans antialiased pb-28 sm:pb-8 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30 px-3 sm:px-4 py-2.5 sm:py-3 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--brand-primary)] p-1.5 shadow-xs flex items-center justify-center shrink-0">
              <Image
                src="/brand/logo-icon.png"
                alt="Vasanthi's Signature"
                width={1024}
                height={1024}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xs sm:text-sm font-bold text-neutral-900 tracking-wide font-serif truncate max-w-[130px] sm:max-w-none">
                  {staffDisplayName}
                </h1>
                <span className="text-[9px] sm:text-[10px] bg-sky-50 text-sky-700 font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-md border border-sky-200 shrink-0">
                  {employeeId}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 truncate">
                {profile?.department || 'Staff Member'} · {profile?.designation || 'Staff Associate'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => fetchProfile()}
              className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors active:scale-95"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors active:scale-95"
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
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 w-full space-y-4 sm:space-y-6 flex-1">
        {/* PROFILE HEADER / HERO CARD */}
        <section className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/90 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm shrink-0">
                {staffDisplayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 font-serif truncate">{staffDisplayName}</h2>
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {profile?.employmentStatus || 'ACTIVE'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] sm:text-xs text-neutral-500 flex-wrap">
                  <span className="font-mono font-bold text-[var(--brand-primary)] bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 text-[10px]">
                    {employeeId}
                  </span>
                  <span>•</span>
                  <span className="truncate">{profile?.jobTitle || profile?.designation || 'Staff Associate'}</span>
                </div>
              </div>
            </div>

            {/* Quick action button */}
            <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
              <Link
                href="/staff/dashboard"
                className="w-full sm:w-auto justify-center text-xs font-bold text-[var(--brand-primary)] bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3.5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 active:scale-95"
              >
                <Clock className="w-3.5 h-3.5" /> Shift & Tasks Dashboard
              </Link>
            </div>
          </div>

          {/* Detailed Staff Information Grid */}
          <div className="pt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Employee ID */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Employee ID
              </span>
              <p className="text-xs sm:text-sm font-bold font-mono text-neutral-900">{employeeId}</p>
            </div>

            {/* Department */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Department
              </span>
              <p className="text-xs sm:text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate">{profile?.department?.replace(/_/g, ' ') || 'Store Operations'}</span>
              </p>
            </div>

            {/* Designation / Role */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Designation
              </span>
              <p className="text-xs sm:text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate">{profile?.designation?.replace(/_/g, ' ') || 'Staff Associate'}</span>
              </p>
            </div>

            {/* Email Address */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Email Address
              </span>
              <p className="text-xs font-semibold text-neutral-800 break-all flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate">{profile?.email || user?.email || '—'}</span>
              </p>
            </div>

            {/* Phone Number */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Contact Phone
              </span>
              <p className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>{profile?.phone || 'Not provided'}</span>
              </p>
            </div>

            {/* Emergency Contact */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Emergency Contact
              </span>
              <p className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="truncate">{profile?.emergencyContact || 'Not configured'}</span>
              </p>
            </div>

            {/* Date Joined */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Date Joined
              </span>
              <p className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>
                  {profile?.joinedAt
                    ? new Date(profile.joinedAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Active Employee'}
                </span>
              </p>
            </div>

            {/* Assigned Roles */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 sm:col-span-2">
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1.5">
                System Access Roles
              </span>
              <div className="flex flex-wrap gap-1.5">
                {displayRoles.length > 0 ? (
                  displayRoles.map((role) => (
                    <span
                      key={role}
                      className="bg-sky-50 text-sky-800 border border-sky-200 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md uppercase"
                    >
                      {role.replace(/_/g, ' ')}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-neutral-500">Standard Staff Access</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* TWO-COLUMN SECTION: CHANGE PASSWORD & TILL SHIFT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* SECURITY & CHANGE PASSWORD */}
          <section className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/90 p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
              <KeyRound className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--brand-primary)] shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900">Change Account Password</h3>
                <p className="text-[11px] sm:text-xs text-neutral-500">Update your login security credentials</p>
              </div>
            </div>

            {passwordMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordMessage}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 pr-10 text-sm sm:text-xs text-neutral-900 focus:outline-none focus:border-[var(--brand-primary)] shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 p-1"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 pr-10 text-sm sm:text-xs text-neutral-900 focus:outline-none focus:border-[var(--brand-primary)] shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 p-1"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-sm sm:text-xs text-neutral-900 focus:outline-none focus:border-[var(--brand-primary)] shadow-2xs"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all disabled:opacity-50 min-h-[44px]"
              >
                {isChangingPassword ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          </section>

          {/* POS TILL / REGISTER SHIFT */}
          <section className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/90 p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
              <ReceiptText className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--brand-primary)] shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900">POS Cashier Till Shift</h3>
                <p className="text-[11px] sm:text-xs text-neutral-500">Open or reconcile cashier drawer shift</p>
              </div>
            </div>

            {shiftMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  shiftMessage.includes('successfully') || shiftMessage.includes('opened') || shiftMessage.includes('closed')
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{shiftMessage}</span>
              </div>
            )}

            {closedResult && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  closedResult.variance === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <strong>Cash Variance:</strong>{' '}
                {closedResult.variance === 0 ? 'Exact Match (₹0)' : `₹${closedResult.variance.toFixed(2)}`}
              </div>
            )}

            {shiftQuery.isLoading ? (
              <div className="py-8 text-center text-xs text-neutral-400">Checking till shift status...</div>
            ) : shiftQuery.data ? (
              <form onSubmit={handleCloseShift} className="space-y-3">
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-xs text-neutral-700 space-y-1">
                  <div className="flex justify-between font-bold text-neutral-900">
                    <span>Terminal: {shiftQuery.data.terminalId}</span>
                    <span className="text-emerald-700 font-bold">Shift Open</span>
                  </div>
                  <p className="text-neutral-500 text-[11px]">
                    Opened on{' '}
                    {new Date(shiftQuery.data.openedAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  <p className="font-semibold text-neutral-800">Opening Float: ₹{shiftQuery.data.openingCash}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Cash Counted at Close (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={closingCashCounted || ''}
                    onChange={(e) => setClosingCashCounted(Number(e.target.value) || 0)}
                    placeholder="e.g. 5000"
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-sm sm:text-xs text-neutral-900 focus:outline-none focus:border-[var(--brand-primary)] shadow-2xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={closeShiftMutation.isPending}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all disabled:opacity-50 min-h-[44px]"
                >
                  {closeShiftMutation.isPending ? 'Closing Shift...' : 'Close & Reconcile Till'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOpenShift} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Terminal ID</label>
                  <input
                    type="text"
                    required
                    value={terminalId}
                    onChange={(e) => setTerminalId(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-sm sm:text-xs text-neutral-900 focus:outline-none focus:border-[var(--brand-primary)] shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Opening Cash Float (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={openingCash || ''}
                    onChange={(e) => setOpeningCash(Number(e.target.value) || 0)}
                    placeholder="e.g. 2000"
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-sm sm:text-xs text-neutral-900 focus:outline-none focus:border-[var(--brand-primary)] shadow-2xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={openShiftMutation.isPending}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all disabled:opacity-50 min-h-[44px]"
                >
                  {openShiftMutation.isPending ? 'Opening Till...' : 'Open Till Shift'}
                </button>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
