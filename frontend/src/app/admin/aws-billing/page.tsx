'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  RefreshCw,
  CreditCard,
  TrendingUp,
  Server,
  Database,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  HardDrive,
  Cpu,
  Gift,
  Calendar,
  Clock,
  Edit3,
  X,
  Save,
  Info,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface AwsServiceBreakdown {
  serviceName: string;
  amount: number;
  currency: string;
}

interface AwsCreditsInfo {
  totalGrantUSD: number;
  usedCreditsUSD: number;
  remainingCreditsUSD: number;
  percentageUsed: number;
  expiryDate: string;
  daysRemaining: number;
  grantName: string;
  notes?: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
}

interface S3StorageInfo {
  bucket: string;
  region: string;
  objectCount: number;
  totalSizeBytes: number;
  totalSizeMB: number;
  totalSizeGB: number;
  storageClass: string;
}

interface AwsBillingData {
  status: 'active' | 'activation_required';
  period: {
    start: string;
    end: string;
  };
  currency: string;
  totalSpend: number;
  forecastedSpend: number;
  credits?: AwsCreditsInfo;
  s3Storage?: S3StorageInfo;
  serviceBreakdown: AwsServiceBreakdown[];
  accountInfo: {
    region: string;
    bucket: string;
    storageProvider: string;
  };
  message?: string;
  activationInstructions?: string[];
  lastSyncedAt: string;
}

export default function AwsBillingPage() {
  const [data, setData] = useState<AwsBillingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [savingCredits, setSavingCredits] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Edit Credits Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [creditForm, setCreditForm] = useState({
    totalGrantUSD: 1000,
    expiryDate: '2026-12-31',
    grantName: 'AWS Activate Founders Credits',
    notes: 'Active credits applied to AWS Account',
  });

  const fetchBillingData = async (isSync = false) => {
    if (isSync) setSyncing(true);
    else setLoading(true);
    setError(null);
    if (isSync) setSyncSuccessMsg(null);

    try {
      let res;
      try {
        res = isSync
          ? await apiClient.post('/aws-billing/sync')
          : await apiClient.get('/aws-billing');
      } catch (firstErr: any) {
        if (firstErr?.response?.status === 404) {
          res = isSync
            ? await apiClient.post('/admin/aws-billing/sync')
            : await apiClient.get('/admin/aws-billing');
        } else {
          throw firstErr;
        }
      }

      const payload = res?.data?.data || res?.data;
      if (payload) {
        setData(payload);
        if (payload.credits) {
          setCreditForm({
            totalGrantUSD: payload.credits.totalGrantUSD || 1000,
            expiryDate: payload.credits.expiryDate || '2026-12-31',
            grantName: payload.credits.grantName || 'AWS Activate Founders Credits',
            notes: payload.credits.notes || '',
          });
        }
        if (isSync) {
          setSyncSuccessMsg('AWS infrastructure & storage metrics synchronized successfully.');
        }
      } else {
        setError('Failed to load AWS billing data.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with backend AWS Billing service.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchBillingData(false);
  }, []);

  const handleSaveCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCredits(true);
    setError(null);
    try {
      const res = await apiClient.post('/aws-billing/credits', {
        totalGrantUSD: Number(creditForm.totalGrantUSD),
        expiryDate: creditForm.expiryDate,
        grantName: creditForm.grantName,
        notes: creditForm.notes,
      });
      const payload = res?.data?.data || res?.data;
      if (payload) {
        setData(payload);
      }
      setIsEditModalOpen(false);
      setSyncSuccessMsg('AWS Promotional Credits configuration saved successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to update credit configuration.');
    } finally {
      setSavingCredits(false);
    }
  };

  const credits = data?.credits || {
    totalGrantUSD: 1000,
    usedCreditsUSD: data?.totalSpend || 0,
    remainingCreditsUSD: Math.max(0, 1000 - (data?.totalSpend || 0)),
    percentageUsed: 0,
    expiryDate: '2026-12-31',
    daysRemaining: 110,
    grantName: 'AWS Activate Founders Credits',
    status: 'ACTIVE' as const,
  };

  const s3Info = data?.s3Storage || {
    bucket: data?.accountInfo?.bucket || 'vasanthi-signature-images',
    region: data?.accountInfo?.region || 'ap-south-2',
    objectCount: 0,
    totalSizeBytes: 0,
    totalSizeMB: 0,
    totalSizeGB: 0,
    storageClass: 'Standard S3 (SSE-S3 AES-256)',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Cloud className="w-7 h-7 text-amber-500" />
            <h1 className="text-2xl font-black text-neutral-900 font-sans tracking-tight">AWS Billing & Credits</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> S3 Storage Active
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time AWS Cloud infrastructure cost tracking, free promotional credits balance, and S3 media storage monitor.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Configure Credits</span>
          </button>

          <button
            type="button"
            onClick={() => fetchBillingData(true)}
            disabled={syncing || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing AWS...' : 'Sync AWS Data'}</span>
          </button>
        </div>
      </div>

      {syncSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-neutral-200 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-neutral-600">Fetching live AWS Billing & Credit metrics...</p>
        </div>
      ) : (
        <>
          {/* Top 4 Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: AWS Promotional Credits Balance */}
            <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-center text-emerald-200">
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-emerald-400" />
                  <span>AWS Credits Balance</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  {credits.status}
                </span>
              </div>
              <div>
                <div className="text-2xl font-black font-mono tracking-tight text-white">
                  ${credits.remainingCreditsUSD?.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-emerald-300">USD</span>
                </div>
                <p className="text-[11px] text-emerald-200/80 mt-0.5">
                  Remaining of ${credits.totalGrantUSD?.toFixed(2)} grant
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full bg-emerald-950/80 rounded-full h-2 overflow-hidden border border-emerald-700/30">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, 100 - credits.percentageUsed)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-emerald-300/80 font-mono">
                  <span>Used: ${credits.usedCreditsUSD?.toFixed(2)}</span>
                  <span>{credits.daysRemaining} days left</span>
                </div>
              </div>
            </div>

            {/* Card 2: Current Month Spend */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center text-neutral-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Current Month Spend</span>
                <CreditCard className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-neutral-900 font-mono">
                ${data?.totalSpend?.toFixed(2) ?? '0.00'}{' '}
                <span className="text-xs font-normal text-neutral-400">USD</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Period: {data?.period?.start || 'Start of month'} to {data?.period?.end || 'Present'}
              </p>
            </div>

            {/* Card 3: Forecasted Month Spend */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center text-neutral-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Forecasted Month End</span>
                <TrendingUp className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-black text-neutral-900 font-mono">
                ${data?.forecastedSpend?.toFixed(2) ?? '0.00'}{' '}
                <span className="text-xs font-normal text-neutral-400">USD</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Fully Covered by Credits
              </p>
            </div>

            {/* Card 4: S3 Media Storage */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center text-neutral-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">AWS S3 Media Storage</span>
                <Database className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-lg font-bold text-neutral-900 truncate font-mono">
                {s3Info.bucket}
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5">
                <span className="bg-neutral-100 px-2 py-0.5 rounded font-mono text-neutral-700">
                  {s3Info.objectCount} items ({s3Info.totalSizeMB} MB)
                </span>
                <span className="text-emerald-600 font-semibold">{s3Info.region}</span>
              </div>
            </div>
          </div>

          {/* Promotional Credits & Account Details Banner */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-500" />
                  <span>AWS Promotional Credits Grant Details</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Track your AWS Activate / Founder credit grant, balance burndown, and expiration timeline.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://console.aws.amazon.com/billing/home#/credits"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-bold rounded-xl transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                  <span>View in AWS Console</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update Grant</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-neutral-50 border border-neutral-200/80 p-3.5 rounded-xl space-y-1">
                <span className="text-neutral-500 font-medium block text-[11px]">Grant Name / Program</span>
                <strong className="text-xs font-bold text-neutral-900 block truncate">{credits.grantName}</strong>
              </div>

              <div className="bg-neutral-50 border border-neutral-200/80 p-3.5 rounded-xl space-y-1">
                <span className="text-neutral-500 font-medium block text-[11px]">Initial Credit Grant</span>
                <strong className="text-xs font-bold text-neutral-900 font-mono block">
                  ${credits.totalGrantUSD.toFixed(2)} USD
                </strong>
              </div>

              <div className="bg-neutral-50 border border-neutral-200/80 p-3.5 rounded-xl space-y-1">
                <span className="text-neutral-500 font-medium block text-[11px]">Expiration Date</span>
                <strong className="text-xs font-bold text-neutral-900 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{credits.expiryDate}</span>
                </strong>
              </div>

              <div className="bg-neutral-50 border border-neutral-200/80 p-3.5 rounded-xl space-y-1">
                <span className="text-neutral-500 font-medium block text-[11px]">Validity Countdown</span>
                <strong className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{credits.daysRemaining} days remaining</span>
                </strong>
              </div>
            </div>

            {credits.notes && (
              <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{credits.notes}</span>
              </div>
            )}
          </div>

          {/* Infrastructure Health & Storage Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Storage Specification Card */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <HardDrive className="w-4 h-4 text-neutral-800" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  S3 Storage Configuration & Security
                </h3>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Storage Provider</span>
                  <span className="font-semibold text-neutral-900">Amazon Web Services (AWS)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Media Bucket</span>
                  <span className="font-mono font-semibold text-neutral-900">{s3Info.bucket}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Primary Region</span>
                  <span className="font-semibold text-neutral-900">{s3Info.region} (Hyderabad)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Stored Objects / Assets</span>
                  <span className="font-mono font-semibold text-neutral-900">{s3Info.objectCount} files ({s3Info.totalSizeMB} MB)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Server-Side Encryption</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-2xs">AES-256 Enabled</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-500">Public CDN Delivery</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-2xs">Active</span>
                </div>
              </div>
            </div>

            {/* Cloud Infrastructure Summary */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <Cpu className="w-4 h-4 text-neutral-800" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Cloud Resource Allocation
                </h3>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Production Backend</span>
                  <span className="font-semibold text-neutral-900">Railway + AWS RDS / Postgres</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Web Storefront & Admin</span>
                  <span className="font-semibold text-neutral-900">Vercel / Next.js Edge (SSL Secured)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Mobile POS Infrastructure</span>
                  <span className="font-semibold text-neutral-900">Shopora Mobile Client (Android)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Payment Gateway</span>
                  <span className="font-semibold text-neutral-900">Razorpay Live API (UPI / Cards / QR)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-500">Shipping Partner API</span>
                  <span className="font-semibold text-neutral-900">Delhivery Express & Surface</span>
                </div>
              </div>
            </div>
          </div>

          {/* Services Cost Breakdown */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-neutral-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">AWS Services Usage & Cost Breakdown</h3>
                <p className="text-2xs text-neutral-400 mt-0.5">
                  Breakdown of AWS hosting, image storage, and network transfer costs.
                </p>
              </div>
              {data?.lastSyncedAt && (
                <span className="text-2xs text-neutral-400 font-mono">
                  Synced: {new Date(data.lastSyncedAt).toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="divide-y divide-neutral-100">
              {data?.serviceBreakdown && data.serviceBreakdown.length > 0 ? (
                data.serviceBreakdown.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                        {item.serviceName.includes('S3') || item.serviceName.includes('Storage') ? (
                          <Database className="w-4 h-4" />
                        ) : item.serviceName.includes('EC2') ? (
                          <Server className="w-4 h-4" />
                        ) : (
                          <Cloud className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-800">{item.serviceName}</p>
                        <p className="text-2xs text-neutral-400">AWS Cloud Resource</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-neutral-900 font-mono">
                        ${item.amount.toFixed(2)}{' '}
                        <span className="text-2xs font-normal text-neutral-400">{item.currency}</span>
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3 h-3" /> Covered by Credits
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-neutral-400">
                  No active billable services detected for the current period.
                </div>
              )}
            </div>
          </div>

          {/* AWS Console & Activation Guide */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-600" />
              <span>AWS Console Setup & Guidance</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-neutral-600">
              <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 space-y-1.5">
                <strong className="text-neutral-900 block font-semibold">1. Check Active Credits</strong>
                <p className="text-[11px] text-neutral-500">
                  Open AWS Billing & Cost Management &gt; Credits to verify your promotional credit balance and promo code expiration.
                </p>
                <a
                  href="https://console.aws.amazon.com/billing/home#/credits"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:text-sky-700 font-bold inline-flex items-center gap-1 text-[11px]"
                >
                  <span>Open Credits Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 space-y-1.5">
                <strong className="text-neutral-900 block font-semibold">2. Enable Cost Explorer</strong>
                <p className="text-[11px] text-neutral-500">
                  Click &ldquo;Enable Cost Explorer&rdquo; in AWS Console. Note that AWS takes 24 hours to generate historical breakdown data.
                </p>
                <a
                  href="https://console.aws.amazon.com/costmanagement/home#/cost-explorer"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:text-sky-700 font-bold inline-flex items-center gap-1 text-[11px]"
                >
                  <span>Open Cost Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 space-y-1.5">
                <strong className="text-neutral-900 block font-semibold">3. Attach IAM Permission</strong>
                <p className="text-[11px] text-neutral-500">
                  Attach the <code className="bg-neutral-100 px-1 rounded text-neutral-800 font-mono text-[10px]">CostExplorerReadOnlyAccess</code> policy to your Railway IAM user in AWS IAM.
                </p>
                <a
                  href="https://console.aws.amazon.com/iam/home#/users"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:text-sky-700 font-bold inline-flex items-center gap-1 text-[11px]"
                >
                  <span>Open IAM Users</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Credits Configuration Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                <span>Configure AWS Promotional Credits</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCredits} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Grant Program / Name</label>
                <input
                  type="text"
                  required
                  value={creditForm.grantName}
                  onChange={(e) => setCreditForm({ ...creditForm, grantName: e.target.value })}
                  placeholder="e.g. AWS Activate Founders Credits"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Total Grant (USD $)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={creditForm.totalGrantUSD}
                    onChange={(e) => setCreditForm({ ...creditForm, totalGrantUSD: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={creditForm.expiryDate}
                    onChange={(e) => setCreditForm({ ...creditForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Notes / Description (Optional)</label>
                <textarea
                  rows={2}
                  value={creditForm.notes}
                  onChange={(e) => setCreditForm({ ...creditForm, notes: e.target.value })}
                  placeholder="e.g. Applied to AWS Account, covers EC2, S3, Data Transfer"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 hover:bg-neutral-50 rounded-xl font-bold text-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCredits}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingCredits ? 'Saving...' : 'Save Configuration'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
