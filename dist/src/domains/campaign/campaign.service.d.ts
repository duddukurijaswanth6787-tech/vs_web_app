import { AuditService } from "../audit/audit.service";
import { CampaignRepository } from './campaign.repository';
import { CreateCampaignDto, UpdateCampaignDto, CampaignQueryDto, CampaignResponse } from './campaign.types';
export declare class CampaignService {
    private readonly campaignRepository;
    private readonly auditService;
    constructor(campaignRepository: CampaignRepository, auditService: AuditService);
    private toResponse;
    findAll(query: CampaignQueryDto): Promise<{
        data: CampaignResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<CampaignResponse>;
    create(dto: CreateCampaignDto, userId: string): Promise<CampaignResponse>;
    update(id: string, dto: UpdateCampaignDto, userId: string): Promise<CampaignResponse>;
    send(id: string, userId: string): Promise<CampaignResponse>;
}
