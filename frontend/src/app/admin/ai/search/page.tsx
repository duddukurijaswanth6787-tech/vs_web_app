'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Search, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { aiSearchApi, SearchSuggestions, SearchStats } from '@/features/ai-search/api/ai-search.api';
import { getApiErrorMessage } from '@/utils/api-error';

import { usePopularSearches } from '@/features/ai-analytics/ai-analytics.hooks';

export default function AdminAiSearchPage() {
  const [testQuery, setTestQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestions | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [stats, setStats] = useState<SearchStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await aiSearchApi.getStats();
      setStats(data);
    } catch (err) {
      setStatsError(getApiErrorMessage(err));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleTestSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await aiSearchApi.getSuggestions(testQuery);
      setSuggestions(res);
    } catch (err) {
      setSuggestions(null);
      setSearchError(getApiErrorMessage(err));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div suppressHydrationWarning className="p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2.5">
            <Search className="w-6 h-6 text-[#0284c7]" />
            <span>AI Search & Intent Analytics Portal</span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Test natural language product search, monitor trending search terms & zero-result query logs.
          </p>
        </div>

        <button
          onClick={loadStats}
          className="p-2 border border-neutral-300 rounded-xl hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-bold transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-neutral-500" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Trending Search Analytics Cards */}
      {statsError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-2 text-xs font-bold text-red-700">
          <AlertTriangle className="w-4 h-4" />
          <span>Failed to load search analytics: {statsError}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-neutral-500 block">Top Trending Query (30d)</span>
            {statsLoading ? (
              <span className="text-xs text-neutral-400">Loading...</span>
            ) : stats?.topQuery ? (
              <>
                <span className="text-xl font-bold text-[#0284c7] block truncate">&quot;{stats.topQuery.query}&quot;</span>
                <span className="text-[10px] text-emerald-600 font-bold block">{stats.topQuery.count} searches</span>
              </>
            ) : (
              <span className="text-xs text-neutral-400">No searches recorded yet</span>
            )}
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-neutral-500 block">Search Click-Through Rate</span>
            {statsLoading ? (
              <span className="text-xs text-neutral-400">Loading...</span>
            ) : (
              <>
                <span className="text-2xl font-black text-emerald-700">{stats?.clickThroughRate ?? 0}%</span>
                <span className="text-[10px] text-neutral-500 block">Last 30 days, {stats?.totalSearches ?? 0} searches</span>
              </>
            )}
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-neutral-500 block">Zero-Result Searches</span>
            {statsLoading ? (
              <span className="text-xs text-neutral-400">Loading...</span>
            ) : (
              <>
                <span className="text-2xl font-black text-amber-600">{stats?.zeroResultCount ?? 0} Queries</span>
                <span className="text-[10px] text-neutral-500 block">{stats?.zeroResultRate ?? 0}% of searches, last 30 days</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Test AI Search Console */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0284c7]" />
          <span>Test Semantic Vector Search Engine</span>
        </h2>

        <form onSubmit={handleTestSearch} className="flex gap-3 max-w-2xl">
          <input
            type="text"
            required
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="e.g. 'Red saree for evening wedding reception under 5000'"
            className="flex-1 border border-neutral-300 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-hidden focus:border-[#0284c7]"
          />

          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 bg-[#0284c7] hover:bg-[#0B3B78] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isSearching ? 'Testing...' : 'Test Query'}</span>
          </button>
        </form>

        {searchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Search request failed: {searchError}</span>
          </div>
        )}

        {suggestions && (
          <div className="pt-2 space-y-3">
            {suggestions.products.length === 0 &&
            suggestions.categories.length === 0 &&
            suggestions.brands.length === 0 ? (
              <span className="text-xs text-neutral-400 italic">No matching products, categories, or brands found for this query.</span>
            ) : (
              <>
                {suggestions.products.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-neutral-700 block">Matching Products:</span>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.products.map((p) => (
                        <span key={p.id} className="bg-sky-50 border border-sky-200 text-[#0284c7] text-xs font-bold px-3 py-1 rounded-full">
                          {p.name} &middot; ₹{p.price.toLocaleString('en-IN')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {suggestions.categories.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-neutral-700 block">Matching Categories:</span>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.categories.map((c) => (
                        <span key={c.id} className="bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-bold px-3 py-1 rounded-full">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {suggestions.brands.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-neutral-700 block">Matching Brands:</span>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.brands.map((b) => (
                        <span key={b.id} className="bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-bold px-3 py-1 rounded-full">
                          {b.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <PopularSearchesSection />
    </div>
  );
}

function PopularSearchesSection() {
  const { data: searches = [], isLoading } = usePopularSearches(10);

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
      <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#0284c7]" />
        <span>Popular Customer Search Queries</span>
      </h2>

      {isLoading ? (
        <div className="p-6 text-center text-xs text-neutral-400 font-medium">Loading search query analytics...</div>
      ) : searches.length === 0 ? (
        <div className="p-6 text-center text-xs text-neutral-500 bg-neutral-50 rounded-xl">No search query analytics recorded yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {searches.map((item, idx) => (
            <div key={idx} className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-900 block">&quot;{item.query}&quot;</span>
                <span className="text-[10px] text-neutral-500 block">Last searched: {new Date(item.lastSearchedAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <span className="text-xs font-bold text-[#0284c7] bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full">
                {item.count} searches
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

