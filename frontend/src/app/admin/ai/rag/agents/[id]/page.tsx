'use client';

import { useToast } from '@/components/toast/ToastProvider';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useRagAgent,
  useUpdateRagAgent,
  useUpdateAgentStatus,
  useConfigureTools,
  useAssignKnowledgeSources,
  useKnowledgeSources,
  useAgentAnalytics,
} from '@/features/rag-agent/rag-agent.hooks';
import {
  Bot,
  ArrowLeft,
  BarChart3,
  Clock,
  ThumbsUp,
} from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

const AVAILABLE_TOOLS = [
  { id: 'PRODUCT_SEARCH', label: 'Product Search', desc: 'Search catalog products' },
  { id: 'PRODUCT_DETAILS', label: 'Product Details', desc: 'Get pricing & dimensions spec' },
  { id: 'PRODUCT_AVAILABILITY', label: 'Product Availability', desc: 'Real-time variant stock' },
  { id: 'ORDER_STATUS', label: 'Order Status', desc: 'Verify customer orders' },
  { id: 'ORDER_TRACKING', label: 'Order Tracking', desc: 'Shipment timelines status' },
  { id: 'RETURN_STATUS', label: 'Return Status', desc: 'Process return requests' },
];

export default function RagAgentDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const id = params.id as string;

  const { data: agent, isLoading, error, refetch } = useRagAgent(id);
  const { data: sourcesData } = useKnowledgeSources(1, 100);
  const { data: metrics } = useAgentAnalytics(id);

  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'knowledge' | 'tools' | 'metrics'>('overview');

  // Configure Tools state
  const [selectedTools, setSelectedTools] = useState<string[]>(agent?.tools || []);
  const [isSavingTools, setIsSavingTools] = useState(false);

  // Assign Knowledge state
  const [selectedSources, setSelectedSources] = useState<string[]>(
    agent?.knowledgeSources?.map((ks) => ks.knowledgeSourceId) || []
  );
  const [isSavingSources, setIsSavingSources] = useState(false);

  // Configuration edit state — reset when agent id changes (React docs: adjust state during render)
  const [prevAgentId, setPrevAgentId] = useState(agent?.id);
  const [temp, setTemp] = useState(agent?.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(agent?.maxTokens ?? 1024);
  const [systemRole, setSystemRole] = useState(agent?.systemRole || '');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Mutations
  const updateAgent = useUpdateRagAgent();
  const updateStatus = useUpdateAgentStatus();
  const configureTools = useConfigureTools();
  const assignSources = useAssignKnowledgeSources();

  if (agent && agent.id !== prevAgentId) {
    setPrevAgentId(agent.id);
    setTemp(agent.temperature);
    setMaxTokens(agent.maxTokens);
    setSystemRole(agent.systemRole || '');
    setSelectedTools(agent.tools || []);
    setSelectedSources(agent.knowledgeSources?.map((ks) => ks.knowledgeSourceId) || []);
  }

  if (isLoading) {
    return <SectionLoader message="Loading agent configuration details..." />;
  }

  if (error || !agent) {
    return (
      <PageError
        title="Agent Details Load Failure"
        message="Agent metadata could not be fetched from the database."
        retry={refetch}
      />
    );
  }

  const handleToggleStatus = async () => {
    const action = agent.isActive ? 'DEACTIVATE' : 'ACTIVATE';
    await updateStatus.mutateAsync({ id: agent.id, action });
    refetch();
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      await updateAgent.mutateAsync({
        id: agent.id,
        dto: { temperature: temp, maxTokens, systemRole },
      });
      toast('success', 'Configuration updated');
      refetch();
    } catch {}
    setIsSavingConfig(false);
  };

  const handleSaveTools = async () => {
    setIsSavingTools(true);
    try {
      await configureTools.mutateAsync({ id: agent.id, tools: selectedTools });
      toast('success', 'Tools updated');
      refetch();
    } catch {}
    setIsSavingTools(false);
  };

  const handleSaveSources = async () => {
    setIsSavingSources(true);
    try {
      await assignSources.mutateAsync({ id: agent.id, knowledgeSourceIds: selectedSources });
      toast('success', 'Knowledge sources saved');
      refetch();
    } catch {}
    setIsSavingSources(false);
  };

  const toggleTool = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      setSelectedTools(selectedTools.filter((t) => t !== toolId));
    } else {
      setSelectedTools([...selectedTools, toolId]);
    }
  };

  const toggleSource = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      setSelectedSources(selectedSources.filter((s) => s !== sourceId));
    } else {
      setSelectedSources([...selectedSources, sourceId]);
    }
  };

  const sources = sourcesData?.data || [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/ai/rag/agents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to agents
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-purple-100 bg-purple-50 p-3 text-purple-600 shadow-sm">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{agent.name}</h1>
              <p className="text-xs font-mono text-neutral-400 mt-0.5">{agent.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleStatus}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all border
                ${
                  agent.isActive
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-neutral-100 text-neutral-500 border-neutral-300'
                }
              `}
            >
              {agent.isActive ? 'Active' : 'Inactive'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-6 text-xs font-bold uppercase tracking-wider">
          {(['overview', 'config', 'knowledge', 'tools', 'metrics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 border-b-2 transition-all
                ${
                  activeTab === tab
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm md:col-span-2 space-y-4">
            <h3 className="font-bold text-neutral-900 border-b border-neutral-50 pb-2">Agent Details</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-neutral-400 uppercase">Agent Key</span>
                <p className="font-semibold text-neutral-800 mt-1">{agent.agentKey}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase">Description</span>
                <p className="font-semibold text-neutral-800 mt-1">{agent.description || 'No description provided.'}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase">LLM Provider</span>
                <p className="font-semibold text-neutral-800 capitalize mt-1">{agent.modelProvider}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase">Model</span>
                <p className="font-semibold text-neutral-800 font-mono mt-1">{agent.model}</p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-bold text-neutral-400 uppercase">System Prompt Instructions</span>
              <pre className="p-4 bg-neutral-50 rounded-lg border border-neutral-100 text-xs text-neutral-700 whitespace-pre-wrap font-sans leading-relaxed">
                {agent.systemRole || 'No system role instructions configured.'}
              </pre>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm md:col-span-1 space-y-4 h-fit">
            <h3 className="font-bold text-neutral-900 border-b border-neutral-50 pb-2">Enabled Extensions</h3>
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Tools Mapped</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {agent.tools && agent.tools.length > 0 ? (
                    agent.tools.map((tool) => (
                      <span key={tool} className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-100">
                        {tool}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-400">No tools enabled.</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Knowledge Sources Assigned</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {agent.knowledgeSources && agent.knowledgeSources.length > 0 ? (
                    agent.knowledgeSources.map((ks) => (
                      <span key={ks.knowledgeSourceId} className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {ks.knowledgeSource?.name || ks.knowledgeSourceId}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-400">No knowledge sources assigned.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-5 max-w-2xl">
          <h3 className="font-bold text-neutral-900 border-b border-neutral-50 pb-2">Configuration Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase">Generation Temperature</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={temp}
                onChange={(e) => setTemp(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none"
              />
              <p className="text-[10px] text-neutral-400">Higher values generate more creative answers.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase">Max Output Tokens</label>
              <input
                type="number"
                min="1"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none"
              />
              <p className="text-[10px] text-neutral-400">Tokens generation response limit.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase">System Role/Instructions</label>
            <textarea
              value={systemRole}
              onChange={(e) => setSystemRole(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none h-40 font-sans leading-relaxed"
              placeholder="System instructions..."
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-neutral-100">
            <button
              type="submit"
              disabled={isSavingConfig}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {isSavingConfig ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'knowledge' && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-5 max-w-2xl">
          <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
            <h3 className="font-bold text-neutral-900">Knowledge Base Assignment</h3>
            <button
              onClick={handleSaveSources}
              disabled={isSavingSources}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {isSavingSources ? 'Saving...' : 'Save Assignments'}
            </button>
          </div>

          <div className="space-y-2">
            {sources.length > 0 ? (
              sources.map((source) => {
                const isChecked = selectedSources.includes(source.id);
                return (
                  <div
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer
                      ${
                        isChecked
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-neutral-100 hover:bg-neutral-50/50'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by div click
                      className="mt-1 h-3.5 w-3.5 accent-emerald-600 border-neutral-300 rounded"
                    />
                    <div>
                      <span className="text-xs font-bold text-neutral-800">{source.name}</span>
                      <div className="flex gap-2 mt-1">
                        <span className="inline-block px-1 rounded text-[9px] font-mono font-bold bg-neutral-100 text-neutral-600">
                          {source.sourceType}
                        </span>
                        <span className="inline-block px-1 rounded text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700">
                          {source.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-neutral-400 py-6 text-center">
                No knowledge sources configured yet in system.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tools' && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-5 max-w-2xl">
          <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
            <h3 className="font-bold text-neutral-900">Configure Enabled Tools</h3>
            <button
              onClick={handleSaveTools}
              disabled={isSavingTools}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {isSavingTools ? 'Saving...' : 'Save Tools'}
            </button>
          </div>

          <div className="space-y-2">
            {AVAILABLE_TOOLS.map((tool) => {
              const isChecked = selectedTools.includes(tool.id);
              return (
                <div
                  key={tool.id}
                  onClick={() => toggleTool(tool.id)}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer
                    ${
                      isChecked
                        ? 'border-purple-200 bg-purple-50/20'
                        : 'border-neutral-100 hover:bg-neutral-50/50'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // handled by div click
                    className="mt-1 h-3.5 w-3.5 accent-purple-600 border-neutral-300 rounded"
                  />
                  <div>
                    <span className="text-xs font-bold text-neutral-800">{tool.label}</span>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{tool.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Queries</span>
                <div className="rounded-lg border border-neutral-100 p-1.5 text-neutral-500">
                  <BarChart3 className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mt-3">{metrics?.totalRequests ?? 0}</h3>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Avg Latency</span>
                <div className="rounded-lg border border-neutral-100 p-1.5 text-neutral-500">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mt-3">
                {metrics?.averageLatencyMs ? `${(metrics.averageLatencyMs / 1000).toFixed(2)}s` : 'N/A'}
              </h3>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Avg Relevance</span>
                <div className="rounded-lg border border-neutral-100 p-1.5 text-neutral-500">
                  <ThumbsUp className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mt-3">
                {metrics?.averageRelevanceScore ? `${(metrics.averageRelevanceScore * 100).toFixed(1)}%` : 'N/A'}
              </h3>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm max-w-lg">
            <h3 className="font-bold text-neutral-900 border-b border-neutral-50 pb-2">Status Breakdown</h3>
            <div className="space-y-3 mt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Successful executions</span>
                <span className="font-bold text-green-600">{metrics?.successfulRequests ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Failed executions</span>
                <span className="font-bold text-red-600">{metrics?.failedRequests ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
