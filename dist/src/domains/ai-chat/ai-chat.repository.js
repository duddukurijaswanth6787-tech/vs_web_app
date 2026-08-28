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
exports.AiChatRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let AiChatRepository = class AiChatRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { userId, status, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.aiConversation.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.aiConversation.count({ where }),
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
        return this.prisma.aiConversation.findUnique({
            where: { id },
            include: { messages: { orderBy: { createdAt: 'asc' } } },
        });
    }
    async create(data) {
        return this.prisma.aiConversation.create({ data });
    }
    async update(id, data) {
        return this.prisma.aiConversation.update({ where: { id }, data });
    }
    async createMessage(data) {
        return this.prisma.aiMessage.create({ data });
    }
    async getMessages(conversationId, page, limit) {
        const skip = (page - 1) * limit;
        const where = { conversationId };
        const [data, total] = await Promise.all([
            this.prisma.aiMessage.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'asc' },
            }),
            this.prisma.aiMessage.count({ where }),
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
};
exports.AiChatRepository = AiChatRepository;
exports.AiChatRepository = AiChatRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AiChatRepository);
//# sourceMappingURL=ai-chat.repository.js.map