import { SizeChartService } from './size-chart.service';
import { CreateSizeChartTemplateDto, UpdateSizeChartTemplateDto, SizeChartQueryDto } from './size-chart.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class SizeChartController {
    private readonly sizeChartService;
    constructor(sizeChartService: SizeChartService);
    findAll(query: SizeChartQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./size-chart.types").SizeChartTemplateResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findByProduct(productId: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./size-chart.types").SizeChartTemplateResponse | null>>;
    findById(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./size-chart.types").SizeChartTemplateResponse>>;
    create(dto: CreateSizeChartTemplateDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./size-chart.types").SizeChartTemplateResponse>>;
    update(id: string, dto: UpdateSizeChartTemplateDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./size-chart.types").SizeChartTemplateResponse>>;
    remove(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
}
