export declare class DashboardSummaryResponse {
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    pendingOrders: number;
    lowStockCount: number;
    recentOrders: any[];
    topProducts: any[];
    todayRevenue: number;
    todayOrders: number;
    todayItemsSold: number;
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
export declare class OrderAnalyticsResponse {
    statusBreakdown: {
        status: string;
        count: number;
    }[];
}
export declare class PaymentAnalyticsResponse {
    byMethod: {
        method: string;
        revenue: number;
        count: number;
    }[];
    totalRefunds: number;
    failedPayments: number;
}
export declare class RecentActivityResponse {
    orders: any[];
    products: any[];
    customers: any[];
    reviews: any[];
}
export declare class SalesChartResponse {
    labels: string[];
    data: number[];
}
