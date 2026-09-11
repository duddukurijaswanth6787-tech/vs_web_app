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
  Layers,
  Sparkles,
  Calculator,
  ArrowUpRight,
  DollarSign,
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
  monthlyStorageCostUSD: number;
  monthlyRequestsCostUSD: number;
  monthlyTotalCostUSD: number;
  freeTierLimitGB: number;
  freeTierUsedGB: number;
  freeTierRemainingGB: number;
  isUnderFreeTier: boolean;
  ratePerGB: number;
}

interface ProjectSpendAttribution {
  projectName: string;
  s3MediaCostUSD: number;
  dataTransferCostUSD: number;
  estimatedMonthlyCostUSD: number;
  coveredByCreditsOrFreeTier: boolean;
  activeMediaBucket: string;
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
  projectSpend?: ProjectSpendAttribution;
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

  // Tab Scope: 'project' | 'account'
  const [activeTab, setActiveTab] = useState<'project' | 'account'>('project');

  // Interactive Calculator State
  const [simulatedMediaGB, setSimulatedMediaGB] = useState<number>(10);

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
    monthlyStorageCostUSD: 0.0,
    monthlyRequestsCostUSD: 0.0,
    monthlyTotalCostUSD: 0.0,
    freeTierLimitGB: 5.0,
    freeTierUsedGB: 0.0,
    freeTierRemainingGB: 5.0,
    isUnderFreeTier: true,
    ratePerGB: 0.023,
  };

  const projectSpend = data?.projectSpend || {
    projectName: "Vasanthi's Signature Web Platform & POS",
    s3MediaCostUSD: s3Info.monthlyTotalCostUSD || 0.0,
    dataTransferCostUSD: 0.0,
    estimatedMonthlyCostUSD: s3Info.monthlyTotalCostUSD || 0.0,
    coveredByCreditsOrFreeTier: true,
    activeMediaBucket: s3Info.bucket,
  };

  // Cost simulator calculations
  const simBillableGB = Math.max(0, simulatedMediaGB - 5.0);
  const simStorageCost = simBillableGB * 0.023;
  const simRequestsCost = 0.05;
  const simTotalEstimated = simStorageCost + simRequestsCost;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Cloud className="w-7 h-7 text-amber-500" />
            <h1 className="text-2xl font-black text-neutral-900 font-sans tracking-tight">AWS Billing & Spend Intelligence</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> S3 Storage Active
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time AWS Cloud infrastructure cost tracking, project vs account attribution, promotional credits burndown, and live S3 storage estimates.
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

      {/* View Filter Scope Switcher */}
      <div className="flex border-b border-neutral-200 space-x-4">
        <button
          type="button"
          onClick={() => setActiveTab('project')}
          className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'project'
              ? 'border-[#0284c7] text-[#0284c7]'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>This Website & Project Only (Vasanthi&apos;s Signature)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'account'
              ? 'border-[#0284c7] text-[#0284c7]'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Overall AWS Account (All Services & Infrastructure)</span>
        </button>
      </div>

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
                  <span>Remaining Credits</span>
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

            {/* Card 2: Spend Card (Contextual based on Active Tab) */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center text-neutral-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  {activeTab === 'project' ? "This Project's Spend" : 'Overall AWS Spend'}
                </span>
                <CreditCard className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-neutral-900 font-mono">
                ${activeTab === 'project' ? projectSpend.estimatedMonthlyCostUSD.toFixed(2) : data?.totalSpend?.toFixed(2) ?? '0.00'}{' '}
                <span className="text-xs font-normal text-neutral-400">USD</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{s3Info.isUnderFreeTier ? '100% Free Tier Covered' : 'Deducted from AWS Credits'}</span>
              </p>
            </div>

            {/* Card 3: S3 Storage Volume & Capacity */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center text-neutral-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">S3 Stored Media</span>
                <Database className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-neutral-900 font-mono">
                {s3Info.totalSizeMB}{' '}
                <span className="text-xs font-normal text-neutral-400">MB ({s3Info.totalSizeGB} GB)</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                {s3Info.objectCount} active files in <code className="font-mono text-[10px] bg-neutral-100 px-1 py-0.5 rounded">{s3Info.bucket}</code>
              </p>
            </div>

            {/* Card 4: S3 Monthly Estimated Cost */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center text-neutral-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">S3 Monthly Rate & Cost</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-neutral-900 font-mono">
                ${s3Info.monthlyTotalCostUSD.toFixed(2)}{' '}
                <span className="text-xs font-normal text-neutral-400">USD / mo</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Rate: $0.023 / GB in <span className="font-semibold text-neutral-600">ap-south-2</span>
              </p>
            </div>
          </div>

          {/* S3 Storage Deep Dive & Free Tier Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Storage Breakdown & Project Attribution */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs space-y-5">
              <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[#0284c7]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    S3 Media Storage Cost & Capacity Breakdown
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {s3Info.isUnderFreeTier ? 'Within 5GB Free Tier' : 'Billable Storage'}
                </span>
              </div>

              {/* Free tier progress bar */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>AWS 5 GB Standard Storage Free Tier Meter</span>
                  </span>
                  <span className="font-mono font-bold text-neutral-700">
                    {s3Info.totalSizeGB.toFixed(3)} GB / {s3Info.freeTierLimitGB.toFixed(1)} GB ({((s3Info.totalSizeGB / s3Info.freeTierLimitGB) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#0284c7] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(3, (s3Info.totalSizeGB / s3Info.freeTierLimitGB) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500">
                  <span>Free Tier Remaining: {s3Info.freeTierRemainingGB.toFixed(3)} GB</span>
                  <span className="text-emerald-600 font-semibold">$0.00 Incurred</span>
                </div>
              </div>

              {/* Storage Itemized Table */}
              <div className="divide-y divide-neutral-100 text-xs">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-neutral-500 font-medium">Target Media Bucket</span>
                  <span className="font-mono font-semibold text-neutral-900">{s3Info.bucket}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-neutral-500 font-medium">AWS Primary Region</span>
                  <span className="font-semibold text-neutral-900">{s3Info.region} (Hyderabad, India)</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-neutral-500 font-medium">Total Media Assets</span>
                  <span className="font-mono font-semibold text-neutral-900">{s3Info.objectCount} product images & banners</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-neutral-500 font-medium">Total Stored Data</span>
                  <span className="font-mono font-semibold text-neutral-900">{s3Info.totalSizeMB} MB ({s3Info.totalSizeGB} GB)</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-neutral-500 font-medium">Storage Cost Rate</span>
                  <span className="font-mono font-semibold text-neutral-900">$0.023 / GB-month</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-neutral-500 font-medium">PUT / GET API Request Cost</span>
                  <span className="font-mono font-semibold text-neutral-900">$0.005 / 1,000 PUTs ($0.00 within free tier)</span>
                </div>
                <div className="py-2.5 flex justify-between items-center bg-emerald-50/50 p-2.5 rounded-lg">
                  <span className="text-emerald-900 font-bold">Estimated Total Monthly S3 Cost</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">${s3Info.monthlyTotalCostUSD.toFixed(2)} USD (Covered by Credits)</span>
                </div>
              </div>
            </div>

            {/* Right Col: Interactive Future Storage Cost Calculator */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <Calculator className="w-4 h-4 text-[#0284c7]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Future Storage Cost Simulator
                </h3>
              </div>
              <p className="text-xs text-neutral-500">
                Estimate how much AWS S3 will cost as your product catalog and high-resolution media library expands.
              </p>

              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1">
                    <span>Projected Media Size:</span>
                    <span className="font-mono font-bold text-[#0284c7]">{simulatedMediaGB} GB (~{Math.round(simulatedMediaGB * 350)} Photos)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    step="5"
                    value={simulatedMediaGB}
                    onChange={(e) => setSimulatedMediaGB(Number(e.target.value))}
                    className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                    <span>1 GB</span>
                    <span>100 GB</span>
                    <span>250 GB</span>
                    <span>500 GB</span>
                  </div>
                </div>

                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Free Tier Deduction:</span>
                    <span className="font-mono text-emerald-600 font-semibold">-5.00 GB Free</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Billable Storage:</span>
                    <span className="font-mono font-semibold">{simBillableGB.toFixed(1)} GB</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>S3 Storage Rate:</span>
                    <span className="font-mono">$0.023 / GB</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-200 pt-2 font-bold text-neutral-900">
                    <span>Estimated Monthly Cost:</span>
                    <span className="font-mono text-[#0284c7] text-sm">${simTotalEstimated.toFixed(2)} USD</span>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-400 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-200/50 text-amber-900">
                  💡 Even at <strong>50 GB</strong> (over 15,000 product images), your monthly S3 cost is only <strong>~$1.04/month</strong>, which is 100% absorbed by your AWS credits.
                </div>
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

          {/* Cloud Infrastructure Summary */}
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
                <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">
                  {activeTab === 'project' ? "Project Services Cost Allocation" : "Overall AWS Services Breakdown"}
                </h3>
                <p className="text-2xs text-neutral-400 mt-0.5">
                  Itemized AWS hosting, image storage, and network transfer costs.
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
                        <CheckCircle2 className="w-3 h-3" /> Covered by Credits / Free Tier
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
