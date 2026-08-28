import { AuditService } from "../audit/audit.service";
import { FaqRepository } from './faq.repository';
import { CreateFaqDto, UpdateFaqDto, FaqQueryDto, FaqResponse } from './faq.types';
export declare class FaqService {
    private readonly faqRepository;
    private readonly auditService;
    constructor(faqRepository: FaqRepository, auditService: AuditService);
    private toResponse;
    private generateSlug;
    findAll(query: FaqQueryDto): Promise<{
        data: FaqResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<FaqResponse>;
    create(dto: CreateFaqDto): Promise<FaqResponse>;
    update(id: string, dto: UpdateFaqDto): Promise<FaqResponse>;
    delete(id: string): Promise<void>;
    markHelpful(id: string): Promise<FaqResponse>;
    findBySlug(slug: string): Promise<FaqResponse>;
    getCategories(): Promise<{
        name: string;
        slug: string;
        faqCount: number;
    }[]>;
}
