'use client';

import React, { useState } from 'react';
import {
  useShippingMethods,
  useShippingZones,
  useCreateShippingMethod,
  useCreateShippingZone,
} from '@/features/shipping/shipping.hooks';
import {
  useSettings,
  useCreateSetting,
  useUpdateSetting,
} from '@/features/settings/settings.hooks';
import { RateType, ShippingCalculationResponse } from '@/features/shipping/shipping.types';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { Plus, Calculator, HelpCircle, Truck, CheckCircle2, ShieldCheck, DollarSign, Sparkles, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatMoney } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import { categorizeApiError } from '@/lib/api-error-handler';
import { apiClient } from '@/lib/api/client';
import { getApiErrorMessage } from '@/utils/api-error';
import { useToast } from '@/components/toast/ToastProvider';

// Schemas for forms
const methodSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(50),
  code: z.string().min(2, 'Code is too short').max(20).regex(/^[A-Z0-9_-]+$/, 'Caps, numbers, dash/underscore only'),
  description: z.string().max(200).optional(),
  estimatedDays: z.string().min(1, 'Estimated days is required'),
});

const zoneSchema = z.object({
  methodId: z.string().uuid('Please select a shipping method'),
  name: z.string().min(2, 'Zone name is too short').max(100),
  countries: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
  states: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
  pincodes: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
  rateType: z.enum([RateType.FLAT, RateType.WEIGHT, RateType.PRICE]),
  rate: z.number().min(0, 'Rate cannot be negative'),
  freeAbove: z.number().min(0).optional(),
  maxWeight: z.number().min(0).optional(),
});

type ZoneFormInput = z.input<typeof zoneSchema>;
type ZoneFormOutput = z.output<typeof zoneSchema>;

export default function ShippingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'DELIVERY_SETTINGS' | 'METHODS' | 'ZONES' | 'CALCULATOR'>('DELIVERY_SETTINGS');

  // App Settings for Delivery & Shipping Fee
  const { data: allSettingsData, isLoading: isLoadingSettings, refetch: refetchSettings } = useSettings({ limit: 500 });
  const createSettingMut = useCreateSetting();
  const updateSettingMut = useUpdateSetting();

  const settingsList = allSettingsData?.data || [];
  const shippingFeeEnabledSetting = settingsList.find(s => s.key === 'shipping_fee_enabled' || s.key === 'shipping_enabled');
  const shippingFlatFeeSetting = settingsList.find(s => s.key === 'shipping_flat_fee' || s.key === 'shipping_fee');
  const shippingFreeThresholdEnabledSetting = settingsList.find(s => s.key === 'shipping_free_threshold_enabled' || s.key === 'free_shipping_threshold_enabled');
  const shippingFreeThresholdSetting = settingsList.find(s => s.key === 'shipping_free_threshold' || s.key === 'free_shipping_threshold');

  // Local state for delivery charge rules
  const [shippingFeeEnabled, setShippingFeeEnabled] = useState<boolean>(false);
  const [shippingFlatFee, setShippingFlatFee] = useState<number>(0);
  const [freeThresholdEnabled, setFreeThresholdEnabled] = useState<boolean>(false);
  const [freeThreshold, setFreeThreshold] = useState<number>(999);
  const [isSavingDeliverySettings, setIsSavingDeliverySettings] = useState<boolean>(false);
  const [deliverySaveSuccess, setDeliverySaveSuccess] = useState<string | null>(null);

  // Sync settings when fetched
  const [prevSettingsData, setPrevSettingsData] = useState(allSettingsData);
  if (allSettingsData !== prevSettingsData) {
    setPrevSettingsData(allSettingsData);
    if (shippingFeeEnabledSetting) {
      setShippingFeeEnabled(shippingFeeEnabledSetting.value === 'true');
    }
    if (shippingFlatFeeSetting) {
      setShippingFlatFee(parseFloat(shippingFlatFeeSetting.value) || 0);
    }
    if (shippingFreeThresholdEnabledSetting) {
      setFreeThresholdEnabled(shippingFreeThresholdEnabledSetting.value === 'true');
    }
    if (shippingFreeThresholdSetting) {
      setFreeThreshold(parseFloat(shippingFreeThresholdSetting.value) || 999);
    }
  }

  const saveSingleSetting = async (key: string, value: string, existingSetting?: { id: string }) => {
    if (existingSetting) {
      await updateSettingMut.mutateAsync({ id: existingSetting.id, dto: { value } });
    } else {
      await createSettingMut.mutateAsync({ key, value, group: 'shipping' });
    }
  };

  const handleSaveDeliveryRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDeliverySettings(true);
    setDeliverySaveSuccess(null);
    try {
      await saveSingleSetting('shipping_fee_enabled', String(shippingFeeEnabled), shippingFeeEnabledSetting);
      await saveSingleSetting('shipping_flat_fee', String(shippingFlatFee), shippingFlatFeeSetting);
      await saveSingleSetting('shipping_free_threshold_enabled', String(freeThresholdEnabled), shippingFreeThresholdEnabledSetting);
      await saveSingleSetting('shipping_free_threshold', String(freeThreshold), shippingFreeThresholdSetting);

      await refetchSettings();
      setDeliverySaveSuccess('Store Delivery & Shipping Rules updated and live on Cart & Checkout!');
      toast('success', 'Shipping Updated', 'Delivery charges and rules saved successfully.');
    } catch (err: unknown) {
      toast('error', 'Update Failed', getApiErrorMessage(err, 'Failed to save delivery settings.'));
    } finally {
      setIsSavingDeliverySettings(false);
    }
  };

  // Queries
  const { data: methods, isLoading: isLoadingMethods, isError: isErrorMethods, refetch: refetchMethods } = useShippingMethods();
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const { data: zones, isLoading: isLoadingZones, refetch: refetchZones } = useShippingZones(selectedMethodId || undefined);

  // Mutations
  const createMethodMut = useCreateShippingMethod();
  const createZoneMut = useCreateShippingZone();

  // Method form
  const {
    register: regMethod,
    handleSubmit: handleSubMethod,
    reset: resetMethod,
    formState: { errors: errorsMethod, isSubmitting: isSubmittingMethod },
  } = useForm<z.infer<typeof methodSchema>>({
    resolver: zodResolver(methodSchema),
    defaultValues: { name: '', code: '', description: '', estimatedDays: '3-5 Days' },
  });

  // Zone form
  const {
    register: regZone,
    handleSubmit: handleSubZone,
    reset: resetZone,
    formState: { errors: errorsZone, isSubmitting: isSubmittingZone },
  } = useForm<ZoneFormInput, unknown, ZoneFormOutput>({
    resolver: zodResolver(zoneSchema),
    defaultValues: { methodId: '', name: '', countries: '', states: '', pincodes: '', rateType: RateType.FLAT, rate: 0, freeAbove: 0, maxWeight: 0 },
  });

  // Calculator State
  const [calcCode, setCalcCode] = useState('');
  const [calcCountry, setCalcCountry] = useState('India');
  const [calcState, setCalcState] = useState('');
  const [calcPincode, setCalcPincode] = useState('');
  const [calcWeight, setCalcWeight] = useState(1);
  const [calcAmount, setCalcAmount] = useState(1000);
  const [calcResult, setCalcResult] = useState<ShippingCalculationResponse | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  const onAddMethod = async (values: z.infer<typeof methodSchema>) => {
    try {
      await createMethodMut.mutateAsync(values);
      resetMethod();
      refetchMethods();
    } catch (err) {
      console.error(categorizeApiError(err));
    }
  };

  const onAddZone = async (values: ZoneFormOutput) => {
    try {
      await createZoneMut.mutateAsync(values);
      resetZone();
      refetchZones();
    } catch (err) {
      console.error(categorizeApiError(err));
    }
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalcLoading(true);
    setCalcError(null);
    setCalcResult(null);
    try {
      const response = await apiClient.get(`/shipping/methods/${calcCode}/calculate`, {
        params: {
          country: calcCountry,
          state: calcState,
          pincode: calcPincode || undefined,
          weight: calcWeight,
          orderAmount: calcAmount,
        },
      });
      setCalcResult(response.data?.data);
    } catch (err: unknown) {
      console.error(categorizeApiError(err));
      setCalcError(getApiErrorMessage(err, 'Failed to calculate shipping rate'));
    } finally {
      setCalcLoading(false);
    }
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Shipping Operations & Rates</h1>
          <p className="text-xs text-neutral-400 mt-1">Configure live delivery charges, free delivery thresholds, carrier methods, and rate zones.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 gap-1 overflow-x-auto">
        {(
          [
            { id: 'DELIVERY_SETTINGS', label: 'Store Delivery Charges & Rules' },
            { id: 'METHODS', label: 'Carrier Methods' },
            { id: 'ZONES', label: 'Pricing Zones' },
            { id: 'CALCULATOR', label: 'Rate Calculator' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap -mb-px
              ${activeTab === tab.id
                ? 'border-sky-600 text-sky-600 font-extrabold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {/* 1. DELIVERY SETTINGS TAB (Live Storefront Shipping & Threshold Rules) */}
      {activeTab === 'DELIVERY_SETTINGS' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-sky-600" />
                  Store Delivery Charges & Free Shipping Policy
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Manage whether customer orders incur delivery charges, configure flat delivery rates, and define free delivery threshold amounts.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  shippingFeeEnabled
                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${shippingFeeEnabled ? 'bg-sky-600' : 'bg-emerald-500'}`} />
                  {shippingFeeEnabled ? 'Delivery Charges Active' : '100% Free Delivery Everywhere'}
                </span>
              </div>
            </div>

            {deliverySaveSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{deliverySaveSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveDeliveryRules} className="space-y-6">
              {/* Option 1: Enable / Disable Delivery Fee */}
              <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <label htmlFor="shippingFeeEnabledToggle" className="text-sm font-bold text-neutral-900 cursor-pointer">
                      Enable Delivery / Shipping Charges
                    </label>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Toggle whether delivery fees should be charged to customers at checkout. If disabled, all orders automatically receive <strong>Free Shipping (₹0)</strong>.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      id="shippingFeeEnabledToggle"
                      type="checkbox"
                      checked={shippingFeeEnabled}
                      onChange={(e) => setShippingFeeEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600" />
                  </label>
                </div>
              </div>

              {/* Option 2: Flat Rate & Option 3: Threshold rules (only if enabled) */}
              {shippingFeeEnabled && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Fixed Standard Delivery Charge */}
                    <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 bg-white space-y-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-sky-600" />
                        <label className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                          Standard Delivery Charge (₹)
                        </label>
                      </div>
                      <p className="text-xs text-neutral-500">
                        The flat delivery fee applied to orders (e.g., ₹50, ₹70, ₹100).
                      </p>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-neutral-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={shippingFlatFee}
                          onChange={(e) => setShippingFlatFee(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-7 pr-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:border-sky-600"
                          placeholder="50"
                        />
                      </div>
                    </div>

                    {/* Conditional Free Shipping Threshold */}
                    <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 bg-white space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <label htmlFor="freeThresholdEnabledToggle" className="text-xs font-bold text-neutral-900 uppercase tracking-wider cursor-pointer">
                              Free Delivery Above Minimum Amount
                            </label>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">
                            Automatically waive delivery charges when the cart subtotal reaches this minimum.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                          <input
                            id="freeThresholdEnabledToggle"
                            type="checkbox"
                            checked={freeThresholdEnabled}
                            onChange={(e) => setFreeThresholdEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600" />
                        </label>
                      </div>

                      {freeThresholdEnabled && (
                        <div className="pt-2">
                          <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                            Minimum Order Subtotal for Free Delivery (₹)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-neutral-400 font-bold text-xs">₹</span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={freeThreshold}
                              onChange={(e) => setFreeThreshold(Math.max(1, parseFloat(e.target.value) || 0))}
                              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-7 pr-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:border-sky-600"
                              placeholder="999"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Simulation Card */}
                  <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-xl text-xs space-y-1 text-sky-900">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-sky-700" />
                      Live Store Policy Simulation:
                    </p>
                    {freeThresholdEnabled ? (
                      <p className="text-sky-800">
                        • Orders with subtotal <strong>under ₹{freeThreshold}</strong> will have a delivery charge of <strong>₹{shippingFlatFee}</strong>.
                        <br />
                        • Orders with subtotal <strong>₹{freeThreshold} or more</strong> receive <strong>100% Free Delivery</strong>.
                      </p>
                    ) : (
                      <p className="text-sky-800">
                        • A fixed flat delivery charge of <strong>₹{shippingFlatFee}</strong> will be added to all orders regardless of cart amount.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!shippingFeeEnabled && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs space-y-1 text-emerald-900">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Live Store Policy Simulation:
                  </p>
                  <p className="text-emerald-800">
                    • Delivery charges are currently <strong>DISABLED</strong>. All customers enjoy <strong>100% Free Shipping</strong> on every item.
                  </p>
                </div>
              )}

              {isEditor && (
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingDeliverySettings}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isSavingDeliverySettings ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Policy…</span>
                      </>
                    ) : (
                      <span>Save Delivery Policy</span>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Tab content */}
      {activeTab === 'METHODS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Method listing */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
              Shipping Methods Configuration
            </h3>
            {isLoadingMethods ? (
              <SectionLoader message="Loading methods..." />
            ) : isErrorMethods ? (
              <PageError title="Fetch Failure" message="Could not fetch shipping methods." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-400 uppercase tracking-wider text-[9px] font-bold border-b border-neutral-200">
                      <th className="p-3">Name</th>
                      <th className="p-3">Code</th>
                      <th className="p-3">Estimated Delivery</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {methods?.map((m) => (
                      <tr key={m.id} className="hover:bg-neutral-50/50 transition">
                        <td className="p-3 font-bold text-neutral-800">{m.name}</td>
                        <td className="p-3 font-mono font-semibold text-[10px] text-neutral-500">{m.code}</td>
                        <td className="p-3 text-neutral-600 font-semibold">{m.estimatedDays}</td>
                        <td className="p-3 text-neutral-500">{m.description || '-'}</td>
                        <td className="p-3 text-right">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                            ${m.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-100 text-neutral-500'}
                          `}>
                            {m.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add method form (Only if admin editor) */}
          {isEditor && (
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
                New Shipping Method
              </h3>
              <form onSubmit={handleSubMethod(onAddMethod)} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Method Name</label>
                  <input
                    type="text"
                    {...regMethod('name')}
                    placeholder="e.g. Standard Courier Delivery"
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                  {errorsMethod.name && <p className="text-[10px] text-red-650 mt-1">{errorsMethod.name.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Method Code</label>
                  <input
                    type="text"
                    {...regMethod('code')}
                    placeholder="e.g. STANDARD_DELIVERY"
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none font-mono"
                  />
                  {errorsMethod.code && <p className="text-[10px] text-red-650 mt-1">{errorsMethod.code.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Estimated Days</label>
                  <input
                    type="text"
                    {...regMethod('estimatedDays')}
                    placeholder="e.g. 3-5 Business Days"
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                  {errorsMethod.estimatedDays && <p className="text-[10px] text-red-650 mt-1">{errorsMethod.estimatedDays.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Description (Optional)</label>
                  <input
                    type="text"
                    {...regMethod('description')}
                    placeholder="Provide details about carrier..."
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingMethod}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  {isSubmittingMethod ? <ButtonLoader /> : <Plus className="w-4 h-4 mr-1 inline-block" />} Create Method
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ZONES' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Zones listing */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Shipping Zones Config
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 font-semibold">Filter Method:</span>
                <select
                  value={selectedMethodId}
                  onChange={(e) => setSelectedMethodId(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 rounded px-2 py-1 text-2xs focus:outline-none"
                >
                  <option value="">All Methods</option>
                  {methods?.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {isLoadingZones ? (
              <SectionLoader message="Retrieving shipping zones..." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-400 uppercase tracking-wider text-[9px] font-bold border-b border-neutral-200">
                      <th className="p-3">Zone Name</th>
                      <th className="p-3">Countries</th>
                      <th className="p-3">States</th>
                      <th className="p-3">Rate Type</th>
                      <th className="p-3 text-right">Base Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {zones?.map((z) => (
                      <tr key={z.id} className="hover:bg-neutral-50/50 transition">
                        <td className="p-3 font-bold text-neutral-800">{z.name}</td>
                        <td className="p-3 font-medium text-neutral-500 truncate max-w-[120px]">{z.countries.join(', ')}</td>
                        <td className="p-3 font-medium text-neutral-500 truncate max-w-[120px]">{z.states.join(', ')}</td>
                        <td className="p-3 font-semibold text-[10px] text-neutral-500 uppercase">{z.rateType}</td>
                        <td className="p-3 text-right font-mono font-bold text-neutral-900">{formatMoney(z.rate)}</td>
                      </tr>
                    ))}
                    {(!zones || zones.length === 0) && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-neutral-400">
                          No shipping zones created for this method yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add zone form */}
          {isEditor && (
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
                New Shipping Zone
              </h3>
              <form onSubmit={handleSubZone(onAddZone)} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Carrier Method</label>
                  <select
                    {...regZone('methodId')}
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="">-- Choose Method --</option>
                    {methods?.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  {errorsZone.methodId && <p className="text-[10px] text-red-650 mt-1">{errorsZone.methodId.message as string}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Zone Name</label>
                  <input
                    type="text"
                    {...regZone('name')}
                    placeholder="e.g. South India Flat Zone"
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                  {errorsZone.name && <p className="text-[10px] text-red-650 mt-1">{errorsZone.name.message as string}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Countries (Comma Separated)</label>
                  <input
                    type="text"
                    {...regZone('countries')}
                    placeholder="e.g. India, Sri Lanka"
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">States (Comma Separated)</label>
                  <input
                    type="text"
                    {...regZone('states')}
                    placeholder="e.g. Maharashtra, Karnataka"
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Pincodes (Comma Separated)</label>
                  <input
                    type="text"
                    {...regZone('pincodes')}
                    placeholder="e.g. 400001, 560001"
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Rate Type</label>
                    <select
                      {...regZone('rateType')}
                      className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 focus:outline-none"
                    >
                      <option value={RateType.FLAT}>FLAT RATE</option>
                      <option value={RateType.WEIGHT}>WEIGHT BASE</option>
                      <option value={RateType.PRICE}>PRICE BASE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Rate Cost (₹)</label>
                    <input
                      type="number"
                      step="any"
                      {...regZone('rate', { valueAsNumber: true })}
                      className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingZone}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  {isSubmittingZone ? <ButtonLoader /> : <Plus className="w-4 h-4 mr-1 inline-block" />} Create Zone
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'CALCULATOR' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rate sandbox form */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-neutral-400" /> Rate Calculation Sandbox
            </h3>
            <form onSubmit={handleCalculate} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Shipping Method Code</label>
                <select
                  value={calcCode}
                  onChange={(e) => setCalcCode(e.target.value)}
                  required
                  className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none font-mono"
                >
                  <option value="">-- Select Code --</option>
                  {methods?.map(m => (
                    <option key={m.id} value={m.code}>{m.code}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Country</label>
                  <input
                    type="text"
                    value={calcCountry}
                    onChange={(e) => setCalcCountry(e.target.value)}
                    required
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">State</label>
                  <input
                    type="text"
                    value={calcState}
                    onChange={(e) => setCalcState(e.target.value)}
                    required
                    placeholder="e.g. Maharashtra"
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Order Value (₹)</label>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(parseFloat(e.target.value))}
                    required
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Weight (kg)</label>
                  <input
                    type="number"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(parseFloat(e.target.value))}
                    required
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Pincode (Optional)</label>
                <input
                  type="text"
                  value={calcPincode}
                  onChange={(e) => setCalcPincode(e.target.value)}
                  placeholder="e.g. 400001"
                  className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={calcLoading}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 rounded-xl text-xs transition"
              >
                {calcLoading ? 'Calculating...' : 'Run sandbox rate'}
              </button>
            </form>
          </div>

          {/* Sandbox result */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
              Calculation Output
            </h3>
            {calcLoading && <SectionLoader message="Running pricing calculation algorithms..." />}
            {calcError && (
              <div className="flex gap-2 bg-red-50 border border-red-100 text-red-700 text-xs p-4 rounded-xl items-center font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{calcError}</span>
              </div>
            )}
            {calcResult ? (
              <div className="space-y-4 text-xs">
                <div className="bg-green-50 border border-green-150 p-4 rounded-xl text-green-800 flex justify-between font-bold items-center text-sm">
                  <span>Calculated Rate Cost:</span>
                  <span className="font-mono text-lg">{formatMoney(calcResult.rate)}</span>
                </div>
                <div className="space-y-2.5 text-neutral-700">
                  <div className="flex justify-between pb-1.5 border-b border-neutral-100">
                    <span className="text-neutral-500">Method Name:</span>
                    <span className="font-semibold">{calcResult.methodName}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-neutral-100">
                    <span className="text-neutral-500">Method Code:</span>
                    <span className="font-mono font-semibold">{calcResult.methodCode}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-neutral-100">
                    <span className="text-neutral-500">Estimated Delivery:</span>
                    <span className="font-semibold">{calcResult.estimatedDelivery}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Eligible for Free Shipping:</span>
                    <span className="font-bold">{calcResult.freeShipping ? 'YES' : 'NO'}</span>
                  </div>
                </div>
              </div>
            ) : (
              !calcLoading && (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-neutral-200 rounded-xl text-neutral-400">
                  <Calculator className="w-8 h-8 opacity-40 mb-2" />
                  <p className="text-2xs font-semibold">Input params and click run calculation to test pricing rates.</p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AlertCircle({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
