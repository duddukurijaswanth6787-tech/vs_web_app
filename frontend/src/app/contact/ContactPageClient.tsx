'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, User, MessageSquare, MapPin, Clock, Store } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useContactSupport, usePublicSettings } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const contact = useContactSupport();
  const { data: settings } = usePublicSettings();
  const typedSettings = settings as Record<string, unknown> | undefined;
  const storeName = (typedSettings?.storeName as string | undefined) || "Vasanthi's Signature";
  const supportEmail = typedSettings?.supportEmail as string | undefined;
  const supportPhone = typedSettings?.supportPhone as string | undefined;
  const whatsappNumber = typedSettings?.whatsappNumber as string | undefined;
  const supportHours = typedSettings?.supportHours as string | undefined;
  const companyAddress = typedSettings?.companyAddress as string | undefined;
  const [form, setForm] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDone(false);
    try {
      await contact.mutateAsync({ name: form.name, email: form.email, subject: form.subject, message: form.message });
      setDone(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit message'));
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#0284c7]">Contact Us</h1>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-8 flex-1 space-y-6">
        {/* Business Contact Information (editable from Storefront > Store Information) */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-[#0284c7] font-bold text-sm font-serif">
            <Store className="w-4 h-4" />
            <span>{storeName}</span>
          </div>
          <div className="space-y-2 text-xs text-neutral-700">
            {supportEmail && (
              <a href={`mailto:${supportEmail}`} className="flex items-center gap-2 hover:text-[#0284c7] transition-colors">
                <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>{supportEmail}</span>
              </a>
            )}
            {(supportPhone || whatsappNumber) && (
              <a href={`tel:${supportPhone || whatsappNumber}`} className="flex items-center gap-2 hover:text-[#0284c7] transition-colors">
                <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>{supportPhone || whatsappNumber}</span>
              </a>
            )}
            {companyAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                <span>{companyAddress}</span>
              </div>
            )}
            {supportHours && (
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>{supportHours}</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={onSubmit} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4 shadow-xs">
          {error && <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
          {done && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
              Message sent. We will get back to you soon.
            </p>
          )}

          {[
            { key: 'name', label: 'Name', icon: User, required: true },
            { key: 'email', label: 'Email', icon: Mail, type: 'email', required: true },
            { key: 'phone', label: 'Phone', icon: Phone },
            { key: 'subject', label: 'Subject', icon: MessageSquare, required: true },
          ].map((field) => (
            <label key={field.key} className="block space-y-1.5">
              <span className="text-xs font-semibold text-neutral-700">{field.label}</span>
              <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
                <field.icon className="w-4 h-4 text-neutral-400" />
                <input
                  type={field.type || 'text'}
                  required={field.required}
                  value={form[field.key as keyof ContactForm]}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  className="flex-1 text-sm outline-none"
                />
              </div>
            </label>
          ))}

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-neutral-700">Message</span>
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="w-full text-sm border border-neutral-200 rounded-xl px-3 py-2.5 outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={contact.isPending}
            className="w-full bg-[#0284c7] hover:bg-[#0B3B78] disabled:opacity-60 text-white text-sm font-bold py-3 rounded-xl"
          >
            {contact.isPending ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
