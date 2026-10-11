import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export interface ExtractedProductData {
  name: string;
  shortDescription: string;
  description: string;
  type: 'READYMADE' | 'CUSTOM' | 'UNSTITCHED';
  gender: 'WOMEN' | 'GIRLS' | 'UNISEX';
  ageGroup: 'ADULTS' | 'TEENS' | 'KIDS' | 'INFANTS';
  season: string;
  occasion: string;
  suggestedCategory: string;
  suggestedSubCategory: string;
  collections: string[];
  tags: string[];
  hsnCode: string;
  taxPercentage: number;
  taxInclusive: boolean;
  basePrice: number;
  salePrice?: number;
  costPrice?: number;
  colorName: string;
  colorHex: string;
  attributes: {
    fabric?: string;
    weave?: string;
    pattern?: string;
    border?: string;
    care?: string;
    [key: string]: string | undefined;
  };
  sizes: Array<{
    size: string;
    stock: number;
    sku: string;
  }>;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  isNewArrival: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  isExclusive: boolean;
  channel: 'STORE' | 'ONLINE' | 'BOTH';
  suggestedQuestions: Array<{
    key: string;
    question: string;
    options: string[];
  }>;
}

export interface CopilotChatResponse {
  reply: string;
  suggestedOptions?: string[];
}

export const productCopilotService = {
  async analyzePhoto(images: Array<{ url?: string; base64?: string; mimeType?: string }>, hintCategory?: string): Promise<ExtractedProductData> {
    const res = await apiClient.post<StandardResponse<ExtractedProductData>>('/ai/copilot/analyze-photo', {
      images,
      hintCategory,
    });
    return res.data.data!;
  },

  async chat(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, currentProductState?: Record<string, any>): Promise<CopilotChatResponse> {
    const res = await apiClient.post<StandardResponse<CopilotChatResponse>>('/ai/copilot/chat', {
      messages,
      currentProductState,
    });
    return res.data.data!;
  },
};
