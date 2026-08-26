'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Camera,
  Globe,
  MapPin,
  Play,
  MessageCircle,
  Smartphone,
  Lock,
  Headphones,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureEnabled } from '@/features/customer/hooks';

export function StorefrontFooter() {
  const { isAuthenticated } = useAuth();
  const returnsEnabled = useFeatureEnabled('returns');
  return (
    <footer className="w-full font-sans">
      {/* Main Footer Content */}

      {/* 2. Main Footer Content (Tight Vertical Spacing on Mobile) */}
      <div className="bg-[color-mix(in_oklab,var(--footer-bg)_62%,black)] text-sky-100/90 pt-5 sm:pt-12 pb-20 lg:pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto space-y-4">
          {/* Top Row: Brand & Social Icons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <Image src="/brand/logo-full.png" alt="Vasanthi's Signature" width={1400} height={803} className="h-16 sm:h-20 w-auto object-contain" />
              <p className="text-[11px] text-[color-mix(in_oklab,var(--footer-text)_70%,transparent)] hidden sm:block mt-1.5">
                Pioneering haute couture lehengas, kurtis, and luxury fashion since 2018.
              </p>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2 text-[var(--footer-text)]">
              <a href="#" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--footer-bg)] hover:bg-sky-700 hover:text-[var(--footer-link-hover)] flex items-center justify-center transition-colors">
                <Camera className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--footer-bg)] hover:bg-sky-700 hover:text-[var(--footer-link-hover)] flex items-center justify-center transition-colors">
                <Globe className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--footer-bg)] hover:bg-sky-700 hover:text-[var(--footer-link-hover)] flex items-center justify-center transition-colors">
                <MapPin className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--footer-bg)] hover:bg-sky-700 hover:text-[var(--footer-link-hover)] flex items-center justify-center transition-colors">
                <Play className="w-3.5 h-3.5 fill-sky-200" />
              </a>
              <a href="#" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--footer-bg)] hover:bg-sky-700 hover:text-[var(--footer-link-hover)] flex items-center justify-center transition-colors">
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Links Grid: Tight 2-Column on Mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-8 pt-1">
            {/* Column 1: Shop */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--footer-heading)]">Shop</h4>
              <ul className="space-y-1 text-[11px] text-[color-mix(in_oklab,var(--footer-text)_70%,transparent)]">
                <li><Link href="/categories/lehengas" className="hover:text-[var(--footer-link-hover)] transition-colors">Lehengas</Link></li>
                <li><Link href="/categories/kurtis" className="hover:text-[var(--footer-link-hover)] transition-colors">Kurtis & Suits</Link></li>
                <li><Link href="/categories/dresses" className="hover:text-[var(--footer-link-hover)] transition-colors">Dresses</Link></li>
                <li><Link href="/offers" className="hover:text-[var(--footer-link-hover)] transition-colors">Sale</Link></li>
              </ul>
            </div>

            {/* Column 2: Customer Care */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--footer-heading)]">Customer Care</h4>
              <ul className="space-y-1 text-[11px] text-[color-mix(in_oklab,var(--footer-text)_70%,transparent)]">
                <li><Link href="/contact" className="hover:text-[var(--footer-link-hover)] transition-colors">Contact Us</Link></li>
                <li><Link href="/pricing" className="hover:text-[var(--footer-link-hover)] transition-colors">Pricing</Link></li>
                <li><Link href="/track-order" className="hover:text-[var(--footer-link-hover)] transition-colors">Track Order</Link></li>
                {returnsEnabled && <li><Link href="/returns" className="hover:text-[var(--footer-link-hover)] transition-colors">My Returns</Link></li>}
                <li><Link href="/cancellation-refund-policy" className="hover:text-[var(--footer-link-hover)] transition-colors">Cancellation & Refund Policy</Link></li>
                <li><Link href="/shipping" className="hover:text-[var(--footer-link-hover)] transition-colors">Shipping Info</Link></li>
                <li><Link href="/faqs" className="hover:text-[var(--footer-link-hover)] transition-colors">FAQs & Size Guide</Link></li>
              </ul>
            </div>

            {/* Column 3: About (Desktop/Tablet) */}
            <div className="hidden sm:block space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--footer-heading)]">About</h4>
              <ul className="space-y-1 text-[11px] text-[color-mix(in_oklab,var(--footer-text)_70%,transparent)]">
                <li><Link href="/about" className="hover:text-[var(--footer-link-hover)] transition-colors">Our Story</Link></li>
                <li><Link href="/press" className="hover:text-[var(--footer-link-hover)] transition-colors">Press</Link></li>
              </ul>
            </div>

            {/* Column 4: My Account (Desktop/Tablet) */}
            <div className="hidden sm:block space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--footer-heading)]">My Account</h4>
              <ul className="space-y-1 text-[11px] text-[color-mix(in_oklab,var(--footer-text)_70%,transparent)]">
                <li><Link href={isAuthenticated ? '/profile' : '/login'} className="hover:text-[var(--footer-link-hover)] transition-colors">{isAuthenticated ? 'My Account' : 'Login'}</Link></li>
                <li><Link href="/orders" className="hover:text-[var(--footer-link-hover)] transition-colors">Orders</Link></li>
                <li><Link href="/wishlist" className="hover:text-[var(--footer-link-hover)] transition-colors">Wishlist</Link></li>
                <li><Link href="/profile/addresses" className="hover:text-[var(--footer-link-hover)] transition-colors">Addresses</Link></li>
              </ul>
            </div>

          </div>

        </div>
      </div>

      {/* 3. Secure Payments & Support Bar */}
      <div className="bg-[color-mix(in_oklab,var(--footer-bg)_40%,black)] border-t border-sky-950/60 py-2.5 px-4 sm:px-6 lg:px-8 text-[var(--footer-text)]/80 text-[10px]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center">
            <Lock className="w-3 h-3 text-sky-400" />
            <span className="font-bold text-[var(--footer-heading)] uppercase tracking-wide text-[9px]">SECURE PAYMENTS</span>
            <div className="flex items-center gap-1 ml-1">
              <span className="bg-[color-mix(in_oklab,var(--footer-bg)_75%,black)] text-[8px] px-1.5 py-0.5 rounded-md font-semibold">VISA</span>
              <span className="bg-[color-mix(in_oklab,var(--footer-bg)_75%,black)] text-[8px] px-1.5 py-0.5 rounded-md font-semibold">Mastercard</span>
              <span className="bg-[color-mix(in_oklab,var(--footer-bg)_75%,black)] text-[8px] px-1.5 py-0.5 rounded-md font-semibold">RuPay</span>
              <span className="bg-[color-mix(in_oklab,var(--footer-bg)_75%,black)] text-[8px] px-1.5 py-0.5 rounded-md font-semibold">UPI</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 justify-center">
            <Headphones className="w-3 h-3 text-sky-400" />
            <span className="font-bold text-[var(--footer-heading)] uppercase tracking-wide text-[9px]">24/7 SUPPORT</span>
            <span className="font-bold text-amber-300">+91 98765 43210</span>
          </div>

        </div>
      </div>

      {/* 4. Bottom Legal Bar */}
      <div className="bg-[color-mix(in_oklab,var(--footer-bg)_25%,black)] border-t border-sky-950/80 py-2.5 px-4 sm:px-6 lg:px-8 text-sky-300/60 text-[10px]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left">
          <span>© 2026 Vasanthi&apos;s Signature. All rights reserved.</span>

          <div className="flex items-center gap-2.5 justify-center text-[9px]">
            <Link href="/privacy" className="hover:text-[var(--footer-link-hover)] transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-[var(--footer-link-hover)] transition-colors">Terms</Link>
            <span>•</span>
            <Link href="/cancellation-refund-policy" className="hover:text-[var(--footer-link-hover)] transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
