import { ApiProperty } from '@nestjs/swagger';

export class DashboardSummaryResponse {
  @ApiProperty() totalOrders!: number;
  @ApiProperty() totalRevenue!: number;
  @ApiProperty() totalCustomers!: number;
  @ApiProperty() totalProducts!: number;
  @ApiProperty() pendingOrders!: number;
  @ApiProperty() lowStockCount!: number;
  @ApiProperty({ type: [Object] }) recentOrders!: any[];
  @ApiProperty({ type: [Object] }) topProducts!: any[];
  @ApiProperty() todayRevenue!: number;
  @ApiProperty() todayOrders!: number;
  @ApiProperty() todayItemsSold!: number;
  @ApiProperty() averageOrderValue!: number;
  @ApiProperty() categoriesCount!: number;
  @ApiProperty() brandsCount!: number;
  @ApiProperty() activeCoupons!: number;
  @ApiProperty() lowStockProducts!: number;
  @ApiProperty() outOfStockProducts!: number;
  @ApiProperty() pendingReviews!: number;
  @ApiProperty() returnsCount!: number;
  @ApiProperty() cancelledOrders!: number;
}

export class OrderAnalyticsResponse {
  @ApiProperty({ type: [Object] }) statusBreakdown!: {
    status: string;
    count: number;
  }[];
}

export class PaymentAnalyticsResponse {
  @ApiProperty({ type: [Object] }) byMethod!: {
    method: string;
    revenue: number;
    count: number;
  }[];
  @ApiProperty() totalRefunds!: number;
  @ApiProperty() failedPayments!: number;
}

export class RecentActivityResponse {
  @ApiProperty({ type: [Object] }) orders!: any[];
  @ApiProperty({ type: [Object] }) products!: any[];
  @ApiProperty({ type: [Object] }) customers!: any[];
  @ApiProperty({ type: [Object] }) reviews!: any[];
}

export class SalesChartResponse {
  @ApiProperty({ type: [String] }) labels!: string[];
  @ApiProperty({ type: [Number] }) data!: number[];
}
