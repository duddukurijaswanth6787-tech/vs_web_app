'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Bot,
  ShieldCheck,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Layers,
  Save,
  MessageSquare,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/toast/ToastProvider';
import { getApiErrorMessage } from '@/utils/api-error';

interface TelegramConfig {
  botToken: string;
  allowedChatIds: string[];
  enabled: boolean;
  notifyOnOnlineOrder: boolean;
  notifyOnPosSale: boolean;
  notifyOnShiftClose: boolean;
  notifyOnLowStock: boolean;
  templates: Record<string, string>;
}

const TEMPLATE_KEYS = [
  {
    key: 'ONLINE_ORDER',
    label: '🛍️ Online Order Received',
    description: 'Instant alert when a customer buys online via Website',
    variables: [
      '{{orderNumber}}',
      '{{customerName}}',
      '{{customerPhone}}',
      '{{shippingCity}}',
      '{{shippingState}}',
      '{{grandTotal}}',
      '{{paymentMethod}}',
      '{{paymentStatus}}',
      '{{itemsCount}}',
      '{{itemsList}}',
      '{{createdAt}}',
    ],
  },
  {
    key: 'POS_SALE',
    label: '🧾 In-Store POS Sale',
    description: 'Instant alert when a cashier bills on Shopora POS App',
    variables: [
      '{{billNumber}}',
      '{{cashierName}}',
      '{{paymentMethod}}',
      '{{grandTotal}}',
      '{{itemsCount}}',
      '{{itemsList}}',
      '{{createdAt}}',
    ],
  },
  {
    key: 'DAILY_SUMMARY',
    label: '📊 Daily Business Summary',
    description: 'Sent when querying /today or /sales on Telegram',
    variables: [
      '{{reportDate}}',
      '{{totalRevenue}}',
      '{{totalOrders}}',
      '{{itemsSold}}',
      '{{posRevenue}}',
      '{{posOrders}}',
      '{{onlineRevenue}}',
      '{{onlineOrders}}',
      '{{lowStockCount}}',
    ],
  },
  {
    key: 'SHIFT_CLOSE',
    label: '🔒 POS Register Shift Closed',
    description: 'Daily cash drawer reconciliation report at shift close',
    variables: [
      '{{terminalId}}',
      '{{cashierName}}',
      '{{totalSales}}',
      '{{ordersCount}}',
      '{{cashExpected}}',
      '{{cashActual}}',
      '{{discrepancy}}',
      '{{closedAt}}',
    ],
  },
  {
    key: 'LOW_STOCK',
    label: '⚠️ Low Stock Inventory Alert',
    description: 'Alert when variant quantity reaches threshold',
    variables: ['{{productName}}', '{{sku}}', '{{currentStock}}', '{{threshold}}'],
  },
];

export default function TelegramAutomationAdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('ONLINE_ORDER');
  const [newChatId, setNewChatId] = useState('');
  const [formData, setFormData] = useState<TelegramConfig>({
    botToken: '',
    allowedChatIds: [],
    enabled: true,
    notifyOnOnlineOrder: true,
    notifyOnPosSale: true,
    notifyOnShiftClose: true,
    notifyOnLowStock: true,
    templates: {},
  });

  const { data: configData, isLoading } = useQuery({
    queryKey: ['admin', 'telegram', 'settings'],
    queryFn: async () => {
      const res = await apiClient.get('/telegram/settings');
      return (res.data?.data || res.data) as TelegramConfig;
    },
  });

  useEffect(() => {
    if (configData) {
      setFormData(configData);
    }
  }, [configData]);

  const saveMutation = useMutation({
    mutationFn: async (payload: TelegramConfig) => {
      const res = await apiClient.put('/telegram/settings', payload);
      return res.data;
    },
    onSuccess: () => {
      toast('success', 'Saved', 'Telegram configuration and templates updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'telegram', 'settings'] });
    },
    onError: (err) => {
      toast('error', 'Save Failed', getApiErrorMessage(err));
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/telegram/test', {});
      return res.data;
    },
    onSuccess: (data) => {
      toast('success', 'Test Alert Sent', data?.message || 'Check your Telegram app!');
    },
    onError: (err) => {
      toast('error', 'Test Failed', getApiErrorMessage(err));
    },
  });

  const webhookMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/telegram/setup-webhook', {});
      return res.data;
    },
    onSuccess: () => {
      toast('success', 'Webhook Registered', 'Telegram server is now linked to live backend.');
    },
    onError: (err) => {
      toast('error', 'Webhook Failed', getApiErrorMessage(err));
    },
  });

  const handleAddChatId = () => {
    const id = newChatId.trim();
    if (!id || !/^\d+$/.test(id)) {
      toast('warning', 'Invalid ID', 'Enter a valid numerical Telegram Chat ID.');
      return;
    }
    if (formData.allowedChatIds.includes(id)) {
      toast('info', 'Already Added', 'This Chat ID is already authorized.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      allowedChatIds: [...prev.allowedChatIds, id],
    }));
    setNewChatId('');
    toast('success', 'Added', `Chat ID ${id} added to authorized list.`);
  };

  const handleRemoveChatId = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedChatIds: prev.allowedChatIds.filter((item) => item !== id),
    }));
  };

  const handleInsertVariable = (variable: string) => {
    setFormData((prev) => {
      const currentText = prev.templates[activeTab] || '';
      return {
        ...prev,
        templates: {
          ...prev.templates,
          [activeTab]: currentText + ' ' + variable,
        },
      };
    });
  };

  const activeTemplateDef = TEMPLATE_KEYS.find((t) => t.key === activeTab);
  const currentTemplateText = formData.templates?.[activeTab] || '';

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-[#229ED9]" />
            Telegram Automation & Alerts
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Real-time push notifications for Online orders & Shopora POS sales with two-way chat commands.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => webhookMutation.mutate()}
            disabled={webhookMutation.isPending}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${webhookMutation.isPending ? 'animate-spin' : ''}`} />
            Sync Webhook
          </button>
          <button
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
            className="px-3.5 py-2 text-xs font-medium rounded-lg bg-[#229ED9] hover:bg-[#1e8ec5] text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            Send Test Alert
          </button>
          <button
            onClick={() => saveMutation.mutate(formData)}
            disabled={saveMutation.isPending}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-neutral-500">Loading Telegram Settings...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Connection & Access Control */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-neutral-900">
                  <Bot className="w-5 h-5 text-[#229ED9]" />
                  Bot Status
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, enabled: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#229ED9]"></div>
                </label>
              </div>

              <div className="text-xs space-y-2 bg-neutral-50 rounded-lg p-3 border border-neutral-100">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Bot Username:</span>
                  <a
                    href="https://t.me/Vasanthi_Signature_bot"
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[#229ED9] hover:underline flex items-center gap-1"
                  >
                    @Vasanthi_Signature_bot
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Webhook Status:</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Live & Connected
                  </span>
                </div>
              </div>

              {/* Event Notification Toggles */}
              <div className="pt-2 border-t border-neutral-100 space-y-2.5">
                <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Automated Push Alerts
                </h3>
                <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer">
                  <span>🛍️ Online Store Orders</span>
                  <input
                    type="checkbox"
                    checked={formData.notifyOnOnlineOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notifyOnOnlineOrder: e.target.checked,
                      }))
                    }
                    className="rounded text-[#229ED9] focus:ring-[#229ED9]"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer">
                  <span>🧾 In-Store POS Sales</span>
                  <input
                    type="checkbox"
                    checked={formData.notifyOnPosSale}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notifyOnPosSale: e.target.checked,
                      }))
                    }
                    className="rounded text-[#229ED9] focus:ring-[#229ED9]"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer">
                  <span>🔒 Shift Closing & Takings</span>
                  <input
                    type="checkbox"
                    checked={formData.notifyOnShiftClose}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notifyOnShiftClose: e.target.checked,
                      }))
                    }
                    className="rounded text-[#229ED9] focus:ring-[#229ED9]"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer">
                  <span>⚠️ Low Stock Alerts</span>
                  <input
                    type="checkbox"
                    checked={formData.notifyOnLowStock}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notifyOnLowStock: e.target.checked,
                      }))
                    }
                    className="rounded text-[#229ED9] focus:ring-[#229ED9]"
                  />
                </label>
              </div>
            </div>

            {/* Whitelisted Chat IDs Card */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-neutral-900">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Authorized Chat IDs
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                  {formData.allowedChatIds.length} Whitelisted
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Only these verified Telegram IDs will receive alerts and be able to run queries.
              </p>

              {/* Add ID input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 2091440465"
                  value={newChatId}
                  onChange={(e) => setNewChatId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddChatId()}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#229ED9]"
                />
                <button
                  type="button"
                  onClick={handleAddChatId}
                  className="px-3 py-1.5 text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              {/* ID List */}
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                {formData.allowedChatIds.map((id) => (
                  <div
                    key={id}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs font-mono"
                  >
                    <span className="text-neutral-800">
                      {id} {id === '2091440465' && <span className="text-neutral-500 font-sans font-medium">(Jaswanth - Super Admin)</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChatId(id)}
                      className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                      title="Remove authorization"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Message Template Editor */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-5">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#229ED9]" />
                  Customizable Message Templates
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Customize the exact wording, emojis, and variables sent to your Telegram app.
                </p>
              </div>

              {/* Template Category Tabs */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-neutral-100 rounded-lg border border-neutral-200">
                {TEMPLATE_KEYS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeTab === t.key
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Active Template Editor */}
              {activeTemplateDef && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-800">
                        {activeTemplateDef.label}
                      </h3>
                      <p className="text-xs text-neutral-500">
                        {activeTemplateDef.description}
                      </p>
                    </div>
                  </div>

                  {/* Variable Insert Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#229ED9]" />
                      Click to insert dynamic variables:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeTemplateDef.variables.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleInsertVariable(v)}
                          className="px-2 py-1 text-[11px] font-mono bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                        >
                          + {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Template Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700">
                      Message Markdown Template:
                    </label>
                    <textarea
                      rows={12}
                      value={currentTemplateText}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          templates: {
                            ...prev.templates,
                            [activeTab]: e.target.value,
                          },
                        }))
                      }
                      className="w-full p-3 font-mono text-xs text-neutral-900 bg-neutral-50 rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#229ED9]"
                      placeholder="Type your markdown template here..."
                    />
                  </div>

                  {/* Helpful Tip */}
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Markdown formatting:</strong> Use <code>*bold*</code>, <code>_italic_</code>, and <code>`code`</code> for clean styling in Telegram.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
