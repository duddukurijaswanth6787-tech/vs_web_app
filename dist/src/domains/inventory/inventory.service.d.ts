import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notification/notification.service";
import { InventoryRepository } from './inventory.repository';
import { CreateInventoryDto, UpdateInventoryDto, AdjustStockDto, StockMovementDto, InventoryQueryDto, MovementQueryDto, InventoryResponse, InventoryMovementResponse } from './inventory.types';
export declare class InventoryService {
    private readonly inventoryRepository;
    private readonly auditService;
    private readonly notificationService;
    constructor(inventoryRepository: InventoryRepository, auditService: AuditService, notificationService: NotificationService);
    private toResponse;
    private toMovementResponse;
    private updateStockStatus;
    findAll(query: InventoryQueryDto): Promise<{
        data: InventoryResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<InventoryResponse>;
    findByVariantId(variantId: string): Promise<InventoryResponse>;
    create(dto: CreateInventoryDto, userId: string): Promise<InventoryResponse>;
    update(id: string, dto: UpdateInventoryDto, userId: string): Promise<InventoryResponse>;
    increaseStock(id: string, dto: StockMovementDto, userId: string): Promise<InventoryResponse>;
    decreaseStock(id: string, dto: StockMovementDto, userId: string): Promise<InventoryResponse>;
    adjustStock(id: string, dto: AdjustStockDto, userId: string): Promise<InventoryResponse>;
    reserveStock(id: string, dto: StockMovementDto, userId: string): Promise<InventoryResponse>;
    releaseStock(id: string, dto: StockMovementDto, userId: string): Promise<InventoryResponse>;
    returnStock(id: string, dto: StockMovementDto, userId: string): Promise<InventoryResponse>;
    damageStock(id: string, dto: StockMovementDto, userId: string): Promise<InventoryResponse>;
    findMovements(query: MovementQueryDto): Promise<{
        data: InventoryMovementResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    getStockSummary(): Promise<{
        totalItems: number;
        inStock: number;
        lowStock: number;
        outOfStock: number;
        totalAvailable: number;
        totalReserved: number;
    }>;
}
