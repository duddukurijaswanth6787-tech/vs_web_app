"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseStatus = exports.VariantStatus = exports.DiscountType = exports.PriceType = exports.AttributeType = exports.MediaType = exports.StockMovementType = exports.InventoryStatus = exports.ProductChannel = exports.ProductVisibility = exports.AgeGroup = exports.GenderType = exports.ProductType = exports.ProductStatus = void 0;
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["DRAFT"] = "DRAFT";
    ProductStatus["ACTIVE"] = "ACTIVE";
    ProductStatus["INACTIVE"] = "INACTIVE";
    ProductStatus["ARCHIVED"] = "ARCHIVED";
    ProductStatus["DISCONTINUED"] = "DISCONTINUED";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var ProductType;
(function (ProductType) {
    ProductType["READYMADE"] = "READYMADE";
    ProductType["CUSTOM"] = "CUSTOM";
    ProductType["UNSTITCHED"] = "UNSTITCHED";
})(ProductType || (exports.ProductType = ProductType = {}));
var GenderType;
(function (GenderType) {
    GenderType["WOMEN"] = "WOMEN";
    GenderType["GIRLS"] = "GIRLS";
    GenderType["UNISEX"] = "UNISEX";
})(GenderType || (exports.GenderType = GenderType = {}));
var AgeGroup;
(function (AgeGroup) {
    AgeGroup["ADULTS"] = "ADULTS";
    AgeGroup["TEENS"] = "TEENS";
    AgeGroup["KIDS"] = "KIDS";
    AgeGroup["INFANTS"] = "INFANTS";
})(AgeGroup || (exports.AgeGroup = AgeGroup = {}));
var ProductVisibility;
(function (ProductVisibility) {
    ProductVisibility["VISIBLE"] = "VISIBLE";
    ProductVisibility["HIDDEN"] = "HIDDEN";
    ProductVisibility["SEARCHABLE"] = "SEARCHABLE";
})(ProductVisibility || (exports.ProductVisibility = ProductVisibility = {}));
var ProductChannel;
(function (ProductChannel) {
    ProductChannel["STORE"] = "STORE";
    ProductChannel["ONLINE"] = "ONLINE";
    ProductChannel["BOTH"] = "BOTH";
})(ProductChannel || (exports.ProductChannel = ProductChannel = {}));
var InventoryStatus;
(function (InventoryStatus) {
    InventoryStatus["IN_STOCK"] = "IN_STOCK";
    InventoryStatus["LOW_STOCK"] = "LOW_STOCK";
    InventoryStatus["OUT_OF_STOCK"] = "OUT_OF_STOCK";
    InventoryStatus["BACKORDERED"] = "BACKORDERED";
    InventoryStatus["DISCONTINUED"] = "DISCONTINUED";
})(InventoryStatus || (exports.InventoryStatus = InventoryStatus = {}));
var StockMovementType;
(function (StockMovementType) {
    StockMovementType["PURCHASE_ORDER"] = "PURCHASE_ORDER";
    StockMovementType["SALES_ORDER"] = "SALES_ORDER";
    StockMovementType["RETURN"] = "RETURN";
    StockMovementType["ADJUSTMENT"] = "ADJUSTMENT";
    StockMovementType["TRANSFER"] = "TRANSFER";
    StockMovementType["WRITE_OFF"] = "WRITE_OFF";
})(StockMovementType || (exports.StockMovementType = StockMovementType = {}));
var MediaType;
(function (MediaType) {
    MediaType["IMAGE"] = "IMAGE";
    MediaType["VIDEO"] = "VIDEO";
    MediaType["DOCUMENT"] = "DOCUMENT";
    MediaType["MODEL_3D"] = "MODEL_3D";
    MediaType["MAIN"] = "MAIN";
    MediaType["FRONT"] = "FRONT";
    MediaType["BACK"] = "BACK";
    MediaType["SIDE"] = "SIDE";
    MediaType["FABRIC"] = "FABRIC";
    MediaType["MODEL"] = "MODEL";
    MediaType["LIFESTYLE"] = "LIFESTYLE";
})(MediaType || (exports.MediaType = MediaType = {}));
var AttributeType;
(function (AttributeType) {
    AttributeType["TEXT"] = "TEXT";
    AttributeType["NUMBER"] = "NUMBER";
    AttributeType["BOOLEAN"] = "BOOLEAN";
    AttributeType["COLOR"] = "COLOR";
    AttributeType["DATE"] = "DATE";
    AttributeType["SELECT"] = "SELECT";
    AttributeType["MULTI_SELECT"] = "MULTI_SELECT";
    AttributeType["SIZE"] = "SIZE";
    AttributeType["IMAGE"] = "IMAGE";
    AttributeType["URL"] = "URL";
})(AttributeType || (exports.AttributeType = AttributeType = {}));
var PriceType;
(function (PriceType) {
    PriceType["BASE"] = "BASE";
    PriceType["SALE"] = "SALE";
    PriceType["WHOLESALE"] = "WHOLESALE";
})(PriceType || (exports.PriceType = PriceType = {}));
var DiscountType;
(function (DiscountType) {
    DiscountType["PERCENTAGE"] = "PERCENTAGE";
    DiscountType["FIXED_AMOUNT"] = "FIXED_AMOUNT";
    DiscountType["BUY_X_GET_Y"] = "BUY_X_GET_Y";
})(DiscountType || (exports.DiscountType = DiscountType = {}));
var VariantStatus;
(function (VariantStatus) {
    VariantStatus["ACTIVE"] = "ACTIVE";
    VariantStatus["INACTIVE"] = "INACTIVE";
    VariantStatus["OUT_OF_STOCK"] = "OUT_OF_STOCK";
})(VariantStatus || (exports.VariantStatus = VariantStatus = {}));
var WarehouseStatus;
(function (WarehouseStatus) {
    WarehouseStatus["ACTIVE"] = "ACTIVE";
    WarehouseStatus["INACTIVE"] = "INACTIVE";
    WarehouseStatus["MAINTENANCE"] = "MAINTENANCE";
})(WarehouseStatus || (exports.WarehouseStatus = WarehouseStatus = {}));
//# sourceMappingURL=commerce.enums.js.map