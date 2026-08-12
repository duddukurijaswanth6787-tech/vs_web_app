export type ReportType = 'SALES' | 'INVENTORY' | 'CUSTOMER' | 'ORDER'
  | 'PRODUCTS' | 'COUPONS' | 'RETURNS' | 'PAYMENTS' | 'TAX' | 'SHIPPING' | 'CATEGORIES' | 'BRANDS' | 'REVIEWS';
export type ExportFormat = 'CSV' | 'EXCEL';

export interface GenerateReportDto {
  type: ReportType;
  startDate?: string;
  endDate?: string;
  format?: ExportFormat;
}

export interface ReportOrderItem {
  productName: string;
  quantity: number;
  totalPrice?: number;
}

export interface SalesReportOrder {
  id: string;
  orderNumber: string;
  grandTotal: number;
  status: string;
  createdAt: string;
  items?: ReportOrderItem[];
}

export interface SalesReportData {
  totalRevenue: number;
  totalOrders: number;
  orders: SalesReportOrder[];
}

export interface OrderReportData {
  totalOrders: number;
  statusBreakdown: Record<string, number>;
  orders: SalesReportOrder[];
}

export interface InventoryReportItem {
  id: string;
  quantity: number;
  reservedQuantity: number;
  stockStatus: string;
  variant?: {
    sku?: string;
    title?: string;
    product?: { name?: string };
  };
}

export interface InventoryReportData {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  items: InventoryReportItem[];
}

export interface CustomerReportRow {
  id: string;
  phone?: string;
  orderCount: number;
  totalSpent: number;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export interface CustomerReportData {
  totalCustomers: number;
  customers: CustomerReportRow[];
}

export interface ListReportResponse<T = unknown> {
  type: string;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
  };
  generatedAt: string;
}

export type ReportData =
  | SalesReportData
  | OrderReportData
  | InventoryReportData
  | CustomerReportData
  | ListReportResponse['data'];

export interface ReportResponse<T extends ReportData = ReportData> {
  type: string;
  data: T;
  generatedAt: string;
}

export interface ExportJob {
  id: string;
  type: string;
  format: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fileUrl?: string;
  error?: string;
  createdAt: string;
}

export interface ExportJobResponse {
  id: string;
  type: string;
  format: string;
  status: string;
  fileUrl?: string;
  createdAt: string;
}
