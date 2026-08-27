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
exports.SupportRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let SupportRepository = class SupportRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findContacts(params) {
        const { status, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.contactMessage.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.contactMessage.count({ where }),
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
    async createContact(data) {
        return this.prisma.contactMessage.create({ data });
    }
    async findContactById(id) {
        return this.prisma.contactMessage.findUnique({ where: { id } });
    }
    async updateContact(id, data) {
        return this.prisma.contactMessage.update({ where: { id }, data });
    }
    async findTickets(params) {
        const { status, priority, customerId, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        if (customerId)
            where.customerId = customerId;
        const [data, total] = await Promise.all([
            this.prisma.supportTicket.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    customer: {
                        include: { user: { select: { firstName: true, lastName: true } } },
                    },
                },
            }),
            this.prisma.supportTicket.count({ where }),
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
    async findTicketById(id) {
        return this.prisma.supportTicket.findUnique({
            where: { id },
            include: {
                replies: { orderBy: { createdAt: 'asc' } },
                customer: {
                    include: { user: { select: { firstName: true, lastName: true } } },
                },
            },
        });
    }
    async createTicket(data) {
        return this.prisma.supportTicket.create({ data });
    }
    async updateTicket(id, data) {
        return this.prisma.supportTicket.update({ where: { id }, data });
    }
    async createReply(data) {
        return this.prisma.supportReply.create({ data });
    }
    async generateTicketNumber() {
        const count = await this.prisma.supportTicket.count();
        return `TKT-${String(count + 1).padStart(6, '0')}`;
    }
};
exports.SupportRepository = SupportRepository;
exports.SupportRepository = SupportRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportRepository);
//# sourceMappingURL=support.repository.js.map