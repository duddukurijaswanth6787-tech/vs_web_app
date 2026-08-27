import { TaxService } from './tax.service';
import { CreateTaxRuleDto, UpdateTaxRuleDto, CalculateTaxDto } from './tax.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class TaxController {
    private readonly taxService;
    constructor(taxService: TaxService);
    findAll(query: {
        type?: string;
        isActive?: boolean;
        page?: number;
        limit?: number;
    }): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./tax.types").TaxRuleResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findById(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./tax.types").TaxRuleResponse>>;
    create(dto: CreateTaxRuleDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./tax.types").TaxRuleResponse>>;
    update(id: string, dto: UpdateTaxRuleDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./tax.types").TaxRuleResponse>>;
    calculateTax(dto: CalculateTaxDto): Promise<import("@common/responses/response.builder").ResponsePayload<import("./tax.types").TaxCalculationResponse>>;
}
