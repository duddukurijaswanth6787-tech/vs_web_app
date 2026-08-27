import { ProductVariantsService } from './product-variants.service';
import { CreateVariantDto, UpdateVariantDto, VariantQueryDto, AssignAttributeValuesDto } from './product-variants.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class ProductVariantsController {
    private readonly variantsService;
    constructor(variantsService: ProductVariantsService);
    findAll(query: VariantQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./product-variants.types").VariantResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findById(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./product-variants.types").VariantResponse>>;
    create(dto: CreateVariantDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./product-variants.types").VariantResponse>>;
    update(id: string, dto: UpdateVariantDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./product-variants.types").VariantResponse>>;
    delete(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    restore(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./product-variants.types").VariantResponse>>;
    activate(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./product-variants.types").VariantResponse>>;
    deactivate(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./product-variants.types").VariantResponse>>;
    setDefault(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./product-variants.types").VariantResponse>>;
    assignAttributeValues(id: string, dto: AssignAttributeValuesDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./product-variants.types").VariantResponse>>;
    removeAttributeValue(id: string, attributeId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./product-variants.types").VariantResponse>>;
}
