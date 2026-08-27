import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto, UpdateWarehouseDto, WarehouseQueryDto, CreateLocationDto, AssignWarehouseInventoryDto, UpdateWarehouseInventoryDto, TransferStockDto } from './warehouse.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class WarehouseController {
    private readonly warehouseService;
    constructor(warehouseService: WarehouseService);
    findAll(query: WarehouseQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./warehouse.types").WarehouseResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findById(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<{
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
    }>>;
    getLocations(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<{
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
    }[]>>;
    getWarehouseInventory(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<({
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
    })[]>>;
    create(dto: CreateWarehouseDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./warehouse.types").WarehouseResponse>>;
    update(id: string, dto: UpdateWarehouseDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
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
    }>>;
    delete(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    restore(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
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
    }>>;
    createLocation(id: string, dto: CreateLocationDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
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
    }>>;
    assignInventory(id: string, dto: AssignWarehouseInventoryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
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
    }>>;
    updateInventoryCount(id: string, variantId: string, dto: UpdateWarehouseInventoryDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
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
    }>>;
    transferStock(dto: TransferStockDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        transferred: number;
        from: string;
        to: string;
    }>>;
}
