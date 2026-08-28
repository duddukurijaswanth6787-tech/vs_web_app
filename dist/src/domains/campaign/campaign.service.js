"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const campaign_repository_1 = require("./campaign.repository");
let CampaignService = class CampaignService {
    campaignRepository;
    auditService;
    constructor(campaignRepository, auditService) {
        this.campaignRepository = campaignRepository;
        this.auditService = auditService;
    }
    toResponse(c) {
        return {
            id: c.id,
            name: c.name,
            description: c.description ?? undefined,
            type: c.type,
            channel: c.channel,
            subject: c.subject ?? undefined,
            content: c.content ?? undefined,
            status: c.status,
            sentCount: c.sentCount,
            openCount: c.openCount,
            clickCount: c.clickCount,
            scheduledAt: c.scheduledAt ?? undefined,
            sentAt: c.sentAt ?? undefined,
            createdAt: c.createdAt,
        };
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.campaignRepository.findAll({
            type: query.type,
            channel: query.channel,
            status: query.status,
            page,
            limit,
        });
        return {
            data: result.data.map((c) => this.toResponse(c)),
            meta: result.meta,
        };
    }
    async findById(id) {
        const campaign = await this.campaignRepository.findById(id);
        if (!campaign)
            throw new exceptions_1.BusinessException('Campaign not found', 'CAMPAIGN_001');
        return this.toResponse(campaign);
    }
    async create(dto, userId) {
        const campaign = await this.campaignRepository.create({
            name: dto.name,
            description: dto.description,
            type: dto.type,
            channel: dto.channel,
            subject: dto.subject,
            content: dto.content,
            audience: dto.audience ?? [],
            scheduledAt: dto.scheduledAt,
            status: 'DRAFT',
            createdBy: userId,
        });
        await this.auditService.log({
            action: 'CAMPAIGN_CREATED',
            module: 'campaign',
            resource: 'campaign',
            resourceId: campaign.id,
            userId,
            newValue: { name: dto.name, type: dto.type, channel: dto.channel },
        });
        return this.toResponse(campaign);
    }
    async update(id, dto, userId) {
        const campaign = await this.campaignRepository.findById(id);
        if (!campaign)
            throw new exceptions_1.BusinessException('Campaign not found', 'CAMPAIGN_001');
        await this.campaignRepository.update(id, { ...dto, updatedBy: userId });
        return this.findById(id);
    }
    async send(id, userId) {
        const campaign = await this.campaignRepository.findById(id);
        if (!campaign)
            throw new exceptions_1.BusinessException('Campaign not found', 'CAMPAIGN_001');
        await this.campaignRepository.update(id, {
            status: 'SENT',
            sentAt: new Date(),
            updatedBy: userId,
        });
        return this.findById(id);
    }
};
exports.CampaignService = CampaignService;
exports.CampaignService = CampaignService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [campaign_repository_1.CampaignRepository,
        audit_service_1.AuditService])
], CampaignService);
//# sourceMappingURL=campaign.service.js.map