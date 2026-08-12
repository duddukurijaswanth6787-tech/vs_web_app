'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, CheckCircle2, ArrowLeft, Mail, FileText, Server } from 'lucide-react';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';

export default function PrivacyPolicyPage() {
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
          <span className="text-[#800020]">Privacy Policy</span>
        </div>

        {/* Page Hero Header */}
        <div className="bg-gradient-to-br from-rose-950 via-[#420A18] to-amber-950 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Official Data Governance & Privacy
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold font-serif tracking-tight">Privacy Policy</h1>
            <p className="text-xs sm:text-sm text-rose-100/80 max-w-2xl leading-relaxed">
              At <strong className="text-amber-300">Vasanthi&apos;s Signature</strong> (accessible from <a href="https://vasanthissignature.in" className="underline font-bold text-white">https://vasanthissignature.in</a>), protecting your personal information and transparent data management is our highest commitment.
            </p>
            <div className="pt-2 text-[11px] text-rose-200/70 font-mono">
              Last Updated: August 9, 2026 • Compliant with Indian IT Act 2000 & GDPR Standards
            </div>
          </div>
        </div>

        {/* Policy Content Sections */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-10 text-sm leading-relaxed text-neutral-700">
          
          {/* Quick Highlight Box for Google OAuth */}
          <div className="bg-rose-50/60 border border-rose-200/70 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#800020] font-bold text-base font-serif">
              <Lock className="w-5 h-5 text-[#800020]" /> Google OAuth 2.0 & Social Sign-In Data Commitment
            </div>
            <p className="text-xs text-neutral-700 leading-relaxed">
              When you use <strong>&quot;Continue with Google&quot;</strong> to log into <strong>Vasanthi&apos;s Signature</strong>, we only access basic account identity details (your primary email address, full name, and avatar image). We <strong>never</strong> store your Google passwords, access your private Gmail messages, or sell Google user data to third-party advertisers.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-serif text-[#800020] flex items-center gap-2 border-b border-rose-100 pb-2">
              <FileText className="w-5 h-5 text-[#800020]" /> 1. Information We Collect
            </h2>
            <p>
              We collect information to provide better services to all our customers, fulfill orders, process payments, and improve your shopping experience.
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm pl-2 text-neutral-800">
              <li><strong>Account & Contact Information:</strong> Full name, phone number, email address, shipping and billing address.</li>
              <li><strong>Single Sign-On (OAuth 2.0):</strong> Email address, public profile name, and profile picture ID provided via Google OAuth 2.0 authentication.</li>
              <li><strong>Order & Transaction History:</strong> Purchased items, transaction IDs, payment methods (handled securely via Razorpay), and delivery address history.</li>
              <li><strong>Technical Data:</strong> IP address, device operating system, browser type, and cookie identifiers for session management.</li>
            </ul>
          </section>

          {/* Section 2 - GOOGLE OAUTH SPECIFIC */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-serif text-[#800020] flex items-center gap-2 border-b border-rose-100 pb-2">
              <Server className="w-5 h-5 text-[#800020]" /> 2. How We Use Google User Data (Google OAuth 2.0)
            </h2>
            <p>
              Our application uses Google API Services to allow fast, 1-click customer authentication. Our use and transfer of information received from Google APIs adhere to the <strong>Google API Service User Data Policy</strong>, including the Limited Use requirements.
            </p>
            <div className="space-y-2 text-xs sm:text-sm pl-2">
              <p><strong>Specifically, Google OAuth data is used ONLY to:</strong></p>
              <ul className="list-disc list-inside space-y-1 pl-4 text-neutral-800">
                <li>Create and manage your customer account on Vasanthi&apos;s Signature.</li>
                <li>Send order receipts, shipment notifications, and customer support communications.</li>
                <li>Provide personalized wishlist and loyalty reward tracking.</li>
              </ul>
              <p className="pt-2">
                <strong>Data Protection Guarantee:</strong> We do not share, transfer, or sell your Google User Data to any advertising networks, data brokers, or third parties. You may revoke access at any time through your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-[#800020] font-bold underline">Google Security Settings</a>.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-serif text-[#800020] flex items-center gap-2 border-b border-rose-100 pb-2">
              <Lock className="w-5 h-5 text-[#800020]" /> 3. Payment Processing & Financial Security
            </h2>
            <p>
              All online payment transactions (Credit Cards, Debit Cards, NetBanking, and UPI) are processed through PCI-DSS Level 1 compliant payment gateways (Razorpay). 
            </p>
            <p className="text-xs sm:text-sm">
              <strong>Vasanthi&apos;s Signature does NOT store or record card numbers, CVVs, or NetBanking passwords on our servers.</strong> All credit card details are encrypted using 256-bit SSL encryption provided by our payment gateway partners.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-serif text-[#800020] flex items-center gap-2 border-b border-rose-100 pb-2">
              <Eye className="w-5 h-5 text-[#800020]" /> 4. Cookies & Local Storage
            </h2>
            <p>
              We use session cookies and browser LocalStorage (e.g., guest cart and wishlist tokens) to remember items in your shopping bag, maintain active sessions, and provide seamless page navigation. You can control or disable cookies through your web browser settings.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-serif text-[#800020] flex items-center gap-2 border-b border-rose-100 pb-2">
              <CheckCircle2 className="w-5 h-5 text-[#800020]" /> 5. Data Deletion & Customer Rights
            </h2>
            <p>
              Under applicable Indian privacy regulations and international data standards, you have the right to access, update, or request permanent deletion of your personal data.
            </p>
            <p className="text-xs sm:text-sm">
              To request account deletion or data removal, please contact our privacy officer at <strong className="text-[#800020]">support@vasanthissignature.in</strong>. Upon verification, all customer data will be permanently purged within 30 business days.
            </p>
          </section>

          {/* Section 6: Contact */}
          <section className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200/80 space-y-2">
            <h3 className="font-bold font-serif text-base text-[#800020] flex items-center gap-2">
              <Mail className="w-4 h-4" /> Contact Our Data Governance Team
            </h3>
            <p className="text-xs text-neutral-600">
              If you have any questions, concerns, or inquiries regarding this Privacy Policy or our Google OAuth compliance, feel free to reach out to us:
            </p>
            <div className="text-xs font-semibold text-neutral-800 space-y-1 pt-1">
              <div>Brand: Vasanthi&apos;s Signature</div>
              <div>Website: <a href="https://vasanthissignature.in" className="text-[#800020] underline">https://vasanthissignature.in</a></div>
              <div>Email: <a href="mailto:support@vasanthissignature.in" className="text-[#800020] underline">support@vasanthissignature.in</a></div>
              <div>Phone Support: +91 98765 43210</div>
            </div>
          </section>

        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
}
