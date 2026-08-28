"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OFFLINE = exports.ONLINE = void 0;
exports.buildSalesSeries = buildSalesSeries;
exports.parseGranularity = parseGranularity;
exports.parseChannel = parseChannel;
exports.ONLINE = 'ONLINE_STORE';
exports.OFFLINE = 'POS_SHOPORA';
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];
function startOfDay(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function startOfWeek(d) {
    const day = startOfDay(d);
    const shift = (day.getUTCDay() + 6) % 7;
    return new Date(day.getTime() - shift * DAY_MS);
}
function startOfMonth(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function bucketStart(d, granularity) {
    if (granularity === 'weekly')
        return startOfWeek(d);
    if (granularity === 'monthly')
        return startOfMonth(d);
    return startOfDay(d);
}
function isoWeek(d) {
    const thursday = new Date(startOfWeek(d).getTime() + 3 * DAY_MS);
    const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
    return (1 +
        Math.round((thursday.getTime() - startOfWeek(firstThursday).getTime()) /
            (7 * DAY_MS)));
}
function keyOf(start, granularity) {
    const y = start.getUTCFullYear();
    if (granularity === 'monthly') {
        return `${y}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
    }
    if (granularity === 'weekly') {
        return `${y}-W${String(isoWeek(start)).padStart(2, '0')}`;
    }
    return start.toISOString().slice(0, 10);
}
function labelOf(start, granularity) {
    const month = MONTHS[start.getUTCMonth()];
    if (granularity === 'monthly')
        return `${month} ${start.getUTCFullYear()}`;
    if (granularity === 'weekly')
        return `${month} ${start.getUTCDate()}`;
    return `${month} ${start.getUTCDate()}`;
}
function next(start, granularity) {
    if (granularity === 'monthly') {
        return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    }
    return new Date(start.getTime() + (granularity === 'weekly' ? 7 : 1) * DAY_MS);
}
function buildSalesSeries(orders, granularity, from, to) {
    const empty = (start) => ({
        bucket: keyOf(start, granularity),
        label: labelOf(start, granularity),
        onlineRevenue: 0,
        offlineRevenue: 0,
        onlineOrders: 0,
        offlineOrders: 0,
        totalRevenue: 0,
        totalOrders: 0,
    });
    const points = new Map();
    for (let cursor = bucketStart(from, granularity); cursor.getTime() <= to.getTime(); cursor = next(cursor, granularity)) {
        const point = empty(cursor);
        points.set(point.bucket, point);
    }
    for (const order of orders) {
        const start = bucketStart(order.createdAt, granularity);
        const key = keyOf(start, granularity);
        const point = points.get(key) ?? empty(start);
        points.set(key, point);
        const amount = Number(order.grandTotal ?? 0);
        const revenue = Number.isFinite(amount) ? amount : 0;
        if (order.channel === exports.OFFLINE) {
            point.offlineRevenue += revenue;
            point.offlineOrders += 1;
        }
        else {
            point.onlineRevenue += revenue;
            point.onlineOrders += 1;
        }
        point.totalRevenue += revenue;
        point.totalOrders += 1;
    }
    return Array.from(points.values()).sort((a, b) => a.bucket.localeCompare(b.bucket));
}
function parseGranularity(value) {
    return value === 'weekly' || value === 'monthly' ? value : 'daily';
}
function parseChannel(value) {
    return value === exports.ONLINE || value === exports.OFFLINE ? value : undefined;
}
//# sourceMappingURL=sales-series.js.map