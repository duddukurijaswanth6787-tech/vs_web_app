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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getStartDate(period) {
        const now = new Date();
        switch (period) {
            case 'daily':
                return new Date(now.setHours(0, 0, 0, 0));
            case 'weekly':
                return new Date(now.setDate(now.getDate() - 7));
            case 'yearly':
                return new Date(now.setFullYear(now.getFullYear() - 1));
            case 'monthly':
            default:
                return new Date(now.setDate(now.getDate() - 30));
        }
    }
    async getOmnichannelOverview(period = 'monthly') {
        const startDate = this.getStartDate(period);
        const orders = await this.prisma.order.findMany({
            where: {
                createdAt: { gte: startDate },
                status: { notIn: ['CANCELLED'] },
                deletedAt: null,
            },
            select: {
                id: true,
                orderNumber: true,
                grandTotal: true,
                channel: true,
                createdAt: true,
            },
        });
        let offlineRev = 0;
        let offlineCount = 0;
        let onlineRev = 0;
        let onlineCount = 0;
        orders.forEach((o) => {
            const total = Number(o.grandTotal || 0);
            if (o.channel === client_1.OrderChannel.POS_SHOPORA) {
                offlineRev += total;
                offlineCount += 1;
            }
            else {
                onlineRev += total;
                onlineCount += 1;
            }
        });
        const totalRevenue = offlineRev + onlineRev;
        const totalOrders = offlineCount + onlineCount;
        const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
        const offlineShare = totalRevenue > 0 ? Math.round((offlineRev / totalRevenue) * 100) : 50;
        const onlineShare = totalRevenue > 0 ? Math.round((onlineRev / totalRevenue) * 100) : 50;
        const trendMap = {};
        orders.forEach((o) => {
            const dateKey = new Date(o.createdAt).toISOString().split('T')[0];
            if (!trendMap[dateKey]) {
                trendMap[dateKey] = { offline: 0, online: 0 };
            }
            const val = Number(o.grandTotal || 0);
            if (o.channel === client_1.OrderChannel.POS_SHOPORA) {
                trendMap[dateKey].offline += val;
            }
            else {
                trendMap[dateKey].online += val;
            }
        });
        const labels = Object.keys(trendMap).sort();
        const offlineRevenue = labels.map((l) => Math.round(trendMap[l].offline));
        const onlineRevenue = labels.map((l) => Math.round(trendMap[l].online));
        return {
            period,
            totalRevenue: Math.round(totalRevenue),
            totalOrders,
            averageOrderValue,
            offlineSales: {
                revenue: Math.round(offlineRev),
                ordersCount: offlineCount,
                sharePercentage: offlineShare,
            },
            onlineSales: {
                revenue: Math.round(onlineRev),
                ordersCount: onlineCount,
                sharePercentage: onlineShare,
            },
            trend: {
                labels: labels.length > 0 ? labels : ['Today'],
                offlineRevenue: offlineRevenue.length > 0 ? offlineRevenue : [offlineRev],
                onlineRevenue: onlineRevenue.length > 0 ? onlineRevenue : [onlineRev],
            },
        };
    }
    async getOfflinePosAnalytics(period = 'monthly') {
        const startDate = this.getStartDate(period);
        const posOrders = await this.prisma.order.findMany({
            where: {
                createdAt: { gte: startDate },
                channel: client_1.OrderChannel.POS_SHOPORA,
                status: { notIn: ['CANCELLED'] },
                deletedAt: null,
            },
            include: {
                payments: true,
            },
        });
        let totalRevenue = 0;
        const paymentMap = {
            CASH: { amount: 0, count: 0 },
            CARD: { amount: 0, count: 0 },
            UPI: { amount: 0, count: 0 },
            QUOTATION: { amount: 0, count: 0 },
        };
        const dailyMap = {};
        posOrders.forEach((o) => {
            const val = Number(o.grandTotal || 0);
            totalRevenue += val;
            const dateKey = new Date(o.createdAt).toISOString().split('T')[0];
            if (!dailyMap[dateKey])
                dailyMap[dateKey] = { revenue: 0, transactions: 0 };
            dailyMap[dateKey].revenue += val;
            dailyMap[dateKey].transactions += 1;
            if (o.payments && o.payments.length > 0) {
                o.payments.forEach((p) => {
                    const method = String(p.provider || o.paymentMethod || 'CASH').toUpperCase();
                    if (!paymentMap[method])
                        paymentMap[method] = { amount: 0, count: 0 };
                    paymentMap[method].amount += Number(p.amount || 0);
                    paymentMap[method].count += 1;
                });
            }
            else {
                const pm = String(o.paymentMethod || 'CASH').toUpperCase();
                if (!paymentMap[pm])
                    paymentMap[pm] = { amount: 0, count: 0 };
                paymentMap[pm].amount += val;
                paymentMap[pm].count += 1;
            }
        });
        const totalTransactions = posOrders.length;
        const averageBasketValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;
        const byPaymentMethod = Object.keys(paymentMap).map((method) => {
            const amt = Math.round(paymentMap[method].amount);
            const cnt = paymentMap[method].count;
            const pct = totalRevenue > 0 ? Math.round((amt / totalRevenue) * 100) : 0;
            return { method, amount: amt, count: cnt, percentage: pct };
        });
        const dailyTrend = Object.keys(dailyMap)
            .sort()
            .map((date) => ({
            date,
            revenue: Math.round(dailyMap[date].revenue),
            transactions: dailyMap[date].transactions,
        }));
        return {
            period,
            totalRevenue: Math.round(totalRevenue),
            totalTransactions,
            averageBasketValue,
            byPaymentMethod,
            dailyTrend,
        };
    }
    async getOnlineSalesAnalytics(period = 'monthly') {
        const startDate = this.getStartDate(period);
        const onlineOrders = await this.prisma.order.findMany({
            where: {
                createdAt: { gte: startDate },
                channel: client_1.OrderChannel.ONLINE_STORE,
                deletedAt: null,
            },
            include: {
                payments: true,
            },
        });
        let totalRevenue = 0;
        let validCount = 0;
        let returnedCount = 0;
        const statusMap = {};
        const gatewayMap = {
            RAZORPAY: { amount: 0, successCount: 0, totalCount: 0 },
            ONLINE: { amount: 0, successCount: 0, totalCount: 0 },
        };
        onlineOrders.forEach((o) => {
            const val = Number(o.grandTotal || 0);
            statusMap[o.status] = (statusMap[o.status] || 0) + 1;
            if (o.status !== 'CANCELLED') {
                totalRevenue += val;
                validCount += 1;
            }
            if (o.status === 'RETURNED' || o.status === 'REFUNDED') {
                returnedCount += 1;
            }
            o.payments.forEach((p) => {
                const provider = String(p.provider || 'RAZORPAY').toUpperCase();
                if (!gatewayMap[provider])
                    gatewayMap[provider] = { amount: 0, successCount: 0, totalCount: 0 };
                gatewayMap[provider].totalCount += 1;
                if (p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID') {
                    gatewayMap[provider].amount += Number(p.amount || 0);
                    gatewayMap[provider].successCount += 1;
                }
            });
        });
        const averageOrderValue = validCount > 0 ? Math.round(totalRevenue / validCount) : 0;
        const returnRatePercentage = onlineOrders.length > 0 ? Math.round((returnedCount / onlineOrders.length) * 100) : 0;
        const paymentGatewayBreakdown = Object.keys(gatewayMap).map((provider) => {
            const g = gatewayMap[provider];
            const rate = g.totalCount > 0 ? Math.round((g.successCount / g.totalCount) * 100) : 100;
            return {
                provider,
                amount: Math.round(g.amount),
                successRate: rate,
            };
        });
        const shippingStatusBreakdown = Object.keys(statusMap).map((status) => ({
            status,
            count: statusMap[status],
        }));
        return {
            period,
            totalRevenue: Math.round(totalRevenue),
            totalOrders: validCount,
            averageOrderValue,
            paymentGatewayBreakdown,
            shippingStatusBreakdown,
            returnRatePercentage,
        };
    }
    async getInventoryVelocityAnalytics() {
        const products = await this.prisma.product.findMany({
            where: { deletedAt: null },
            include: {
                categories: {
                    include: {
                        category: true,
                    },
                },
                variants: {
                    include: {
                        inventory: true,
                    },
                },
                orderItems: {
                    where: {
                        order: {
                            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                            status: { notIn: ['CANCELLED'] },
                        },
                    },
                },
            },
        });
        let totalStockUnits = 0;
        const categoryMap = {};
        const velocityList = products.map((p) => {
            const stock = p.variants.reduce((sum, v) => sum + (v.inventory?.availableQuantity || 0), 0);
            totalStockUnits += stock;
            const unitsSold = p.orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
            const dailyVelocity = Math.round((unitsSold / 30) * 10) / 10;
            const firstCat = p.categories[0]?.category?.name;
            const catName = firstCat || 'General Apparels';
            if (!categoryMap[catName])
                categoryMap[catName] = { totalStock: 0, unitsSold: 0 };
            categoryMap[catName].totalStock += stock;
            categoryMap[catName].unitsSold += unitsSold;
            const daysRemaining = dailyVelocity > 0 ? Math.round(stock / dailyVelocity) : 999;
            let classification = 'REGULAR';
            if (dailyVelocity >= 0.5 || unitsSold >= 5) {
                classification = 'FAST_MOVING';
            }
            else if (dailyVelocity === 0 && stock > 20) {
                classification = 'SLOW_MOVING';
            }
            let stockoutRisk = 'HEALTHY';
            if (stock === 0) {
                stockoutRisk = 'CRITICAL';
            }
            else if (daysRemaining <= 7) {
                stockoutRisk = 'WARNING';
            }
            return {
                productId: p.id,
                name: p.name,
                sku: p.sku || `SKU-${p.id.slice(0, 6)}`,
                categoryName: catName,
                currentStock: stock,
                unitsSold,
                dailyVelocity,
                estimatedDaysRemaining: daysRemaining,
                classification,
                stockoutRisk,
            };
        });
        const fastMoving = velocityList.filter((v) => v.classification === 'FAST_MOVING');
        const slowMoving = velocityList.filter((v) => v.classification === 'SLOW_MOVING');
        const criticalStockouts = velocityList.filter((v) => v.stockoutRisk === 'CRITICAL' || v.stockoutRisk === 'WARNING');
        velocityList.sort((a, b) => b.unitsSold - a.unitsSold);
        const topVelocityProducts = velocityList.slice(0, 5);
        velocityList.sort((a, b) => a.unitsSold - b.unitsSold);
        const slowVelocityProducts = velocityList.slice(0, 5);
        const categoryStockDistribution = Object.keys(categoryMap).map((cat) => ({
            categoryName: cat,
            totalStock: categoryMap[cat].totalStock,
            unitsSold: categoryMap[cat].unitsSold,
        }));
        return {
            totalCatalogProducts: products.length,
            totalStockUnits,
            fastMovingCount: fastMoving.length,
            slowMovingCount: slowMoving.length,
            criticalStockoutsCount: criticalStockouts.length,
            topVelocityProducts,
            slowVelocityProducts,
            categoryStockDistribution,
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map