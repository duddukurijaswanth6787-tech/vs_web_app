export interface SizeChartRow {
  id?: string;
  size: string;
  /** Measurement name to value, e.g. { Bust: 38, Waist: 34 }. */
  measurements: Record<string, number | string>;
  displayOrder?: number;
}

export interface SizeChartTemplateResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  garmentType?: string;
  unit: string;
  status: string;
  rows: SizeChartRow[];
  createdAt: string;
  updatedAt: string;
}

export interface SizeChartListResponse {
  data: SizeChartTemplateResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface SizeChartQueryDto {
  search?: string;
  garmentType?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateSizeChartTemplateDto {
  name: string;
  slug?: string;
  description?: string;
  garmentType?: string;
  unit?: string;
  rows?: SizeChartRow[];
}

export interface UpdateSizeChartTemplateDto {
  name?: string;
  description?: string;
  garmentType?: string;
  unit?: string;
  status?: string;
  /** When present, replaces every row on the template. */
  rows?: SizeChartRow[];
}

/**
 * Default measurement columns for Indian womenswear. A template can carry any
 * keys — these are only what a new chart starts with.
 */
export const DEFAULT_MEASUREMENTS = [
  'Bust',
  'Waist',
  'Hip',
  'Shoulder',
  'Length',
  'Sleeve Length',
  'Bottom Length',
];

export const GARMENT_TYPES = [
  'Kurta Set',
  'Anarkali',
  'Saree Blouse',
  'Lehenga',
  'Dress',
  'Salwar Suit',
  'Co-ord Set',
  'Gown',
  'Top',
];
