import { FaqService } from './faq.service';
import { CreateFaqDto, UpdateFaqDto, FaqQueryDto } from './faq.types';
export declare class FaqController {
    private readonly faqService;
    constructor(faqService: FaqService);
    findAll(query: FaqQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./faq.types").FaqResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    getCategories(): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        name: string;
        slug: string;
        faqCount: number;
    }[]>>;
    findBySlug(slug: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./faq.types").FaqResponse>>;
    create(dto: CreateFaqDto): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./faq.types").FaqResponse>>;
    update(id: string, dto: UpdateFaqDto): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./faq.types").FaqResponse>>;
    delete(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    markHelpful(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./faq.types").FaqResponse>>;
}
