import { AuditService } from "../audit/audit.service";
import { TaxRepository } from './tax.repository';
import { CreateTaxRuleDto, UpdateTaxRuleDto, CalculateTaxDto, TaxRuleResponse, TaxCalculationResponse } from './tax.types';
export declare class TaxService {
    private readonly taxRepository;
    private readonly auditService;
    constructor(taxRepository: TaxRepository, auditService: AuditService);
    private toResponse;
    findAll(query: {
        type?: string;
        isActive?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        data: TaxRuleResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<TaxRuleResponse>;
    create(userId: string, dto: CreateTaxRuleDto): Promise<TaxRuleResponse>;
    update(id: string, userId: string, dto: UpdateTaxRuleDto): Promise<TaxRuleResponse>;
    calculateTax(dto: CalculateTaxDto): Promise<TaxCalculationResponse>;
}
