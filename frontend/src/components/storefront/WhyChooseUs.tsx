'use client';

import React, { useState } from 'react';
import { Gem, Layers, Users, HeartHandshake, Flag, ChevronDown } from 'lucide-react';

export function WhyChooseUs() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  const toggleAccordion = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const pillars = [
    {
      icon: Gem,
      question: 'Premium Quality & Craftsmanship',
      answer: 'Finest handpicked fabrics & master craftsmanship. We source pure silk, organza, and cotton to ensure supreme comfort, rich textures, and unmatched durability for every garment.',
    },
    {
      icon: Layers,
      question: 'Wide & Exclusive Collection',
      answer: 'Something for every celebration. From grand bridal lehengas and festive Anarkalis to daily wear suits, designer sarees, and modern Indo-Western ensembles.',
    },
    {
      icon: Users,
      question: 'Trusted by 10,000+ Happy Customers',
      answer: "Over 10,000+ satisfied buyers across India and worldwide who trust Vasanthi's Signature for authentic, premium ethnic fashion and reliable doorstep delivery.",
    },
    {
      icon: HeartHandshake,
      question: 'Designed with Love & Precision',
      answer: 'Unique designs tailored specifically for you. Intricate hand-embroidery, rich zardosi work, and precision fitting crafted by experienced fashion designers.',
    },
    {
      icon: Flag,
      question: 'Made in India — Supporting Local Artisans',
      answer: 'Proudly supporting traditional Indian weavers and local artisans. Every purchase directly empowers heritage handloom communities across the country.',
    },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Section Header */}
      <div className="text-center space-y-1 mb-5 sm:mb-8">
        <h2 className="text-lg sm:text-3xl font-bold font-serif text-neutral-900 tracking-tight">
          Why Choose Vasanthi&apos;s Signature?
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 font-medium max-w-lg mx-auto">
          Our commitment to quality, authenticity, and heritage luxury
        </p>
      </div>

      {/* Accordion UI Container */}
      <div className="max-w-3xl mx-auto space-y-3">
        {pillars.map((item, index) => {
          const Icon = item.icon;
          const isOpen = openIndex === index;

          return (
            <div
              key={index}
              className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${
                isOpen ? 'border-[#0284c7]/40 shadow-sm ring-1 ring-[#0284c7]/20' : 'border-neutral-200/80 shadow-2xs hover:border-neutral-300'
              }`}
            >
              {/* Accordion Header / Trigger */}
              <button
                type="button"
                onClick={() => toggleAccordion(index)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors hover:bg-sky-50/30"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3.5 pr-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isOpen ? 'bg-[#0284c7] text-white' : 'bg-sky-50 text-[#0284c7] border border-sky-100'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs sm:text-base font-bold text-neutral-900 tracking-tight">
                    {item.question}
                  </span>
                </div>

                {/* Arrow Icon: Expand/Collapse Indicator */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                  isOpen ? 'bg-sky-100 text-[#0284c7] rotate-180' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* Accordion Content / Panel */}
              {isOpen && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed border-t border-sky-100/60 animate-fade-in sm:pl-[3.75rem]">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
