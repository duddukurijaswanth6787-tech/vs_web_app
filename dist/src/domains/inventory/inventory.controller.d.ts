import { InventoryService } from './inventory.service';
import { CreateInventoryDto, UpdateInventoryDto, AdjustStockDto, StockMovementDto, InventoryQueryDto, MovementQueryDto } from './inventory.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    findAll(query: InventoryQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./inventory.types").InventoryResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    getStockSummary(): Promise<import("@common/responses/response.builder").ResponsePayload<{
        totalItems: number;
        inStock: number;
        lowStock: number;
        outOfStock: number;
        totalAvailable: number;
        totalReserved: number;
    }>>;
    findMovements(query: MovementQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./inventory.types").InventoryMovementResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findById(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./inventory.types").InventoryResponse>>;
    findByVariantId(variantId: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./inventory.types").InventoryResponse>>;
    create(dto: CreateInventoryDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./inventory.types").InventoryResponse>>;
    update(id: string, dto: UpdateInventoryDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./inventory.types").InventoryResponse>>;
    increaseStock(id: string, dto: StockMovementDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./inventory.types").InventoryResponse>>;
    decreaseStock(id: string, dto: StockMovementDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./inventory.types").InventoryResponse>>;
    adjustStock(id: string, dto: AdjustStockDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./inventory.types").InventoryResponse>>;
    reserveStock(id: string, dto: StockMovementDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./inventory.types").InventoryResponse>>;
    releaseStock(id: string, dto: StockMovementDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./inventory.types").InventoryResponse>>;
    returnStock(id: string, dto: StockMovementDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./inventory.types").InventoryResponse>>;
    damageStock(id: string, dto: StockMovementDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./inventory.types").InventoryResponse>>;
}
