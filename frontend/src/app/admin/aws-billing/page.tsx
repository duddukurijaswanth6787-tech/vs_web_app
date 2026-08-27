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

  const fetchBillingData = async (isSync = false) => {
    if (isSync) setSyncing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = isSync
        ? await apiClient.post('/aws-billing/sync')
        : await apiClient.get('/aws-billing');

      if (res?.data?.data) {
        setData(res.data.data);
      } else if (res?.data) {
        setData(res.data);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Cloud className="w-7 h-7 text-amber-500" />
            <h1 className="text-2xl font-bold text-gray-900">AWS Billing & Usage</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> S3 Storage Active
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time AWS Cloud infrastructure cost tracking, storage metrics, and budget management.
          </p>
        </div>

        <button
          onClick={() => fetchBillingData(true)}
          disabled={syncing || loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing AWS...' : 'Sync AWS Billing Data'}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-gray-200 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-600">Fetching live AWS Billing metrics...</p>
        </div>
      ) : (
        <>
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Current Spend */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-sm font-medium">Current Month Spend</span>
                <CreditCard className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                ${data?.totalSpend?.toFixed(2) ?? '0.00'}{' '}
                <span className="text-xs font-normal text-gray-400">USD</span>
              </div>
              <p className="text-xs text-gray-500">
                Period: {data?.period?.start} to {data?.period?.end}
              </p>
            </div>

            {/* Card 2: Forecasted Spend */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-sm font-medium">Forecasted End-of-Month</span>
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                ${data?.forecastedSpend?.toFixed(2) ?? '0.00'}{' '}
                <span className="text-xs font-normal text-gray-400">USD</span>
              </div>
              <p className="text-xs text-emerald-600 font-medium">
                Within free-tier / expected usage limits
              </p>
            </div>

            {/* Card 3: Storage & Region */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-sm font-medium">AWS S3 Media Bucket</span>
                <Database className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-lg font-bold text-gray-900 truncate">
                {data?.accountInfo?.bucket || 'vasanthi-signature-images'}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-700">
                  Region: {data?.accountInfo?.region || 'ap-south-2'}
                </span>
                <span className="text-emerald-600 font-medium">Primary Media Host</span>
              </div>
            </div>
          </div>

          {/* Activation Notice if Cost Explorer needs enabling */}
          {data?.status === 'activation_required' && data?.activationInstructions && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3 text-sm text-amber-900">
              <div className="flex items-center gap-2 font-semibold text-amber-900">
                <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span>AWS Cost Explorer 1-Click Activation Notice</span>
              </div>
              <p className="text-xs text-amber-800">
                Your AWS S3 storage and EC2 servers are fully active. To enable exact cent-by-cent AWS cost tracking in this dashboard, activate Cost Explorer in your AWS console:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-amber-900 font-mono bg-white/70 p-3 rounded-lg border border-amber-200">
                {data.activationInstructions.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
              <div className="pt-1">
                <a
                  href="https://console.aws.amazon.com/billing/home#/costexplorer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 underline hover:text-amber-950"
                >
                  Open AWS Billing & Cost Explorer Console <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Services Cost Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900">AWS Services Usage & Cost Breakdown</h3>
                <p className="text-xs text-gray-500">
                  Breakdown of AWS hosting, image storage, and network transfer costs.
                </p>
              </div>
              {data?.lastSyncedAt && (
                <span className="text-xs text-gray-400 font-mono">
                  Synced: {new Date(data.lastSyncedAt).toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="divide-y divide-gray-100">
              {data?.serviceBreakdown && data.serviceBreakdown.length > 0 ? (
                data.serviceBreakdown.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                        {item.serviceName.includes('S3') ? (
                          <Database className="w-5 h-5" />
                        ) : item.serviceName.includes('EC2') ? (
                          <Server className="w-5 h-5" />
                        ) : (
                          <Cloud className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.serviceName}</p>
                        <p className="text-xs text-gray-400">AWS Cloud Resource</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        ${item.amount.toFixed(2)}{' '}
                        <span className="text-xs font-normal text-gray-500">{item.currency}</span>
                      </p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <CheckCircle2 className="w-3 h-3" /> Configured
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-gray-500">
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
