import { AuditService } from "../audit/audit.service";
import { WarehouseRepository } from './warehouse.repository';
import { CreateWarehouseDto, UpdateWarehouseDto, WarehouseQueryDto, WarehouseResponse, CreateLocationDto, AssignWarehouseInventoryDto, UpdateWarehouseInventoryDto, TransferStockDto } from './warehouse.types';
export declare class WarehouseService {
    private readonly warehouseRepository;
    private readonly auditService;
    constructor(warehouseRepository: WarehouseRepository, auditService: AuditService);
    private toResponse;
    findAll(query: WarehouseQueryDto): Promise<{
        data: WarehouseResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<{
        inventories: ({
            variant: {
                id: string;
                sku: string;
                title: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            variantId: string;
            availableQuantity: number;
            reservedQuantity: number;
            damagedQuantity: number;
            minimumStock: number;
            maximumStock: number;
            reorderLevel: number;
            warehouseId: string;
        })[];
        locations: {
            id: string;
            description: string | null;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            warehouseId: string;
            zone: string | null;
            rack: string | null;
            shelf: string | null;
            bin: string | null;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        address: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postalCode: string | null;
        contactPerson: string | null;
        phone: string | null;
        email: string | null;
        isDefault: boolean;
    }>;
    create(dto: CreateWarehouseDto, userId: string): Promise<WarehouseResponse>;
    update(id: string, dto: UpdateWarehouseDto, userId: string): Promise<{
        inventories: ({
            variant: {
                id: string;
                sku: string;
                title: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            variantId: string;
            availableQuantity: number;
            reservedQuantity: number;
            damagedQuantity: number;
            minimumStock: number;
            maximumStock: number;
            reorderLevel: number;
            warehouseId: string;
        })[];
        locations: {
            id: string;
            description: string | null;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            warehouseId: string;
            zone: string | null;
            rack: string | null;
            shelf: string | null;
            bin: string | null;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        address: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postalCode: string | null;
        contactPerson: string | null;
        phone: string | null;
        email: string | null;
        isDefault: boolean;
    }>;
    delete(id: string, userId: string): Promise<void>;
    restore(id: string, userId: string): Promise<{
        inventories: ({
            variant: {
                id: string;
                sku: string;
                title: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            variantId: string;
            availableQuantity: number;
            reservedQuantity: number;
            damagedQuantity: number;
            minimumStock: number;
            maximumStock: number;
            reorderLevel: number;
            warehouseId: string;
        })[];
        locations: {
            id: string;
            description: string | null;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            warehouseId: string;
            zone: string | null;
            rack: string | null;
            shelf: string | null;
            bin: string | null;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        address: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postalCode: string | null;
        contactPerson: string | null;
        phone: string | null;
        email: string | null;
        isDefault: boolean;
    }>;
    createLocation(id: string, dto: CreateLocationDto): Promise<{
        id: string;
        description: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        zone: string | null;
        rack: string | null;
        shelf: string | null;
        bin: string | null;
    }>;
    getLocations(id: string): Promise<{
        id: string;
        description: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        zone: string | null;
        rack: string | null;
        shelf: string | null;
        bin: string | null;
    }[]>;
    assignInventory(warehouseId: string, dto: AssignWarehouseInventoryDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        variantId: string;
        availableQuantity: number;
        reservedQuantity: number;
        damagedQuantity: number;
        minimumStock: number;
        maximumStock: number;
        reorderLevel: number;
        warehouseId: string;
    }>;
    updateWarehouseInventoryCount(warehouseId: string, variantId: string, dto: UpdateWarehouseInventoryDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        variantId: string;
        availableQuantity: number;
        reservedQuantity: number;
        damagedQuantity: number;
        minimumStock: number;
        maximumStock: number;
        reorderLevel: number;
        warehouseId: string;
    }>;
    getWarehouseInventory(warehouseId: string): Promise<({
        variant: {
            id: string;
            sku: string;
            title: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        variantId: string;
        availableQuantity: number;
        reservedQuantity: number;
        damagedQuantity: number;
        minimumStock: number;
        maximumStock: number;
        reorderLevel: number;
        warehouseId: string;
    })[]>;
    transferStock(dto: TransferStockDto, userId: string): Promise<{
        transferred: number;
        from: string;
        to: string;
    }>;
}
