import { LoggerService } from "../../common/logger/logger.service";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../database/prisma.service";
import { ProductVariantsRepository } from './product-variants.repository';
import { ProductsRepository } from "../products/products.repository";
import { CreateVariantDto, UpdateVariantDto, VariantQueryDto, VariantResponse, AssignAttributeValuesDto } from './product-variants.types';
export declare class ProductVariantsService {
    private readonly prisma;
    private readonly variantsRepository;
    private readonly productsRepository;
    private readonly auditService;
    private readonly loggerService;
    constructor(prisma: PrismaService, variantsRepository: ProductVariantsRepository, productsRepository: ProductsRepository, auditService: AuditService, loggerService: LoggerService);
    private toResponse;
    findAll(query: VariantQueryDto): Promise<{
        data: VariantResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<VariantResponse>;
    private generateUniqueSku;
    private ensureUniqueSku;
    private ensureUniqueBarcode;
    private generateUniqueBarcode;
    create(dto: CreateVariantDto, userId: string): Promise<VariantResponse>;
    update(id: string, dto: UpdateVariantDto, userId: string): Promise<VariantResponse>;
    delete(id: string, userId: string): Promise<void>;
    restore(id: string, userId: string): Promise<VariantResponse>;
    activate(id: string, userId: string): Promise<VariantResponse>;
    deactivate(id: string, userId: string): Promise<VariantResponse>;
    setDefault(id: string, userId: string): Promise<VariantResponse>;
    assignAttributeValues(id: string, dto: AssignAttributeValuesDto, userId: string): Promise<VariantResponse>;
    removeAttributeValue(id: string, attributeId: string): Promise<VariantResponse>;
}
