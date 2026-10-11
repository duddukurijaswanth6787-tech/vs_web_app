export interface AnalyzeProductImageDto {
  images: Array<{
    url?: string;
    base64?: string;
    mimeType?: string;
  }>;
  hintCategory?: string;
}

export interface CopilotChatDto {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  currentProductState?: Record<string, any>;
}

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
