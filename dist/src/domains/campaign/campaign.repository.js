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
exports.CampaignRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let CampaignRepository = class CampaignRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { type, channel, status, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (type)
            where.type = type;
        if (channel)
            where.channel = channel;
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.campaign.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.campaign.count({ where }),
        ]);
        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
                hasNext: page < Math.ceil(total / limit),
                hasPrevious: page > 1,
            },
        };
    }
    async findById(id) {
        return this.prisma.campaign.findUnique({ where: { id } });
    }
    async create(data) {
        return this.prisma.campaign.create({ data });
    }
    async update(id, data) {
        return this.prisma.campaign.update({ where: { id }, data });
    }
};
exports.CampaignRepository = CampaignRepository;
exports.CampaignRepository = CampaignRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CampaignRepository);
//# sourceMappingURL=campaign.repository.js.map