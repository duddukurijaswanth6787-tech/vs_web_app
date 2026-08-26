'use client';

import React from 'react';
import { Truck, RotateCcw, ShieldCheck, Banknote, Gift } from 'lucide-react';
import { useFeatureEnabled } from '@/features/customer/hooks';

export function BenefitsStrip() {
  const returnsEnabled = useFeatureEnabled('returns');
  const benefits = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'On orders above ₹999',
    },
    ...(returnsEnabled
      ? [{
          icon: RotateCcw,
          title: 'Easy Returns',
          description: '10 days return policy',
        }]
      : []),
    {
      icon: ShieldCheck,
      title: 'Secure Payment',
      description: '100% secure checkout',
    },
    {
      icon: Banknote,
      title: 'COD Available',
      description: 'Cash on delivery',
    },
    {
      icon: Gift,
      title: 'Exclusive Offers',
      description: 'On prepaid orders',
    },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div className="bg-[#F5FAFF] border border-sky-100 rounded-2xl p-3.5 sm:p-5 flex overflow-x-auto gap-4 scrollbar-none snap-x snap-mandatory md:grid md:grid-cols-5 md:overflow-visible items-center justify-between text-left shadow-2xs">
        {benefits.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={`flex items-center gap-3 shrink-0 snap-start w-[160px] sm:w-[180px] md:w-auto ${
                index < benefits.length - 1 ? 'md:border-r md:border-sky-200/50 md:pr-4' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-white text-[var(--brand-primary)] flex items-center justify-center shrink-0 shadow-2xs border border-sky-100">
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs font-bold text-neutral-900 leading-snug truncate">
                  {item.title}
                </h4>
                <p className="text-[10px] text-neutral-500 font-medium leading-tight truncate">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
