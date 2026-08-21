export interface PopularSearch {
  query: string;
  count: number;
  lastSearchedAt: string;
}

export interface PopularProductRecommendation {
  productId: string;
  productName: string;
  category: string;
  recommendationCount: number;
  conversionRate: number;
}

export interface AiAnalyticsOverview {
  totalQueries: number;
  activeChatSessions: number;
  searchConversionRate: number;
  topSearchKeywords: PopularSearch[];
}
