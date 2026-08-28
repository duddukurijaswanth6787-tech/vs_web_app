"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateStockStatus = calculateStockStatus;
function calculateStockStatus(inventory) {
    const available = inventory.availableQuantity - inventory.reservedQuantity;
    if (available <= 0)
        return inventory.allowBackorder ? 'BACKORDER' : 'OUT_OF_STOCK';
    if (inventory.minimumStock > 0 && available <= inventory.minimumStock)
        return 'LOW_STOCK';
    if (inventory.reorderLevel > 0 && available <= inventory.reorderLevel)
        return 'LOW_STOCK';
    return 'IN_STOCK';
}
//# sourceMappingURL=stock-status.util.js.map