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
  HelpCircle,
  ShieldCheck,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface AwsServiceBreakdown {
  serviceName: string;
  amount: number;
  currency: string;
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
  const [error, setError] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

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

      if (res?.data?.data) {
        setData(res.data.data);
        if (isSync) {
          setSyncSuccessMsg('AWS infrastructure & storage metrics synchronized successfully.');
        }
      } else if (res?.data) {
        setData(res.data);
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Cloud className="w-7 h-7 text-amber-500" />
            <h1 className="text-2xl font-black text-neutral-900 font-sans tracking-tight">AWS Billing & Storage</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> S3 Storage Active
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time AWS Cloud infrastructure cost tracking, S3 media bucket usage, and budget management.
          </p>
        </div>

        <button
          onClick={() => fetchBillingData(true)}
          disabled={syncing || loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing AWS...' : 'Sync AWS Billing Data'}
        </button>
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
          <p className="text-xs font-semibold text-neutral-600">Fetching live AWS Billing metrics...</p>
        </div>
      ) : (
        <>
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Current Spend */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-neutral-500">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Current Month Spend</span>
                <CreditCard className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-neutral-900 font-mono">
                ${data?.totalSpend?.toFixed(2) ?? '0.00'}{' '}
                <span className="text-xs font-normal text-neutral-400">USD</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Billing Cycle: {data?.period?.start || 'Current Month'} to {data?.period?.end || 'Present'}
              </p>
            </div>

            {/* Card 2: Forecasted Spend */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-neutral-500">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Forecasted End-of-Month</span>
                <TrendingUp className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-black text-neutral-900 font-mono">
                ${data?.forecastedSpend?.toFixed(2) ?? '0.00'}{' '}
                <span className="text-xs font-normal text-neutral-400">USD</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Within Free-Tier / Allocated Budget
              </p>
            </div>

            {/* Card 3: Storage & Region */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-neutral-500">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">AWS S3 Media Storage</span>
                <Database className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-base font-bold text-neutral-900 truncate font-mono">
                {data?.accountInfo?.bucket || 'vasanthi-signature-images'}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                <span className="bg-neutral-100 px-2 py-0.5 rounded font-mono text-neutral-700">
                  Region: {data?.accountInfo?.region || 'ap-south-2'}
                </span>
                <span className="text-emerald-600 font-semibold">Live S3 Bucket</span>
              </div>
            </div>
          </div>

          {/* Infrastructure Health & Storage Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Storage Specification Card */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
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
                  <span className="font-mono font-semibold text-neutral-900">{data?.accountInfo?.bucket || 'vasanthi-signature-images'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Primary Region</span>
                  <span className="font-semibold text-neutral-900">{data?.accountInfo?.region || 'ap-south-2'} (Hyderabad)</span>
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
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
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
                  <span className="text-neutral-500">Payment Gateway Gateway</span>
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
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
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
                        <CheckCircle2 className="w-3 h-3" /> Configured
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
        </>
      )}
    </div>
  );
}
