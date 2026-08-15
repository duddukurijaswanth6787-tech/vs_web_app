import { apiClient, getUnprefixedBaseUrl } from '@/lib/api/client';
import { PaginationMeta, StandardResponse } from '@/types/api.types';
import { SystemHealth } from '@/features/operations/operations.types';
import {
  RagAgent,
  CreateAgentDto,
  UpdateAgentDto,
  TestAgentDto,
  TestAgentResponse,
  ReindexResponse,
  KnowledgeSource,
  CreateKnowledgeSourceDto,
  UpdateKnowledgeSourceDto,
  UploadUrlRequestDto,
  ConfirmUploadDto,
  KnowledgeChunkListResponse,
  RagConversation,
  RagMessage,
  RagSummaryAnalytics,
  RagAgentPerformanceSummary,
  IndexingStatusResponse,
} from './rag-agent.types';

export const ragAgentService = {
  // ─── Agents ────────────────────────────────────────────────
  getAgents: async (page = 1, limit = 10): Promise<{ data: RagAgent[]; meta: PaginationMeta }> => {
    const response = await apiClient.get<StandardResponse<{ data: RagAgent[]; meta: PaginationMeta }>>(
      '/admin/rag/agents',
      {
        params: { page, limit },
      }
    );
    return response.data.data!;
  },

  getAgentById: async (id: string): Promise<RagAgent> => {
    const response = await apiClient.get<StandardResponse<RagAgent>>(`/admin/rag/agents/${id}`);
    return response.data.data!;
  },

  createAgent: async (dto: CreateAgentDto): Promise<RagAgent> => {
    const response = await apiClient.post<StandardResponse<RagAgent>>('/admin/rag/agents', dto);
    return response.data.data!;
  },

  updateAgent: async (id: string, dto: UpdateAgentDto): Promise<RagAgent> => {
    const response = await apiClient.put<StandardResponse<RagAgent>>(`/admin/rag/agents/${id}`, dto);
    return response.data.data!;
  },

  deleteAgent: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/rag/agents/${id}`);
  },

  restoreAgent: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/rag/agents/${id}/restore`);
  },

  updateAgentStatus: async (id: string, action: 'ACTIVATE' | 'DEACTIVATE'): Promise<RagAgent> => {
    const response = await apiClient.put<StandardResponse<RagAgent>>(`/admin/rag/agents/${id}/status`, { action });
    return response.data.data!;
  },

  assignKnowledgeSources: async (id: string, knowledgeSourceIds: string[]): Promise<RagAgent> => {
    const response = await apiClient.put<StandardResponse<RagAgent>>(`/admin/rag/agents/${id}/knowledge-sources`, {
      knowledgeSourceIds,
    });
    return response.data.data!;
  },

  configureTools: async (id: string, tools: string[]): Promise<RagAgent> => {
    const response = await apiClient.put<StandardResponse<RagAgent>>(`/admin/rag/agents/${id}/tools`, { tools });
    return response.data.data!;
  },

  testAgent: async (id: string, dto: TestAgentDto): Promise<TestAgentResponse> => {
    const response = await apiClient.post<StandardResponse<TestAgentResponse>>(`/admin/rag/agents/${id}/test`, dto);
    return response.data.data!;
  },

  // ─── Knowledge Sources ─────────────────────────────────────
  getKnowledgeSources: async (
    page = 1,
    limit = 10
  ): Promise<{ data: KnowledgeSource[]; meta: PaginationMeta }> => {
    const response = await apiClient.get<StandardResponse<{ data: KnowledgeSource[]; meta: PaginationMeta }>>(
      '/admin/rag/knowledge-sources',
      { params: { page, limit } }
    );
    return response.data.data!;
  },

  getKnowledgeSourceById: async (id: string): Promise<KnowledgeSource> => {
    const response = await apiClient.get<StandardResponse<KnowledgeSource>>(`/admin/rag/knowledge-sources/${id}`);
    return response.data.data!;
  },

  createKnowledgeSource: async (dto: CreateKnowledgeSourceDto): Promise<KnowledgeSource> => {
    const response = await apiClient.post<StandardResponse<KnowledgeSource>>('/admin/rag/knowledge-sources', dto);
    return response.data.data!;
  },

  updateKnowledgeSource: async (id: string, dto: UpdateKnowledgeSourceDto): Promise<KnowledgeSource> => {
    const response = await apiClient.put<StandardResponse<KnowledgeSource>>(`/admin/rag/knowledge-sources/${id}`, dto);
    return response.data.data!;
  },

  deleteKnowledgeSource: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/rag/knowledge-sources/${id}`);
  },

  restoreKnowledgeSource: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/rag/knowledge-sources/${id}/restore`);
  },

  getUploadUrl: async (dto: UploadUrlRequestDto): Promise<{ uploadUrl: string; s3Key: string }> => {
    const response = await apiClient.post<StandardResponse<{ uploadUrl: string; s3Key: string }>>(
      '/admin/rag/knowledge-sources/upload-url',
      dto
    );
    return response.data.data!;
  },

  confirmUpload: async (id: string, dto: ConfirmUploadDto): Promise<KnowledgeSource> => {
    const response = await apiClient.post<StandardResponse<KnowledgeSource>>(
      `/admin/rag/knowledge-sources/${id}/confirm-upload`,
      dto
    );
    return response.data.data!;
  },

  reindex: async (id: string): Promise<ReindexResponse> => {
    const response = await apiClient.post<StandardResponse<ReindexResponse>>(
      `/admin/rag/knowledge-sources/${id}/reindex`
    );
    return response.data.data!;
  },

  getIndexingStatus: async (id: string): Promise<IndexingStatusResponse> => {
    const response = await apiClient.get<StandardResponse<IndexingStatusResponse>>(
      `/admin/rag/knowledge-sources/${id}/indexing-status`
    );
    return response.data.data!;
  },

  getChunks: async (id: string, page = 1, limit = 20): Promise<KnowledgeChunkListResponse> => {
    const response = await apiClient.get<StandardResponse<KnowledgeChunkListResponse>>(
      `/admin/rag/knowledge-sources/${id}/chunks`,
      { params: { page, limit } }
    );
    return response.data.data!;
  },

  // ─── Conversations ─────────────────────────────────────────
  getConversations: async (
    page = 1,
    limit = 10
  ): Promise<{ data: RagConversation[]; meta: PaginationMeta }> => {
    const response = await apiClient.get<StandardResponse<{ data: RagConversation[]; meta: PaginationMeta }>>(
      '/admin/rag/conversations',
      { params: { page, limit } }
    );
    return response.data.data!;
  },

  getConversationDetails: async (
    id: string,
    page = 1,
    limit = 20
  ): Promise<{ conversation: RagConversation; messages: { data: RagMessage[]; meta: PaginationMeta } }> => {
    const response = await apiClient.get<
      StandardResponse<{ conversation: RagConversation; messages: { data: RagMessage[]; meta: PaginationMeta } }>
    >(`/admin/rag/conversations/${id}`, { params: { page, limit } });
    return response.data.data!;
  },

  // ─── Analytics & Health ─────────────────────────────────────
  getSummaryAnalytics: async (): Promise<RagSummaryAnalytics> => {
    const response = await apiClient.get<StandardResponse<RagSummaryAnalytics>>('/admin/rag/analytics/summary');
    return response.data.data!;
  },

  getAgentAnalytics: async (agentId: string): Promise<RagAgentPerformanceSummary> => {
    const response = await apiClient.get<StandardResponse<RagAgentPerformanceSummary>>(
      `/admin/rag/analytics/agents/${agentId}`
    );
    return response.data.data!;
  },

  getIntents: async (): Promise<Array<{ intent: string; count: number }>> => {
    const response = await apiClient.get<StandardResponse<Array<{ intent: string; count: number }>>>(
      '/admin/rag/analytics/intents'
    );
    return response.data.data!;
  },

  getHealth: async (): Promise<SystemHealth> => {
    // /health is excluded from the backend's api/v1 global prefix and lives
    // at the origin root, so the versioned baseURL has to be stripped for
    // this one call - otherwise every request 404s and the Integration
    // Health panel misreads that as every subsystem being down.
    const response = await apiClient.get<SystemHealth>('/health', {
      baseURL: getUnprefixedBaseUrl(),
    });
    return response.data;
  },
};
