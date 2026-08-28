import { CampaignService } from './campaign.service';
import { CreateCampaignDto, UpdateCampaignDto, CampaignQueryDto } from './campaign.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class CampaignController {
    private readonly campaignService;
    constructor(campaignService: CampaignService);
    findAll(query: CampaignQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./campaign.types").CampaignResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findById(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./campaign.types").CampaignResponse>>;
    create(dto: CreateCampaignDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./campaign.types").CampaignResponse>>;
    update(id: string, dto: UpdateCampaignDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./campaign.types").CampaignResponse>>;
    send(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./campaign.types").CampaignResponse>>;
}
