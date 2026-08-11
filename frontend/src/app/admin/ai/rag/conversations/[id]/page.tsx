'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useConversationDetails,
} from '@/features/rag-agent/rag-agent.hooks';
import type { RagToolExecution } from '@/features/rag-agent/rag-agent.types';
import {
  Bot,
  User,
  ArrowLeft,
  Calendar,
  Clock,
  Shield,
  Layers,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

export default function RagConversationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error, refetch } = useConversationDetails(id, 1, 50);

  const [selectedCitation, setSelectedCitation] = useState<{ sourceTitle: string | null; excerpt: string | null } | null>(null);
  const [selectedToolCall, setSelectedToolCall] = useState<RagToolExecution | null>(null);

  if (isLoading) {
    return <SectionLoader message="Loading conversation message history..." />;
  }

  if (error || !data) {
    return (
      <PageError
        title="Conversation History Load Failure"
        message="Could not retrieve conversation logs from the database."
        retry={refetch}
      />
    );
  }

  const { conversation, messages } = data;
  const chatMessages = messages?.data || [];

  // Redact secrets in JSON tool inputs/outputs
  const redactSecrets = (obj: unknown): string => {
    if (!obj) return '';
    try {
      const copy = JSON.parse(JSON.stringify(obj)) as unknown;
      const sensitiveKeys = ['password', 'token', 'authorization', 'cookie', 'secret', 'apiKey', 'accessKey', 'refreshToken', 'signedUrl'];
      
      const traverse = (item: unknown) => {
        if (typeof item === 'object' && item !== null) {
          const record = item as Record<string, unknown>;
          for (const key in record) {
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
              record[key] = '[REDACTED]';
            } else {
              traverse(record[key]);
            }
          }
        }
      };
      traverse(copy);
      return JSON.stringify(copy, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/ai/rag/conversations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to conversations
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 pb-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-neutral-400" /> Chat Session log
            </h1>
            <p className="text-xs font-mono text-neutral-400">{conversation.id}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Started: {new Date(conversation.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Activity: {new Date(conversation.lastMessageAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Conversation Stream */}
        <div className="lg:col-span-3 space-y-4">
          {chatMessages.length > 0 ? (
            chatMessages.map((msg) => {
              const isUser = msg.senderType === 'USER';
              return (
                <div
                  key={msg.id}
                  className={`rounded-xl border p-5 shadow-sm space-y-3
                    ${
                      isUser
                        ? 'border-neutral-200 bg-white ml-12'
                        : 'border-purple-100 bg-purple-50/10 mr-12'
                    }
                  `}
                >
                  <div className="flex items-center justify-between border-b border-neutral-100/50 pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`rounded p-1
                        ${isUser ? 'bg-neutral-100 text-neutral-600' : 'bg-purple-100 text-purple-600'}
                      `}>
                        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                      </div>
                      <span className="text-xs font-bold text-neutral-900">
                        {isUser ? 'User / Customer' : `${conversation.agent?.name || 'RAG Assistant'}`}
                      </span>
                    </div>
                    {!isUser && (
                      <div className="flex items-center gap-3 text-[10px] text-neutral-400 font-semibold uppercase">
                        {msg.latencyMs && (
                          <span>Latency: {(msg.latencyMs / 1000).toFixed(2)}s</span>
                        )}
                        {msg.relevanceScore && (
                          <span>Relevance: {(msg.relevanceScore * 100).toFixed(1)}%</span>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>

                  {/* Message Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                        Knowledge Citations used:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((cite) => (
                          <button
                            key={cite.id}
                            onClick={() => setSelectedCitation({ sourceTitle: cite.sourceTitle, excerpt: cite.excerpt })}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/60 transition-colors"
                          >
                            <Shield className="h-3 w-3" /> {cite.sourceTitle || 'Source excerpt'} ({(cite.relevanceScore ? cite.relevanceScore * 100 : 90).toFixed(0)}%)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-neutral-400 border border-dashed rounded-xl">
              No message logs found in this conversation stream.
            </div>
          )}
        </div>

        {/* Sidebar: Tool Executions Log */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4 h-fit">
            <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-50 pb-2">Tool calls log</h3>
            {conversation.toolExecutions && conversation.toolExecutions.length > 0 ? (
              <div className="space-y-3">
                {conversation.toolExecutions.map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => setSelectedToolCall(tool)}
                    className="p-3 border border-neutral-100 hover:border-neutral-200 rounded-lg bg-neutral-50/50 cursor-pointer transition-all hover:bg-neutral-50 flex flex-col justify-between gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-neutral-800 font-mono truncate">{tool.toolName}</span>
                      {tool.status === 'SUCCESS' ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-neutral-400 font-semibold">
                      <span>Duration: {tool.durationMs ?? 'N/A'}ms</span>
                      <span>{new Date(tool.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 py-4 text-center">
                No tool executions occurred in this chat session.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* INSPECT CITATION DIALOG */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-neutral-900">Knowledge Base Citation Source</h3>
              <button
                onClick={() => setSelectedCitation(null)}
                className="text-xs text-neutral-400 hover:text-neutral-900"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
                <span>TITLE: {selectedCitation.sourceTitle || 'Return Policy Document'}</span>
                <span>MATCH: VECTOR RETRIEVAL</span>
              </div>
              <p className="text-xs text-neutral-700 whitespace-pre-wrap font-mono bg-neutral-50 p-4 rounded-lg border border-neutral-100 leading-relaxed">
                {'"'}{selectedCitation.excerpt}{'"'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT TOOL CALL DIALOG */}
      {selectedToolCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-neutral-900">Tool execution inspector</h3>
              <button
                onClick={() => setSelectedToolCall(null)}
                className="text-xs text-neutral-400 hover:text-neutral-900"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-neutral-400 uppercase">Tool Name</span>
                  <p className="font-mono font-bold text-neutral-800 mt-1">{selectedToolCall.toolName}</p>
                </div>
                <div>
                  <span className="font-bold text-neutral-400 uppercase">Status</span>
                  <p className={`font-bold mt-1 ${selectedToolCall.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedToolCall.status}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-neutral-400 uppercase">Duration</span>
                  <p className="font-semibold text-neutral-800 mt-1">{selectedToolCall.durationMs ?? 'N/A'} ms</p>
                </div>
                <div>
                  <span className="font-bold text-neutral-400 uppercase">Trigger Time</span>
                  <p className="font-semibold text-neutral-800 mt-1">{new Date(selectedToolCall.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-neutral-400 uppercase">Redacted Input Parameters</span>
                <pre className="p-3 bg-neutral-950 rounded-lg text-neutral-200 text-xs font-mono overflow-x-auto">
                  {redactSecrets(selectedToolCall.input)}
                </pre>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-neutral-400 uppercase">Redacted Execution Output</span>
                <pre className="p-3 bg-neutral-950 rounded-lg text-neutral-200 text-xs font-mono overflow-x-auto">
                  {redactSecrets(selectedToolCall.output)}
                </pre>
              </div>

              {selectedToolCall.errorMessage && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-red-500 uppercase">Execution Error Details</span>
                  <pre className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs font-mono">
                    {selectedToolCall.errorMessage} ({selectedToolCall.errorCode})
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
