'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ShieldCheck, ShoppingBag, Truck, RefreshCw, Scale, ArrowLeft, Mail } from 'lucide-react';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <StorefrontHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
          <Link href="/" className="hover:text-[#800020] flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <span>/</span>
          <span className="text-[#800020]">Terms of Service</span>
        </div>

        {/* Page Hero Header */}
        <div className="bg-gradient-to-br from-rose-950 via-[#420A18] to-amber-950 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Scale className="w-4 h-4" /> Legal Terms & Conditions
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold font-serif tracking-tight">Terms of Service</h1>
            <p className="text-xs sm:text-sm text-rose-100/80 max-w-2xl leading-relaxed">
              Welcome to <strong className="text-amber-300">Vasanthi&apos;s Signature</strong> (<a href="https://vasanthissignature.in" className="underline font-bold text-white">https://vasanthissignature.in</a>). By accessing our website, making a purchase, or creating an account, you agree to comply with the following Terms & Conditions.
            </p>
            <div className="pt-2 text-[11px] text-rose-200/70 font-mono">
              Effective Date: August 9, 2026 • Governed by the Laws of India
            </div>
          </div>
        </div>

        {/* Policy Content Sections */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-10 text-sm leading-relaxed text-neutral-700">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-serif text-[#800020] flex items-center gap-2 border-b border-rose-100 pb-2">
              <ShieldCheck className="w-5 h-5 text-[#800020]" /> 1. Account Registration & Social Sign-In (OAuth 2.0)
            </h2>
            <p>
              To place orders or access premium customer features (such as wishlist synchronization and order tracking), you may register an account manually or use <strong>Google OAuth 2.0 Social Login</strong>.
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm pl-2 text-neutral-800">
              <li>You are responsible for maintaining the confidentiality of your account login credentials.</li>
              <li>When signing in via Google OAuth 2.0, you warrant that the Google Account belongs to you and is active.</li>
              <li>Vasanthi&apos;s Signature reserves the right to terminate accounts that violate security protocols or participate in fraudulent activity.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-serif text-[#800020] flex items-center gap-2 border-b border-rose-100 pb-2">
              <ShoppingBag className="w-5 h-5 text-[#800020]" /> 2. Product Orders, Pricing & Taxes
            </h2>
            <p>
              All prices listed on <strong>https://vasanthissignature.in</strong> are in Indian Rupees (INR, ₹) and include applicable GST taxes unless stated otherwise.
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm pl-2 text-neutral-800">
              <li>Product availability and prices are subject to change without prior notice.</li>
              <li>In the rare event of a pricing error or stock inaccuracy, we reserve the right to cancel or adjust the order with a full refund.</li>
              <li>Payments can be made via Credit/Debit Cards, NetBanking, UPI, or Cash on Delivery (COD) where eligible.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-serif text-[#800020] flex items-center gap-2 border-b border-rose-100 pb-2">
              <Truck className="w-5 h-5 text-[#800020]" /> 3. Shipping, Logistics & Delivery
            </h2>
            <p>
              We partner with reputed courier logistics providers (including DTDC and Express Partners) to ensure safe and timely delivery of your luxury ethnic apparel.
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm pl-2 text-neutral-800">
              <li>Standard delivery takes between 3 to 7 business days depending on customer pincode location across India.</li>
              <li>Real-time tracking AWB numbers are provided via SMS and email upon order dispatch.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-serif text-[#800020] flex items-center gap-2 border-b border-rose-100 pb-2">
              <RefreshCw className="w-5 h-5 text-[#800020]" /> 4. Returns, Exchanges & Refunds
            </h2>
            <p>
              Customer satisfaction is our priority. If you receive a damaged or wrong product, you may request a return or exchange within <strong>7 days of delivery</strong> through your Account Orders dashboard.
            </p>
            <p className="text-xs sm:text-sm">
              Items must be unused, unwashed, with all original brand tags attached. Approved refunds are credited to the original payment method or wallet within 5 to 7 business days.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-serif text-[#800020] flex items-center gap-2 border-b border-rose-100 pb-2">
              <FileText className="w-5 h-5 text-[#800020]" /> 5. Intellectual Property Rights
            </h2>
            <p>
              All trademarks, product designs, brand logos, high-resolution imagery, and website content displayed on <strong>Vasanthi&apos;s Signature</strong> are the exclusive property of Vasanthi&apos;s Signature. Reproduction or unauthorized commercial use is strictly prohibited.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-serif text-[#800020] flex items-center gap-2 border-b border-rose-100 pb-2">
              <Scale className="w-5 h-5 text-[#800020]" /> 6. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms of Service and any separate agreements shall be governed by and construed in accordance with the laws of India, subject to the exclusive jurisdiction of the courts in India.
            </p>
          </section>

          {/* Section 7: Support */}
          <section className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200/80 space-y-2">
            <h3 className="font-bold font-serif text-base text-[#800020] flex items-center gap-2">
              <Mail className="w-4 h-4" /> Questions About Terms of Service?
            </h3>
            <p className="text-xs text-neutral-600">
              For any queries regarding our legal terms or store policies, reach out to our legal & compliance team:
            </p>
            <div className="text-xs font-semibold text-neutral-800 space-y-1 pt-1">
              <div>Store: Vasanthi&apos;s Signature</div>
              <div>Domain: <a href="https://vasanthissignature.in" className="text-[#800020] underline">https://vasanthissignature.in</a></div>
              <div>Support Email: <a href="mailto:support@vasanthissignature.in" className="text-[#800020] underline">support@vasanthissignature.in</a></div>
            </div>
          </section>

        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
