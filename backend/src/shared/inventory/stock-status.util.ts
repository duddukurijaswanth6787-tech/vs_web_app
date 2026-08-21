/**
 * Single source of truth for the IN_STOCK/LOW_STOCK/OUT_OF_STOCK/BACKORDER
 * status shown across admin, POS, and the storefront. Shared so every path
 * that mutates stock (InventoryService's manual actions, and
 * OrderWorkflowService's order/POS-driven reserve/deduct/restore) computes
 * the same status the same way instead of drifting.
 */
export function calculateStockStatus(inventory: {
  availableQuantity: number;
  reservedQuantity: number;
  minimumStock: number;
  reorderLevel: number;
  allowBackorder: boolean;
}): string {
  const available = inventory.availableQuantity - inventory.reservedQuantity;
  if (available <= 0) return inventory.allowBackorder ? 'BACKORDER' : 'OUT_OF_STOCK';
  if (inventory.minimumStock > 0 && available <= inventory.minimumStock) return 'LOW_STOCK';
  if (inventory.reorderLevel > 0 && available <= inventory.reorderLevel) return 'LOW_STOCK';
  return 'IN_STOCK';
}
