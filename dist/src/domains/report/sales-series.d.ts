export type Granularity = 'daily' | 'weekly' | 'monthly';
export declare const ONLINE = "ONLINE_STORE";
export declare const OFFLINE = "POS_SHOPORA";
export interface SeriesOrder {
    createdAt: Date;
    grandTotal: unknown;
    channel?: string | null;
}
export interface SeriesPoint {
    bucket: string;
    label: string;
    onlineRevenue: number;
    offlineRevenue: number;
    onlineOrders: number;
    offlineOrders: number;
    totalRevenue: number;
    totalOrders: number;
}
export declare function buildSalesSeries(orders: SeriesOrder[], granularity: Granularity, from: Date, to: Date): SeriesPoint[];
export declare function parseGranularity(value?: string): Granularity;
export declare function parseChannel(value?: string): string | undefined;
