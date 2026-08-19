export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
  DISCONTINUED = 'DISCONTINUED',
}

export enum ProductType {
  READYMADE = 'READYMADE',
  CUSTOM = 'CUSTOM',
  UNSTITCHED = 'UNSTITCHED',
}

export enum GenderType {
  WOMEN = 'WOMEN',
  GIRLS = 'GIRLS',
  UNISEX = 'UNISEX',
}

export enum AgeGroup {
  ADULTS = 'ADULTS',
  TEENS = 'TEENS',
  KIDS = 'KIDS',
  INFANTS = 'INFANTS',
}

export enum ProductVisibility {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  SEARCHABLE = 'SEARCHABLE',
}

/** Where a product is sellable: the in-store POS register, the online storefront, or both. Stock is one shared pool regardless -- this only controls where the product is offered. */
export enum ProductChannel {
  STORE = 'STORE',
  ONLINE = 'ONLINE',
  BOTH = 'BOTH',
}

export enum InventoryStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  BACKORDERED = 'BACKORDERED',
  DISCONTINUED = 'DISCONTINUED',
}

export enum StockMovementType {
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  SALES_ORDER = 'SALES_ORDER',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
  WRITE_OFF = 'WRITE_OFF',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  MODEL_3D = 'MODEL_3D',
  /** Product gallery image roles (women's ethnic catalog) */
  MAIN = 'MAIN',
  FRONT = 'FRONT',
  BACK = 'BACK',
  SIDE = 'SIDE',
  FABRIC = 'FABRIC',
  MODEL = 'MODEL',
  LIFESTYLE = 'LIFESTYLE',
}

export enum AttributeType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  COLOR = 'COLOR',
  DATE = 'DATE',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  SIZE = 'SIZE',
  IMAGE = 'IMAGE',
  URL = 'URL',
}

export enum PriceType {
  BASE = 'BASE',
  SALE = 'SALE',
  WHOLESALE = 'WHOLESALE',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
}

export enum VariantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export enum WarehouseStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}
