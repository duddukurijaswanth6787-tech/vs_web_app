export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface OmnichannelSummary {
  period: AnalyticsPeriod;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  offlineSales: {
    revenue: number;
    ordersCount: number;
    sharePercentage: number;
  };
  onlineSales: {
    revenue: number;
    ordersCount: number;
    sharePercentage: number;
  };
  trend: {
    labels: string[];
    offlineRevenue: number[];
    onlineRevenue: number[];
  };
}

export interface OfflinePosAnalytics {
  period: AnalyticsPeriod;
  totalRevenue: number;
  totalTransactions: number;
  averageBasketValue: number;
  byPaymentMethod: Array<{
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  dailyTrend: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
}

export interface OnlineSalesAnalytics {
  period: AnalyticsPeriod;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  paymentGatewayBreakdown: Array<{
    provider: string;
    amount: number;
    successRate: number;
  }>;
  shippingStatusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  returnRatePercentage: number;
}

export interface ProductVelocityItem {
  productId: string;
  name: string;
  sku: string;
  categoryName: string;
  currentStock: number;
  unitsSold: number;
  dailyVelocity: number; // units sold per day
  estimatedDaysRemaining: number;
  classification: 'FAST_MOVING' | 'REGULAR' | 'SLOW_MOVING';
  stockoutRisk: 'CRITICAL' | 'WARNING' | 'HEALTHY';
}

export interface InventoryVelocityAnalytics {
  totalCatalogProducts: number;
  totalStockUnits: number;
  fastMovingCount: number;
  slowMovingCount: number;
  criticalStockoutsCount: number;
  topVelocityProducts: ProductVelocityItem[];
  slowVelocityProducts: ProductVelocityItem[];
  categoryStockDistribution: Array<{
    categoryName: string;
    totalStock: number;
    unitsSold: number;
  }>;
}
