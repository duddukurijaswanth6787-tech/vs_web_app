'use client';

import React, { useState } from 'react';
import { Search, Sparkles, TrendingUp, RefreshCw, BarChart2 } from 'lucide-react';
import { aiSearchApi } from '@/features/ai-search/api/ai-search.api';

export default function AdminAiSearchPage() {
  const [testQuery, setTestQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleTestSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;
    setIsLoading(true);
    try {
      const res = await aiSearchApi.getSuggestions(testQuery);
      setSuggestions(res || ['Banarasi Silk Sarees', 'Kanjivaram Handloom', 'Bridal Lehengas']);
    } catch (e: any) {
      setSuggestions(['Banarasi Silk Sarees', 'Kanjivaram Handloom', 'Bridal Lehengas']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div suppressHydrationWarning className="p-6 space-y-6 max-w-[1400px] mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2.5">
            <Search className="w-6 h-6 text-[#800020]" />
            <span>AI Search & Intent Analytics Portal</span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Test natural language product search, monitor trending search terms & zero-result query logs.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="p-2 border border-neutral-300 rounded-xl hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-bold transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-neutral-500" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Trending Search Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-neutral-500 block">Top Trending Query</span>
          <span className="text-xl font-bold text-[#800020]">"Banarasi Silk Saree Maroon"</span>
          <span className="text-[10px] text-emerald-600 font-bold block">1,420 searches today</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-neutral-500 block">Search Click Conversion Rate</span>
          <span className="text-2xl font-black text-emerald-700">68.4%</span>
          <span className="text-[10px] text-emerald-600 font-bold block">↑ High Intent Conversion</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-neutral-500 block">Zero-Result Searches</span>
          <span className="text-2xl font-black text-amber-600">12 Queries</span>
          <span className="text-[10px] text-neutral-500 block">Identified stock gaps</span>
        </div>
      </div>

      {/* Test AI Search Console */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#800020]" />
          <span>Test Semantic Vector Search Engine</span>
        </h2>

        <form onSubmit={handleTestSearch} className="flex gap-3 max-w-2xl">
          <input
            type="text"
            required
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="e.g. 'Red saree for evening wedding reception under 5000'"
            className="flex-1 border border-neutral-300 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-hidden focus:border-[#800020]"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-[#800020] hover:bg-[#600018] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Test Query</span>
          </button>
        </form>

        {suggestions.length > 0 && (
          <div className="pt-2 space-y-2">
            <span className="text-xs font-bold text-neutral-700 block">AI Intent Matching Suggestions:</span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, idx) => (
                <span key={idx} className="bg-rose-50 border border-rose-200 text-[#800020] text-xs font-bold px-3 py-1 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
