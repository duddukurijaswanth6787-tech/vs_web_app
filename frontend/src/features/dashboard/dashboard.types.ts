export interface RecentOrder {
  id: string;
  orderNumber: string;
  grandTotal: number;
  status: string;
  createdAt: string;
}

export interface TopProductSum {
  quantity: number | null;
  totalPrice: number | null;
}

export interface TopProductInfo {
  id: string;
  name: string;
  slug: string;
}

export interface TopProduct {
  productId: string;
  _sum: TopProductSum;
  product: TopProductInfo | null;
}

export interface DashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockCount: number;
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
  todayRevenue: number;
  todayOrders: number;
  averageOrderValue: number;
  categoriesCount: number;
  brandsCount: number;
  activeCoupons: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  pendingReviews: number;
  returnsCount: number;
  cancelledOrders: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  revenue: number;
  count: number;
}

export interface OrderAnalytics {
  statusBreakdown: StatusCount[];
}

export interface PaymentAnalytics {
  byMethod: PaymentMethodBreakdown[];
  totalRefunds: number;
  failedPayments: number;
}

export interface RecentActivityOrder {
  id: string;
  orderNumber: string;
  grandTotal: number;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface RecentActivityProduct {
  id: string;
  name: string;
  slug?: string;
  [key: string]: unknown;
}

export interface RecentActivityReview {
  id: string;
  rating: number;
  comment?: string;
  [key: string]: unknown;
}

export interface RecentActivity {
  orders: RecentActivityOrder[];
  products: RecentActivityProduct[];
  customers: RecentActivityOrder[];
  reviews: RecentActivityReview[];
}

export interface SalesChartData {
  labels: string[];
  data: number[];
}
