export declare function calculateStockStatus(inventory: {
    availableQuantity: number;
    reservedQuantity: number;
    minimumStock: number;
    reorderLevel: number;
    allowBackorder: boolean;
}): string;
