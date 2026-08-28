'use client';

import React, { useEffect, useState } from 'react';
import {
  Wallet,
  Clock,
  IndianRupee,
  ShoppingCart,
  Undo2,
  Printer,
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission } from '@/lib/permissions/rules';
import { getApiErrorMessage } from '@/utils/api-error';
import {
  useCurrentShift,
  useOpenShift,
  useCloseShift,
  useShiftsList,
  useShiftReport,
  useCashMovements,
  useRecordCashMovement,
  usePosDaySummary,
} from '@/features/pos/pos.hooks';
import { useTerminalId } from '@/features/pos/terminal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  CASH: '#059669',
  UPI: '#0369a1',
  CARD: '#7e22ce',
  CREDIT: '#ca8a04',
  SPLIT: '#0284c7',
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function PosDashboardPage() {
  const { user } = useAuth();
  const canViewDashboard = hasPermission(user, 'pos:view');

  // Defaults to the register this browser is, rather than assuming the
  // counter. Still editable, so a manager can inspect another terminal.
  const { terminalId: deviceTerminalId, isResolved: terminalResolved } = useTerminalId();
  const [terminalId, setTerminalId] = useState('');

  useEffect(() => {
    if (terminalResolved && !terminalId) setTerminalId(deviceTerminalId);
  }, [terminalResolved, deviceTerminalId, terminalId]);
  const [openingCashInput, setOpeningCashInput] = useState('');
  const [closingCashInput, setClosingCashInput] = useState('');
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [viewingShiftId, setViewingShiftId] = useState<string | null>(null);
  const [closeResult, setCloseResult] = useState<{ expected: number; counted: number; variance: number } | null>(null);
  const [cashDirection, setCashDirection] = useState<'IN' | 'OUT'>('OUT');
  const [cashAmountInput, setCashAmountInput] = useState('');
  const [cashReasonInput, setCashReasonInput] = useState('');

  const { data: currentShift, isLoading: shiftLoading } = useCurrentShift(
    terminalId,
    !!terminalId,
  );
  const openShiftMutation = useOpenShift();
  const closeShiftMutation = useCloseShift();
  const cashMovementMutation = useRecordCashMovement();
  const { data: daySummary, isLoading: summaryLoading } = usePosDaySummary(selectedDate);
  const { data: shiftsList } = useShiftsList({ limit: 10 });
  const { data: reportData } = useShiftReport(viewingShiftId || undefined);
  const { data: cashMovements } = useCashMovements(currentShift?.id);

  const handleOpenShift = () => {
    const amount = parseFloat(openingCashInput);
    if (isNaN(amount) || amount < 0) return;
    openShiftMutation.mutate(
      { terminalId, openingCash: amount },
      { onSuccess: () => setOpeningCashInput('') },
    );
  };

  // Paying a delivery boy out of the till, or dropping a float in, moves the
  // drawer as surely as a sale does. Recorded here so the close still balances.
  const handleCashMovement = () => {
    const amount = parseFloat(cashAmountInput);
    if (isNaN(amount) || amount <= 0 || !cashReasonInput.trim()) return;
    cashMovementMutation.mutate(
      {
        terminalId,
        direction: cashDirection,
        amount,
        reason: cashReasonInput.trim(),
      },
      {
        onSuccess: () => {
          setCashAmountInput('');
          setCashReasonInput('');
        },
      },
    );
  };

  const handleCloseShift = () => {
    if (!currentShift) return;
    const amount = parseFloat(closingCashInput);
    if (isNaN(amount) || amount < 0) return;
    closeShiftMutation.mutate(
      { shiftId: currentShift.id, payload: { closingCashCounted: amount } },
      {
        onSuccess: (closed) => {
          setCloseResult({
            expected: Number(closed.closingCashExpected || 0),
            counted: Number(closed.closingCashCounted || 0),
            variance: Number(closed.variance || 0),
          });
          setClosingCashInput('');
          setShowCloseForm(false);
        },
      },
    );
  };

  const handlePrintReport = () => {
    if (!reportData) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const { shift, reportType, byMethod, orderCount, refundsCount, refundsAmount, windowStart, windowEnd, cashIn, cashOut, expectedCash } = reportData;
    const html = `
      <html><head><title>${reportType === 'X_REPORT' ? 'X-Report' : 'Z-Report'} - ${shift.terminalId}</title>
      <style>
        body { font-family: 'Courier New', monospace; max-width: 320px; margin: 0 auto; padding: 16px; font-size: 12px; }
        h1 { font-size: 14px; text-align: center; margin-bottom: 4px; }
        p { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        td { padding: 3px 0; border-bottom: 1px dashed #ccc; }
        .right { text-align: right; }
        .total { font-weight: bold; border-top: 2px solid #000; margin-top: 8px; padding-top: 6px; }
        hr { border: none; border-top: 1px dashed #000; }
      </style></head><body>
        <h1>Vasanthi's Signature</h1>
        <p style="text-align:center">${reportType === 'X_REPORT' ? 'X-REPORT (Mid-Shift)' : 'Z-REPORT (Final)'}</p>
        <hr/>
        <p>Terminal: ${shift.terminalId}</p>
        <p>Cashier: ${shift.cashier ? `${shift.cashier.firstName} ${shift.cashier.lastName || ''}` : shift.cashierId}</p>
        <p>Window: ${new Date(windowStart).toLocaleString('en-IN')} - ${new Date(windowEnd).toLocaleString('en-IN')}</p>
        <hr/>
        <table>
          ${byMethod.map((m) => `<tr><td>${m.method} (${m.count})</td><td class="right">${formatCurrency(m.revenue)}</td></tr>`).join('')}
        </table>
        <p class="total">Total Orders: ${orderCount}</p>
        <p>Refunds: ${refundsCount} (${formatCurrency(refundsAmount)})</p>
        <hr/>
        <p>Opening Cash: ${formatCurrency(Number(shift.openingCash))}</p>
        ${cashIn ? `<p>Cash Paid In: ${formatCurrency(cashIn)}</p>` : ''}
        ${cashOut ? `<p>Cash Paid Out: ${formatCurrency(cashOut)}</p>` : ''}
        ${shift.status === 'OPEN' ? `<p style="font-weight:bold">Cash Expected Now: ${formatCurrency(expectedCash ?? 0)}</p>` : ''}
        ${shift.status === 'CLOSED' ? `
          <p>Expected Cash: ${formatCurrency(Number(shift.closingCashExpected || 0))}</p>
          <p>Counted Cash: ${formatCurrency(Number(shift.closingCashCounted || 0))}</p>
          <p style="font-weight:bold">Variance: ${formatCurrency(Number(shift.variance || 0))}</p>
        ` : ''}
      </body></html>
    `;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  };

  const paymentChart = (daySummary?.byMethod || []).map((m) => ({ name: m.method, revenue: m.revenue }));
  const terminalChart = (daySummary?.byTerminal || []).map((t) => ({ name: t.terminalId, revenue: t.revenue }));
  const cashierChart = (daySummary?.byCashier || []).map((c) => ({ name: c.cashierName, revenue: c.revenue }));

  if (!canViewDashboard) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-neutral-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 max-w-sm text-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-[var(--brand-primary)] mx-auto" />
          <h1 className="text-sm font-bold text-neutral-900">Access Restricted</h1>
          <p className="text-xs text-neutral-500 leading-relaxed">
            You don&apos;t have permission to view the Till &amp; Shift Dashboard. Ask a super admin to grant you the
            <span className="font-mono font-semibold text-neutral-700"> pos:view </span>
            permission from Admin &rarr; Access Control &rarr; RBAC Matrix.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-100 p-3 sm:p-6 font-sans space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-serif text-[var(--brand-primary)]">Till & Shift Dashboard</h1>
          <p className="text-xs text-neutral-500 mt-1">Cash reconciliation, counter performance, and daily reports.</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="text-xs border border-neutral-250 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950"
        />
      </div>

      {/* Shift Status Panel */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-4 h-4 text-[var(--brand-primary)]" />
          <h2 className="text-sm font-bold text-neutral-900">Your Till</h2>
        </div>

        {shiftLoading ? (
          <p className="text-xs text-neutral-400">Checking shift status...</p>
        ) : currentShift ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-[10px] font-semibold text-neutral-500 uppercase">Terminal</p>
                <p className="text-sm font-bold text-neutral-900">{currentShift.terminalId}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-neutral-500 uppercase">Opened At</p>
                <p className="text-sm font-bold text-neutral-900">{new Date(currentShift.openedAt).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-neutral-500 uppercase">Opening Cash</p>
                <p className="text-sm font-bold text-neutral-900">{formatCurrency(Number(currentShift.openingCash))}</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">
                <Clock className="w-3 h-3" /> Shift Open
              </div>
            </div>

            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 space-y-3">
              <p className="text-[10px] font-bold text-neutral-500 uppercase">Cash In / Out</p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex rounded-lg overflow-hidden border border-neutral-250">
                  {(['OUT', 'IN'] as const).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => setCashDirection(dir)}
                      className={`px-3 py-1.5 text-xs font-bold ${
                        cashDirection === dir
                          ? 'bg-[var(--brand-primary)] text-white'
                          : 'bg-white text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {dir === 'OUT' ? 'Paid Out' : 'Paid In'}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0"
                  value={cashAmountInput}
                  onChange={(e) => setCashAmountInput(e.target.value)}
                  placeholder="Amount"
                  className="border border-neutral-250 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                />
                <input
                  type="text"
                  value={cashReasonInput}
                  onChange={(e) => setCashReasonInput(e.target.value)}
                  placeholder="Reason (e.g. paid courier)"
                  className="border border-neutral-250 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-48 focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                />
                <button
                  onClick={handleCashMovement}
                  disabled={
                    cashMovementMutation.isPending ||
                    !cashAmountInput ||
                    !cashReasonInput.trim()
                  }
                  className="bg-neutral-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-neutral-800 disabled:opacity-50"
                >
                  {cashMovementMutation.isPending ? 'Recording...' : 'Record'}
                </button>
              </div>
              {cashMovementMutation.isError && (
                <p className="text-xs font-medium text-sky-700">
                  {getApiErrorMessage(cashMovementMutation.error, 'Could not record that cash movement.')}
                </p>
              )}
              {cashMovements && cashMovements.movements.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-neutral-200">
                  <p className="text-[11px] font-bold text-neutral-600 pt-2">
                    In {formatCurrency(cashMovements.cashIn)} &middot; Out {formatCurrency(cashMovements.cashOut)}
                  </p>
                  {cashMovements.movements.slice(0, 5).map((m) => (
                    <p key={m.id} className="text-[11px] text-neutral-600 font-medium">
                      <span className={m.direction === 'IN' ? 'text-emerald-700' : 'text-sky-700'}>
                        {m.direction === 'IN' ? '+' : '-'}{formatCurrency(m.amount)}
                      </span>{' '}
                      {m.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {!showCloseForm ? (
              <button
                onClick={() => setShowCloseForm(true)}
                className="bg-[var(--brand-primary)] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[var(--brand-primary-dark)]"
              >
                Close Shift
              </button>
            ) : (
              <div className="flex flex-wrap items-end gap-3 bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Cash Counted in Drawer</label>
                  <input
                    type="number"
                    min="0"
                    value={closingCashInput}
                    onChange={(e) => setClosingCashInput(e.target.value)}
                    placeholder="0.00"
                    className="border border-neutral-250 rounded-lg px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                  />
                </div>
                <button
                  onClick={handleCloseShift}
                  disabled={closeShiftMutation.isPending || !closingCashInput}
                  className="bg-[var(--brand-primary)] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[var(--brand-primary-dark)] disabled:opacity-50"
                >
                  {closeShiftMutation.isPending ? 'Closing...' : 'Confirm & Close'}
                </button>
                <button
                  onClick={() => setShowCloseForm(false)}
                  className="text-xs font-bold text-neutral-500 px-3 py-2 hover:text-neutral-800"
                >
                  Cancel
                </button>
                {closeShiftMutation.isError && (
                  <p className="w-full text-xs font-medium text-sky-700">
                    {getApiErrorMessage(closeShiftMutation.error, 'Could not close the shift.')}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Terminal</label>
              <input
                type="text"
                value={terminalId}
                onChange={(e) => setTerminalId(e.target.value.toUpperCase())}
                className="border border-neutral-250 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Opening Cash Float</label>
              <input
                type="number"
                min="0"
                value={openingCashInput}
                onChange={(e) => setOpeningCashInput(e.target.value)}
                placeholder="0.00"
                className="border border-neutral-250 rounded-lg px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
              />
            </div>
            <button
              onClick={handleOpenShift}
              disabled={openShiftMutation.isPending || !openingCashInput}
              className="bg-[var(--brand-primary)] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[var(--brand-primary-dark)] disabled:opacity-50"
            >
              {openShiftMutation.isPending ? 'Opening...' : 'Open Shift'}
            </button>
            {openShiftMutation.isError && (
              <p className="text-[11px] text-red-600 basis-full">
                {(openShiftMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not open shift.'}
              </p>
            )}
          </div>
        )}

        {closeResult && (
          <div className={`mt-4 rounded-xl p-4 border flex items-start gap-3 ${Math.abs(closeResult.variance) < 1 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
            {Math.abs(closeResult.variance) < 1 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            )}
            <div className="text-xs">
              <p className="font-bold text-neutral-900">Shift closed — Expected {formatCurrency(closeResult.expected)}, Counted {formatCurrency(closeResult.counted)}</p>
              <p className="text-neutral-600 mt-0.5">
                Variance: <span className={Math.abs(closeResult.variance) < 1 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>{formatCurrency(closeResult.variance)}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Day Summary KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Total Revenue</span>
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mt-3">{summaryLoading ? '...' : formatCurrency(daySummary?.totalRevenue || 0)}</h3>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Total Orders</span>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mt-3">{summaryLoading ? '...' : daySummary?.totalOrders || 0}</h3>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Returns / Refunds</span>
            <Undo2 className="h-4 w-4 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mt-3">
            {summaryLoading ? '...' : `${daySummary?.totalRefundsCount || 0} (${formatCurrency(daySummary?.totalRefundsAmount || 0)})`}
          </h3>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">Payment Method Split</h3>
          <div className="h-56 w-full">
            {paymentChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="name" stroke="#a3a3a3" fontSize={10} tickLine={false} />
                  <YAxis stroke="#a3a3a3" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <ChartTooltip formatter={(val: unknown) => [formatCurrency(val as number), 'Revenue']} contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {paymentChart.map((p) => (
                      <Cell key={p.name} fill={PAYMENT_METHOD_COLORS[p.name] || '#a3a3a3'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center"><p className="text-xs text-neutral-400">No POS sales for this date.</p></div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">Sales by Counter</h3>
          <div className="h-56 w-full">
            {terminalChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={terminalChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="name" stroke="#a3a3a3" fontSize={10} tickLine={false} />
                  <YAxis stroke="#a3a3a3" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <ChartTooltip formatter={(val: unknown) => [formatCurrency(val as number), 'Revenue']} contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }} />
                  <Bar dataKey="revenue" fill="#0369a1" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center"><p className="text-xs text-neutral-400">No POS sales for this date.</p></div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">Sales by Cashier</h3>
          <div className="h-56 w-full">
            {cashierChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashierChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="name" stroke="#a3a3a3" fontSize={10} tickLine={false} />
                  <YAxis stroke="#a3a3a3" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <ChartTooltip formatter={(val: unknown) => [formatCurrency(val as number), 'Revenue']} contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }} />
                  <Bar dataKey="revenue" fill="#0284c7" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center"><p className="text-xs text-neutral-400">No POS sales for this date.</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Shifts */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-neutral-900 mb-4">Recent Shifts</h3>
        {shiftsList && shiftsList.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                  <th className="py-2">Cashier</th>
                  <th className="py-2">Terminal</th>
                  <th className="py-2">Opened</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Opening Cash</th>
                  <th className="py-2">Variance</th>
                  <th className="py-2 text-right">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700">
                {shiftsList.data.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 font-semibold text-neutral-900">{s.cashier ? `${s.cashier.firstName} ${s.cashier.lastName || ''}` : '—'}</td>
                    <td className="py-2.5">{s.terminalId}</td>
                    <td className="py-2.5 text-neutral-450">{new Date(s.openedAt).toLocaleString('en-IN')}</td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5">{formatCurrency(Number(s.openingCash))}</td>
                    <td className="py-2.5">
                      {s.variance != null ? (
                        <span className={Math.abs(Number(s.variance)) < 1 ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                          {formatCurrency(Number(s.variance))}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => setViewingShiftId(s.id)}
                        className="text-[11px] font-bold text-neutral-950 hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-xs text-neutral-450">No shifts recorded yet.</p>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {viewingShiftId && reportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setViewingShiftId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900">
                {reportData.reportType === 'X_REPORT' ? 'X-Report (Mid-Shift)' : 'Z-Report (Final)'}
              </h3>
              <button onClick={() => setViewingShiftId(null)} className="text-neutral-400 hover:text-neutral-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-neutral-600 space-y-1">
              <p>Terminal: <span className="font-semibold text-neutral-900">{reportData.shift.terminalId}</span></p>
              <p>Cashier: <span className="font-semibold text-neutral-900">{reportData.shift.cashier ? `${reportData.shift.cashier.firstName} ${reportData.shift.cashier.lastName || ''}` : '—'}</span></p>
              <p>Window: {new Date(reportData.windowStart).toLocaleString('en-IN')} — {new Date(reportData.windowEnd).toLocaleString('en-IN')}</p>
            </div>
            <div className="border-t border-neutral-100 pt-3 space-y-1.5">
              {reportData.byMethod.map((m) => (
                <div key={m.method} className="flex justify-between text-xs">
                  <span className="text-neutral-600">{m.method} ({m.count})</span>
                  <span className="font-semibold text-neutral-900">{formatCurrency(m.revenue)}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs pt-2 border-t border-neutral-100 font-bold">
                <span>Total Orders</span>
                <span>{reportData.orderCount}</span>
              </div>
              <div className="flex justify-between text-xs text-red-600">
                <span>Refunds</span>
                <span>{reportData.refundsCount} ({formatCurrency(reportData.refundsAmount)})</span>
              </div>
            </div>
            {reportData.shift.status === 'CLOSED' && (
              <div className="border-t border-neutral-100 pt-3 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-neutral-600">Opening Cash</span><span className="font-semibold">{formatCurrency(Number(reportData.shift.openingCash))}</span></div>
                <div className="flex justify-between"><span className="text-neutral-600">Expected Cash</span><span className="font-semibold">{formatCurrency(Number(reportData.shift.closingCashExpected || 0))}</span></div>
                <div className="flex justify-between"><span className="text-neutral-600">Counted Cash</span><span className="font-semibold">{formatCurrency(Number(reportData.shift.closingCashCounted || 0))}</span></div>
                <div className="flex justify-between font-bold">
                  <span>Variance</span>
                  <span className={Math.abs(Number(reportData.shift.variance || 0)) < 1 ? 'text-emerald-700' : 'text-amber-700'}>
                    {formatCurrency(Number(reportData.shift.variance || 0))}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={handlePrintReport}
              className="w-full flex items-center justify-center gap-2 bg-[var(--brand-primary)] text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-[var(--brand-primary-dark)]"
            >
              <Printer className="w-3.5 h-3.5" /> Print Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
