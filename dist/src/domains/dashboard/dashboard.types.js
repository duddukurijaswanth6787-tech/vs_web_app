"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesChartResponse = exports.RecentActivityResponse = exports.PaymentAnalyticsResponse = exports.OrderAnalyticsResponse = exports.DashboardSummaryResponse = void 0;
const swagger_1 = require("@nestjs/swagger");
class DashboardSummaryResponse {
    totalOrders;
    totalRevenue;
    totalCustomers;
    totalProducts;
    pendingOrders;
    lowStockCount;
    recentOrders;
    topProducts;
    todayRevenue;
    todayOrders;
    todayItemsSold;
    averageOrderValue;
    categoriesCount;
    brandsCount;
    activeCoupons;
    lowStockProducts;
    outOfStockProducts;
    pendingReviews;
    returnsCount;
    cancelledOrders;
}
exports.DashboardSummaryResponse = DashboardSummaryResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "totalOrders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "totalRevenue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "totalCustomers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "totalProducts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "pendingOrders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "lowStockCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], DashboardSummaryResponse.prototype, "recentOrders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], DashboardSummaryResponse.prototype, "topProducts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "todayRevenue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "todayOrders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "todayItemsSold", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "averageOrderValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "categoriesCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "brandsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "activeCoupons", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "lowStockProducts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "outOfStockProducts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "pendingReviews", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "returnsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardSummaryResponse.prototype, "cancelledOrders", void 0);
class OrderAnalyticsResponse {
    statusBreakdown;
}
exports.OrderAnalyticsResponse = OrderAnalyticsResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], OrderAnalyticsResponse.prototype, "statusBreakdown", void 0);
class PaymentAnalyticsResponse {
    byMethod;
    totalRefunds;
    failedPayments;
}
exports.PaymentAnalyticsResponse = PaymentAnalyticsResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], PaymentAnalyticsResponse.prototype, "byMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PaymentAnalyticsResponse.prototype, "totalRefunds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PaymentAnalyticsResponse.prototype, "failedPayments", void 0);
class RecentActivityResponse {
    orders;
    products;
    customers;
    reviews;
}
exports.RecentActivityResponse = RecentActivityResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], RecentActivityResponse.prototype, "orders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], RecentActivityResponse.prototype, "products", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], RecentActivityResponse.prototype, "customers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], RecentActivityResponse.prototype, "reviews", void 0);
class SalesChartResponse {
    labels;
    data;
}
exports.SalesChartResponse = SalesChartResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], SalesChartResponse.prototype, "labels", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Number] }),
    __metadata("design:type", Array)
], SalesChartResponse.prototype, "data", void 0);
//# sourceMappingURL=dashboard.types.js.map