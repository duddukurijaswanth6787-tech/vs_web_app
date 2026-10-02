'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  MapPin,
  Calendar,
  Phone,
  MessageCircle,
  Mail,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { usePublicSettings } from '@/features/customer/hooks';

interface ExpoStorefrontGateProps {
  children: React.ReactNode;
}

export function ExpoStorefrontGate({ children }: ExpoStorefrontGateProps) {
  const pathname = usePathname();
  const { data: settings, isLoading } = usePublicSettings();

  // Allow admin and POS routes to bypass the lock screen entirely
  const isExcludedPath = useMemo(() => {
    if (!pathname) return false;
    return (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/pos') ||
      pathname.startsWith('/api') ||
      pathname === '/login' ||
      pathname === '/register'
    );
  }, [pathname]);

  // Determine if expo / maintenance mode is currently active
  const isLockActive = useMemo(() => {
    if (isExcludedPath) return false;
    if (!settings) return false;

    // Direct master toggle
    if (settings.maintenanceMode) return true;

    // Optional date-range based auto activation
    const startTimeStr = settings.maintenanceStartTime ? String(settings.maintenanceStartTime) : '';
    const endTimeStr = settings.maintenanceEndTime ? String(settings.maintenanceEndTime) : '';
    if (startTimeStr || endTimeStr) {
      const now = new Date().getTime();
      let start = 0;
      let end = Infinity;
      if (startTimeStr) {
        const fullStart = startTimeStr.length === 10 ? `${startTimeStr}T00:00:00` : startTimeStr;
        start = new Date(fullStart).getTime();
      }
      if (endTimeStr) {
        const fullEnd = endTimeStr.length === 10 ? `${endTimeStr}T23:59:59` : endTimeStr;
        end = new Date(fullEnd).getTime();
      }
      if (!isNaN(start) && !isNaN(end) && now >= start && now <= end) {
        return true;
      }
    }

    return false;
  }, [settings, isExcludedPath]);

  // If not locked or on excluded admin/pos path, render normal application
  if (!isLockActive) {
    return <>{children}</>;
  }

  const storeName = settings?.storeName ? String(settings.storeName) : "Vasanthi's Signature";
  const customMessage = settings?.storeDescription
    ? String(settings.storeDescription)
    : settings?.metaDescription
    ? String(settings.metaDescription)
    : (settings as any)?.maintenanceMessage
    ? String((settings as any).maintenanceMessage)
    : '';
  const phone = settings?.supportPhone
    ? String(settings.supportPhone)
    : settings?.whatsappNumber
    ? String(settings.whatsappNumber)
    : '+91 99999 99999';
  const whatsapp = settings?.whatsappNumber
    ? String(settings.whatsappNumber)
    : settings?.supportPhone
    ? String(settings.supportPhone)
    : '+91 99999 99999';
  const email = settings?.supportEmail ? String(settings.supportEmail) : 'support@vasanthissignature.in';
  const cleanWhatsapp = whatsapp.replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#11050A] via-[#1A0A12] to-[#0A0307] text-white flex flex-col justify-between font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Decorative ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-rose-900/20 rounded-full blur-[120px] opacity-70" />
        <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] bg-amber-600/15 rounded-full blur-[100px] opacity-60" />
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-red-900/15 rounded-full blur-[110px] opacity-50" />
      </div>

      {/* Top Header / Branding */}
      <header className="relative z-10 w-full px-6 py-6 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 p-0.5 shadow-lg shadow-rose-950/50">
            <div className="w-full h-full bg-[#1A0A12] rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-serif font-bold tracking-wide text-amber-100">
              {storeName}
            </h1>
            <p className="text-[10px] text-amber-400/80 font-medium tracking-widest uppercase">
              Exclusive Designer Boutique
            </p>
          </div>
        </div>

        {/* Live Expo Status Pill */}
        <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/30 px-3.5 py-1.5 rounded-full shadow-inner">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
          </span>
          <span className="text-xs font-semibold text-amber-300 tracking-wider uppercase">
            Expo In Progress
          </span>
        </div>
      </header>

      {/* Main Notice Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10 my-4">
        <div className="max-w-2xl w-full bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 rounded-3xl p-6 sm:p-10 backdrop-blur-2xl shadow-2xl shadow-black/80 text-center space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-rose-500/20 border border-amber-400/30 px-4 py-1.5 rounded-full">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-amber-200 tracking-wide">
              Live Exhibition • Hanamkonda Expo
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-snug">
              We Are Live at the Expo!
            </h2>
            <p className="text-base sm:text-lg text-amber-200/90 font-serif">
              హనుమకొండ ఎక్స్‌పో లో మా ప్రత్యేక ప్రదర్శన జరుగుతోంది!
            </p>
          </div>

          {/* Detailed Message Box */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-5 sm:p-6 text-left space-y-4 shadow-inner">
            {customMessage ? (
              <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line">
                {customMessage}
              </p>
            ) : (
              <>
                <div className="space-y-2 border-b border-white/10 pb-4">
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    తెలుగు సమాచారం
                  </p>
                  <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                    నమస్కారం! మేము ప్రస్తుతం <strong>హనుమకొండ</strong> లో జరుగుతున్న ప్రత్యేక ఎక్స్‌పో లో పాల్గొంటున్నాము. మా కలెక్షన్స్ & స్టాక్ మొత్తం ఎక్స్‌పో లో అందుబాటులో ఉన్నందున, వెబ్‌సైట్ ద్వారా ఆన్‌లైన్ ఆర్డర్లు <strong>రాబోయే 3 రోజుల పాటు తాత్కాలికంగా నిలిపివేయబడ్డాయి</strong>.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    English Notice
                  </p>
                  <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                    Dear Valued Customers, we are exhibiting our exclusive collections at the <strong>Hanamkonda Expo for the next 3 days</strong>! Online orders and browsing are temporarily paused to prevent inventory collision. Our online store will resume full operations on <strong>Monday</strong>.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Reopening & Stock Protection Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-400">Reopening Date</p>
                <p className="text-xs font-semibold text-white">Monday (సోమవారం)</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-rose-400/10 text-rose-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-400">Inventory Status</p>
                <p className="text-xs font-semibold text-white">Exhibiting Live at Expo</p>
              </div>
            </div>
          </div>

          {/* Direct WhatsApp / Call Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {whatsapp && (
              <a
                href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                  `Hello ${storeName}, I have an urgent inquiry regarding the Hanamkonda Expo / Product.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02]"
              >
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp
              </a>
            )}

            {phone && (
              <a
                href={`tel:${phone}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md transition-all hover:scale-[1.02]"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                Call: {phone}
              </a>
            )}
          </div>
        </div>
      </main>

      {/* Footer & Admin Bypass */}
      <footer className="relative z-10 w-full px-6 py-4 border-t border-white/10 backdrop-blur-md bg-black/30 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-2">
        <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
        
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-neutral-500">
            For Expo Venue Inquiries: {email}
          </span>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-amber-300 transition-colors"
          >
            <Lock className="w-3 h-3" />
            Staff / Super Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
