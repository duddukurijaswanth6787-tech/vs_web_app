'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Phone, Calendar, Globe, DollarSign, Save, Tag, Sparkles, SlidersHorizontal, Check } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerProfile } from '@/features/customer/hooks';
import { customerMeService } from '@/features/customer/me.service';
import { getApiErrorMessage } from '@/utils/api-error';

const CATEGORY_OPTIONS = ['Kanchipuram Silks', 'Banarasi Sarees', 'Designer Lehengas', 'Bridal Wear', 'Chanderi Sarees', 'Dupattas & Shawls', 'Anarkali Suits'];
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom Stitch'];
const COLOR_OPTIONS = [
  { name: 'Crimson Red', hex: '#800020' },
  { name: 'Silk Gold', hex: '#D4AF37' },
  { name: 'Peacock Blue', hex: '#005F73' },
  { name: 'Emerald Green', hex: '#0A9396' },
  { name: 'Royal Magenta', hex: '#9B5DE5' },
  { name: 'Classic Ivory', hex: '#FFFFF0' },
];
const BRAND_OPTIONS = ['Vasanthi Exclusive', 'Royal Silk Weaves', 'Heritage Bridal Collection', 'Artisan Handloom'];

export default function ProfileEditPage() {
  const router = useRouter();
  const { isAuthenticated, isInitializing, refetchUser } = useAuth();
  const { data } = useCustomerProfile(isAuthenticated);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    gender: 'FEMALE',
    dateOfBirth: '',
    preferredLanguage: 'English',
    preferredCurrency: 'INR',
    companyName: '',
    gstin: '',
    preferredCategories: [] as string[],
    preferredBrands: [] as string[],
    preferredSizes: [] as string[],
    preferredColors: [] as string[],
    preferredPriceMin: '',
    preferredPriceMax: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [prevData, setPrevData] = useState(data);

  if (data !== prevData) {
    setPrevData(data);
    if (data) {
      const d = data as unknown as Record<string, unknown>;
      setForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        gender: (data.gender as string) || 'FEMALE',
        dateOfBirth: (data.dateOfBirth as string) || '',
        preferredLanguage: (data.preferredLanguage as string) || 'English',
        preferredCurrency: (data.preferredCurrency as string) || 'INR',
        companyName: String(d.companyName || ''),
        gstin: String(d.gstin || ''),
        preferredCategories: Array.isArray(d.preferredCategories) ? d.preferredCategories : [],
        preferredBrands: Array.isArray(d.preferredBrands) ? d.preferredBrands : [],
        preferredSizes: Array.isArray(d.preferredSizes) ? d.preferredSizes : [],
        preferredColors: Array.isArray(d.preferredColors) ? d.preferredColors : [],
        preferredPriceMin: d.preferredPriceMin ? String(d.preferredPriceMin) : '',
        preferredPriceMax: d.preferredPriceMax ? String(d.preferredPriceMax) : '',
      });
    }
  }

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href="/login?redirect=/profile/edit" className="text-sm font-bold text-[#800020]">
          Login required
        </Link>
      </div>
    );
  }

  const toggleItem = (key: 'preferredCategories' | 'preferredBrands' | 'preferredSizes' | 'preferredColors', item: string) => {
    setForm((f) => {
      const arr = f[key];
      return {
        ...f,
        [key]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item],
      };
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await customerMeService.updateProfile({
        ...form,
        preferredPriceMin: form.preferredPriceMin ? Number(form.preferredPriceMin) : undefined,
        preferredPriceMax: form.preferredPriceMax ? Number(form.preferredPriceMax) : undefined,
      });
      await refetchUser();
      router.push('/profile');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update profile'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/profile" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#800020]">Edit Profile & Shopping Preferences</h1>
      </header>

      <main className="max-w-lg mx-auto w-full px-4 py-6 flex-1">
        <form onSubmit={onSubmit} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-5 shadow-xs text-xs">
          {error && <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#800020]" />
              <span>Personal Details</span>
            </h2>
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="font-semibold text-neutral-700">First Name *</span>
              <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2">
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="flex-1 text-xs outline-none w-full"
                />
              </div>
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-neutral-700">Last Name</span>
              <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2">
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="flex-1 text-xs outline-none w-full"
                />
              </div>
            </label>
          </div>

          {/* Phone & Gender */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="font-semibold text-neutral-700">Mobile Phone</span>
              <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2">
                <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="flex-1 text-xs outline-none w-full"
                />
              </div>
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-neutral-700">Gender</span>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full text-xs border border-neutral-200 rounded-xl px-2.5 py-2 outline-none focus:border-[#800020] bg-white font-medium text-neutral-800"
              >
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </label>
          </div>

          {/* Date of Birth */}
          <label className="block space-y-1">
            <span className="font-semibold text-neutral-700">Date of Birth</span>
            <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2">
              <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="flex-1 text-xs outline-none w-full"
              />
            </div>
          </label>

          {/* B2B Wholesale Info */}
          <div className="border-t border-neutral-100 pt-3 space-y-3">
            <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#800020]" />
              <span>B2B & Wholesale Business Tax Info</span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="font-semibold text-neutral-700">Company / Business Name</span>
                <input
                  type="text"
                  placeholder="Vasanthi Textiles Pvt Ltd"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl outline-none"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-neutral-700">GSTIN Number</span>
                <input
                  type="text"
                  placeholder="36AABCV1234F1Z5"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl outline-none uppercase font-mono"
                />
              </label>
            </div>
          </div>

          {/* Personalized Shopping Preferences */}
          <div className="border-t border-neutral-100 pt-3 space-y-3">
            <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#800020]" />
              <span>Personalized Style & Fit Preferences</span>
            </h2>

            {/* Preferred Categories */}
            <div>
              <span className="font-semibold text-neutral-700 block mb-1.5">Preferred Categories</span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_OPTIONS.map((cat) => {
                  const active = form.preferredCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleItem('preferredCategories', cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 border cursor-pointer ${
                        active
                          ? 'bg-[#800020] text-white border-[#800020]'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {active && <Check className="w-3 h-3" />}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Sizes */}
            <div>
              <span className="font-semibold text-neutral-700 block mb-1.5">Preferred Clothing Sizes</span>
              <div className="flex flex-wrap gap-1.5">
                {SIZE_OPTIONS.map((sz) => {
                  const active = form.preferredSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleItem('preferredSizes', sz)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                        active
                          ? 'bg-[#800020] text-white border-[#800020]'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Colors */}
            <div>
              <span className="font-semibold text-neutral-700 block mb-1.5">Favorite Color Palette</span>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((col) => {
                  const active = form.preferredColors.includes(col.name);
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => toggleItem('preferredColors', col.name)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
                        active
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full border border-neutral-300 shrink-0" style={{ backgroundColor: col.hex }} />
                      <span>{col.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Budget Range */}
            <div>
              <span className="font-semibold text-neutral-700 block mb-1.5 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#800020]" />
                <span>Target Saree & Lehenga Budget (INR ₹)</span>
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2">
                  <span className="text-neutral-400 font-bold">₹</span>
                  <input
                    type="number"
                    placeholder="Min Price (e.g. 5000)"
                    value={form.preferredPriceMin}
                    onChange={(e) => setForm({ ...form, preferredPriceMin: e.target.value })}
                    className="flex-1 text-xs outline-none w-full"
                  />
                </div>
                <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2">
                  <span className="text-neutral-400 font-bold">₹</span>
                  <input
                    type="number"
                    placeholder="Max Price (e.g. 75000)"
                    value={form.preferredPriceMax}
                    onChange={(e) => setForm({ ...form, preferredPriceMax: e.target.value })}
                    className="flex-1 text-xs outline-none w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#800020] hover:bg-[#600018] text-white text-sm font-bold py-3 rounded-xl disabled:opacity-60 transition-all shadow-md flex items-center justify-center gap-2 mt-4"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Preferences…' : 'Save All Preferences'}</span>
          </button>
        </form>
      </main>
      <StorefrontFooter />
    </div>
  );
}
