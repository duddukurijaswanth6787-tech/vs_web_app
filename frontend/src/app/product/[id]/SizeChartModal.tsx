'use client';

import React, { useState, useMemo } from 'react';
import { X, Ruler, HelpCircle, Check, Sparkles } from 'lucide-react';
import { useProductSizeChart, useSizeChart } from '@/features/catalog/size-charts/size-chart.hooks';
import type { SizeChartTemplateResponse } from '@/features/catalog/size-charts/size-chart.types';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
  productName?: string;
  sizeChartTemplateId?: string;
  initialSizeChart?: SizeChartTemplateResponse | null;
}

const DEFAULT_ETHNIC_SIZES = [
  { size: 'XS', bust: 32, waist: 26, hip: 36, length: 46, shoulder: 13.5 },
  { size: 'S', bust: 34, waist: 28, hip: 38, length: 46, shoulder: 14.0 },
  { size: 'M', bust: 36, waist: 30, hip: 40, length: 47, shoulder: 14.5 },
  { size: 'L', bust: 38, waist: 32, hip: 42, length: 47, shoulder: 15.0 },
  { size: 'XL', bust: 40, waist: 34, hip: 44, length: 48, shoulder: 15.5 },
  { size: 'XXL', bust: 42, waist: 36, hip: 46, length: 48, shoulder: 16.0 },
  { size: '3XL', bust: 44, waist: 38, hip: 48, length: 49, shoulder: 16.5 },
];

export function SizeChartModal({
  isOpen,
  onClose,
  productId,
  productName,
  sizeChartTemplateId,
  initialSizeChart,
}: SizeChartModalProps) {
  const [unit, setUnit] = useState<'IN' | 'CM'>('IN');
  const [showHowToMeasure, setShowHowToMeasure] = useState(false);

  // Fetch product-specific size chart from backend
  const { data: productChartData, isLoading: isLoadingProductChart } = useProductSizeChart(
    productId || '',
    !!productId && !initialSizeChart && !sizeChartTemplateId,
  );

  const { data: templateChartData, isLoading: isLoadingTemplateChart } = useSizeChart(
    sizeChartTemplateId || '',
    !!sizeChartTemplateId && !initialSizeChart,
  );

  const activeChart = useMemo<SizeChartTemplateResponse | null>(() => {
    if (initialSizeChart) return initialSizeChart;
    if (templateChartData) return templateChartData;
    if (productChartData) return productChartData;
    return null;
  }, [initialSizeChart, templateChartData, productChartData]);

  const isLoading = isLoadingProductChart || isLoadingTemplateChart;

  if (!isOpen) return null;

  const convertValue = (val: number | string | undefined, baseUnit: 'IN' | 'CM' = 'IN') => {
    if (val === undefined || val === null || val === '') return '—';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return String(val);

    if (baseUnit === 'IN' && unit === 'CM') {
      return (num * 2.54).toFixed(1);
    }
    if (baseUnit === 'CM' && unit === 'IN') {
      return (num / 2.54).toFixed(1);
    }
    return String(num);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-in relative my-8 border border-neutral-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-2xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pr-8">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center font-bold">
              <Ruler className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-serif text-neutral-900">
                {activeChart?.name || 'Size Chart & Body Measurements'}
              </h3>
              {activeChart?.garmentType && (
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0284c7] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                  {activeChart.garmentType}
                </span>
              )}
            </div>
          </div>
          {productName && (
            <p className="text-xs text-neutral-500 line-clamp-1">
              Garment fitting reference for <span className="font-semibold text-neutral-700">{productName}</span>
            </p>
          )}
        </div>

        {/* Unit Toggle & Measurement Guide Tab */}
        <div className="flex items-center justify-between gap-3 pt-1 border-b border-neutral-100 pb-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setUnit('IN')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                unit === 'IN'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Inches (&quot;)
            </button>
            <button
              type="button"
              onClick={() => setUnit('CM')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                unit === 'CM'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Centimeters (cm)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowHowToMeasure(!showHowToMeasure)}
            className="text-xs font-bold text-[#0284c7] hover:text-sky-900 flex items-center gap-1.5 hover:underline"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {showHowToMeasure ? 'Hide measuring guide' : 'How to measure?'}
          </button>
        </div>

        {/* How to Measure Educational Accordion */}
        {showHowToMeasure && (
          <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 text-xs text-neutral-700 space-y-2.5 animate-fade-in">
            <h4 className="font-bold text-neutral-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Measuring Instructions
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-[#0284c7]">1. Bust:</span>
                <span>Measure around the fullest part of your chest with tape parallel to the floor.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-[#0284c7]">2. Waist:</span>
                <span>Measure around your natural waistline, typically narrowest point near navel.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-[#0284c7]">3. Hips:</span>
                <span>Stand with feet together and measure around the widest part of your hips.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-[#0284c7]">4. Length:</span>
                <span>Measure from high shoulder point straight down to desired hemline.</span>
              </li>
            </ul>
          </div>
        )}

        {/* Sizing Table */}
        <div className="overflow-hidden border border-neutral-200/80 rounded-2xl shadow-2xs">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-neutral-400">Loading custom size specifications...</div>
          ) : activeChart && activeChart.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs">
                <thead className="bg-neutral-50/80 font-bold text-neutral-600 border-b border-neutral-200">
                  <tr>
                    <th className="p-3 border-r border-neutral-200 text-left pl-4">Size</th>
                    {Object.keys(activeChart.rows[0].measurements).map((key) => (
                      <th key={key} className="p-3 border-r border-neutral-200 uppercase whitespace-nowrap">
                        {key} ({unit === 'IN' ? 'in' : 'cm'})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {activeChart.rows.map((row) => (
                    <tr key={row.size} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="p-3 border-r border-neutral-200 font-extrabold text-neutral-900 text-left pl-4">
                        {row.size}
                      </td>
                      {Object.keys(activeChart.rows[0].measurements).map((key) => (
                        <td key={key} className="p-3 border-r border-neutral-200 text-neutral-700 font-medium">
                          {convertValue(row.measurements[key], (activeChart.unit?.toUpperCase() === 'CM' ? 'CM' : 'IN'))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs">
                <thead className="bg-neutral-50/80 font-bold text-neutral-600 border-b border-neutral-200">
                  <tr>
                    <th className="p-3 border-r border-neutral-200 text-left pl-4">Size</th>
                    <th className="p-3 border-r border-neutral-200">Bust ({unit === 'IN' ? 'in' : 'cm'})</th>
                    <th className="p-3 border-r border-neutral-200">Waist ({unit === 'IN' ? 'in' : 'cm'})</th>
                    <th className="p-3 border-r border-neutral-200">Hip ({unit === 'IN' ? 'in' : 'cm'})</th>
                    <th className="p-3 border-r border-neutral-200">Shoulder ({unit === 'IN' ? 'in' : 'cm'})</th>
                    <th className="p-3">Length ({unit === 'IN' ? 'in' : 'cm'})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {DEFAULT_ETHNIC_SIZES.map((row) => (
                    <tr key={row.size} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="p-3 border-r border-neutral-200 font-extrabold text-neutral-900 text-left pl-4">
                        {row.size}
                      </td>
                      <td className="p-3 border-r border-neutral-200 text-neutral-700 font-medium">{convertValue(row.bust, 'IN')}</td>
                      <td className="p-3 border-r border-neutral-200 text-neutral-700 font-medium">{convertValue(row.waist, 'IN')}</td>
                      <td className="p-3 border-r border-neutral-200 text-neutral-700 font-medium">{convertValue(row.hip, 'IN')}</td>
                      <td className="p-3 border-r border-neutral-200 text-neutral-700 font-medium">{convertValue(row.shoulder, 'IN')}</td>
                      <td className="p-3 text-neutral-700 font-medium">{convertValue(row.length, 'IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info & Custom Tailoring reminder */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-[11px] text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            Standard fit includes 1-2 inch breathing ease
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto bg-[#0284c7] hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
