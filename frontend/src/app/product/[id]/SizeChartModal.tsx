'use client';

import React from 'react';
import { X, Info } from 'lucide-react';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SizeChartModal({ isOpen, onClose }: SizeChartModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in relative">
        <button 
          type="button" 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-neutral-100 rounded-xl"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>
        <h4 className="text-base font-bold font-serif text-[#800020] flex items-center gap-2">
          <Info className="w-4 h-4" /> Size Chart & Measurements (Inches)
        </h4>
        <div className="overflow-hidden border border-neutral-200 rounded-xl text-xs">
          <table className="w-full text-center border-collapse">
            <thead className="bg-neutral-50 font-bold text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="p-2 border-r border-neutral-200">Size</th>
                <th className="p-2 border-r border-neutral-200">Bust</th>
                <th className="p-2 border-r border-neutral-200">Waist</th>
                <th className="p-2 border-r border-neutral-200">Hip</th>
                <th className="p-2">Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {[
                { size: 'XS', bust: 32, waist: 26, hip: 35, len: 48 },
                { size: 'S', bust: 34, waist: 28, hip: 38, len: 48 },
                { size: 'M', bust: 36, waist: 30, hip: 40, len: 48 },
                { size: 'L', bust: 38, waist: 32, hip: 42, len: 48 },
                { size: 'XL', bust: 40, waist: 34, hip: 44, len: 48 },
                { size: 'XXL', bust: 42, waist: 36, hip: 46, len: 48 }
              ].map((row) => (
                <tr key={row.size} className="hover:bg-neutral-50/50">
                  <td className="p-2 border-r border-neutral-200 font-bold text-neutral-900">{row.size}</td>
                  <td className="p-2 border-r border-neutral-200">{row.bust}</td>
                  <td className="p-2 border-r border-neutral-200">{row.waist}</td>
                  <td className="p-2 border-r border-neutral-200">{row.hip}</td>
                  <td className="p-2">{row.len}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-neutral-400 leading-relaxed text-center">
          *Measurements refer to body dimensions, not garment dimensions. Standard fit has 1-2 inches margin.
        </p>
      </div>
    </div>
  );
}
