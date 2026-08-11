'use client';

import { useToast } from '@/components/toast/ToastProvider';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useKnowledgeSource,
  useChunks,
  useIndexingStatus,
  useReindex,
} from '@/features/rag-agent/rag-agent.hooks';
import {
  Brain,
  ArrowLeft,
  RefreshCw,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

export default function RagKnowledgeDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const id = params.id as string;

  const { data: source, isLoading, error, refetch } = useKnowledgeSource(id);
  const reindexMutation = useReindex();

  const [chunkPage, setChunkPage] = useState(1);
  const { data: chunksData, isLoading: chunksLoading, refetch: refetchChunks } = useChunks(id, chunkPage, 20);

  const [activeTab, setActiveTab] = useState<'overview' | 'chunks'>('overview');
  const [selectedChunk, setSelectedChunk] = useState<string | null>(null);

  // Set up polling while status is processing/pending
  const isTerminalState =
    source?.status === 'INDEXED' ||
    source?.status === 'FAILED' ||
    source?.status === 'DRAFT' ||
    source?.status === 'ARCHIVED';

  // Use separate status indicator query to poll status in background
  const { data: statusCheck } = useIndexingStatus(id, !isTerminalState ? 3000 : false);

  // Trigger page refetch on status update from polling
  React.useEffect(() => {
    if (statusCheck && statusCheck.status !== source?.status) {
      refetch();
      refetchChunks();
    }
  }, [statusCheck, source, refetch, refetchChunks]);

  if (isLoading) {
    return <SectionLoader message="Loading knowledge source details..." />;
  }

  if (error || !source) {
    return (
      <PageError
        title="Knowledge Source Load Failure"
        message="Could not retrieve source parameters from database."
        retry={refetch}
      />
    );
  }

  const handleForceReindex = async () => {
    try {
      await reindexMutation.mutateAsync(source.id);
      toast('success', 'Re-index queued', 'Manual re-indexing job queued.');
      refetch();
      refetchChunks();
    } catch {}
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'INDEXED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
          <CheckCircle2 className="h-3.5 w-3.5" /> INDEXED
        </span>
      );
    }
    if (s === 'PROCESSING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> PROCESSING
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <XCircle className="h-3.5 w-3.5" /> FAILED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
        <HelpCircle className="h-3.5 w-3.5" /> PENDING
      </span>
    );
  };

  const chunks = chunksData?.data || [];
  const chunkMeta = chunksData?.meta || { total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/ai/rag/knowledge"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to knowledge base
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-600 shadow-sm">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{source.name}</h1>
              <p className="text-xs font-mono text-neutral-400 mt-0.5">{source.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {renderStatusBadge(source.status)}
            <button
              onClick={handleForceReindex}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Force Reindex
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-6 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 border-b-2 transition-all
              ${
                activeTab === 'overview'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }
            `}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('chunks')}
            className={`pb-4 border-b-2 transition-all
              ${
                activeTab === 'chunks'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }
            `}
          >
            Text Chunks ({chunkMeta.total})
          </button>
        </nav>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm md:col-span-2 space-y-4">
            <h3 className="font-bold text-neutral-900 border-b border-neutral-50 pb-2">Source Information</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-neutral-400 uppercase">Source Type</span>
                <p className="font-semibold text-neutral-800 mt-1">{source.sourceType}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase">Created Date</span>
                <p className="font-semibold text-neutral-800 mt-1">{new Date(source.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase">Last Indexed</span>
                <p className="font-semibold text-neutral-800 mt-1">
                  {source.lastIndexedAt ? new Date(source.lastIndexedAt).toLocaleString() : 'Never'}
                </p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase">Embedding Dimension</span>
                <p className="font-semibold text-neutral-800 mt-1">1536 (Gemini / OpenAI Default)</p>
              </div>
            </div>

            {source.sourceUrl && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-neutral-400 uppercase">Crawl Target URL</span>
                <p className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 text-xs font-mono text-neutral-700 truncate">
                  {source.sourceUrl}
                </p>
              </div>
            )}

            {source.indexingError && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-red-500 uppercase">Indexing Error Log</span>
                <pre className="p-4 bg-red-50 rounded-lg border border-red-100 text-xs text-red-700 font-mono whitespace-pre-wrap">
                  {source.indexingError}
                </pre>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm md:col-span-1 space-y-4 h-fit">
            <h3 className="font-bold text-neutral-900 border-b border-neutral-50 pb-2">Vector Metadata</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 bg-neutral-50 text-neutral-500">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Total Chunks Ingested</p>
                  <h4 className="text-lg font-bold text-neutral-900 mt-0.5">{chunkMeta.total} chunks</h4>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 bg-neutral-50 text-neutral-500">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Average Chunk Size</p>
                  <h4 className="text-sm font-bold text-neutral-900 mt-0.5">~1,000 characters</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chunks tab */}
      {activeTab === 'chunks' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
            {chunksLoading ? (
              <div className="p-8 text-center text-xs text-neutral-400">Loading document chunks...</div>
            ) : chunks.length > 0 ? (
              <div className="divide-y divide-neutral-100 text-neutral-700">
                {chunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="p-4 hover:bg-neutral-50/50 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4 cursor-pointer"
                    onClick={() => setSelectedChunk(chunk.content)}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-600">
                          Chunk #{chunk.chunkIndex + 1}
                        </span>
                        <span className="text-[10px] text-neutral-400">Tokens: {chunk.tokenCount}</span>
                      </div>
                      <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                        {chunk.content}
                      </p>
                    </div>
                    <button className="text-[10px] font-semibold text-neutral-400 group-hover:text-black border rounded px-2 py-1 self-start sm:self-center bg-white hover:bg-neutral-50">
                      Inspect
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-neutral-400">
                No text chunks found for this source. Ensure indexing was successful.
              </div>
            )}

            {/* Pagination */}
            {chunkMeta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/50 px-4 py-3">
                <span className="text-xs text-neutral-500">
                  Page {chunkPage} of {chunkMeta.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChunkPage(Math.max(1, chunkPage - 1))}
                    disabled={chunkPage === 1}
                    className="rounded border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="h-3 w-3" /> Previous
                  </button>
                  <button
                    onClick={() => setChunkPage(Math.min(chunkMeta.totalPages, chunkPage + 1))}
                    disabled={chunkPage === chunkMeta.totalPages}
                    className="rounded border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    Next <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* INSPECT CHUNK DIALOG */}
      {selectedChunk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-neutral-900">Inspect Chunk Text</h3>
              <button
                onClick={() => setSelectedChunk(null)}
                className="text-xs text-neutral-400 hover:text-neutral-900"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-neutral-700 whitespace-pre-wrap font-mono bg-neutral-50 p-4 rounded-lg border border-neutral-100 max-h-96 overflow-y-auto leading-relaxed">
                {selectedChunk}
              </p>
              <div className="border-t border-neutral-50 pt-3 flex justify-between text-[11px] text-neutral-400 font-semibold">
                <span>EMBEDDING VECTOR DIMENSIONS: 1536</span>
                <span>STATUS: ACTIVE VECTORS STORED</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
