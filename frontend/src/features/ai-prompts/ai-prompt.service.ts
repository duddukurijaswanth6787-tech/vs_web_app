import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export type PromptType =
  | 'PRODUCT_TITLE'
  | 'PRODUCT_DESCRIPTION'
  | 'SHORT_DESCRIPTION'
  | 'SEO_TITLE'
  | 'META_DESCRIPTION'
  | 'IMAGE_GENERATION'
  | 'IMAGE_ALT_TEXT'
  | 'SOCIAL_CAPTION';

export interface PromptTemplate {
  type: PromptType;
  name: string;
  template: string;
  rules: string;
  status: 'ACTIVE' | 'INACTIVE';
  version: number;
  updatedAt: string;
  updatedBy?: string;
}

export interface PromptTemplatesPayload {
  templates: PromptTemplate[];
  variables: string[];
  /** Server-owned; appended to every prompt so a template cannot drop it. */
  accuracyRule: string;
}

export const aiPromptService = {
  async list(): Promise<PromptTemplatesPayload> {
    const res = await apiClient.get<StandardResponse<PromptTemplatesPayload>>('/admin/ai/prompts');
    return res.data.data!;
  },
  async update(type: PromptType, body: Partial<PromptTemplate>): Promise<PromptTemplate> {
    const res = await apiClient.patch<StandardResponse<PromptTemplate>>(`/admin/ai/prompts/${type}`, body);
    return res.data.data!;
  },
  async history(type: PromptType): Promise<PromptTemplate[]> {
    const res = await apiClient.get<StandardResponse<PromptTemplate[]>>(`/admin/ai/prompts/${type}/history`);
    return res.data.data!;
  },
  async reset(type: PromptType): Promise<PromptTemplate> {
    const res = await apiClient.post<StandardResponse<PromptTemplate>>(`/admin/ai/prompts/${type}/reset`, {});
    return res.data.data!;
  },
};
