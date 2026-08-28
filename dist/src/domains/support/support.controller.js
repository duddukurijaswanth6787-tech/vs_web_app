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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const support_service_1 = require("./support.service");
const support_types_1 = require("./support.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
const prisma_service_1 = require("../../database/prisma.service");
const common_2 = require("@nestjs/common");
let SupportController = class SupportController {
    supportService;
    prisma;
    constructor(supportService, prisma) {
        this.supportService = supportService;
        this.prisma = prisma;
    }
    isStaffMember(user) {
        return !!user.roles?.some((r) => ['super_admin', 'admin', 'staff'].includes(r));
    }
    async resolveCustomerId(userId) {
        let profile = await this.prisma.customerProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (user) {
                profile = await this.prisma.customerProfile.create({
                    data: { userId: user.id },
                });
            }
        }
        return profile?.id ?? null;
    }
    async createContact(dto) {
        return response_builder_1.ResponseBuilder.created(await this.supportService.createContact(dto), 'Contact message submitted');
    }
    async findContacts(query) {
        return response_builder_1.ResponseBuilder.success(await this.supportService.findContacts(query));
    }
    async updateContactStatus(id, dto) {
        return response_builder_1.ResponseBuilder.success(await this.supportService.updateContactStatus(id, dto.status ?? 'NEW', dto.assignedTo), 'Contact status updated');
    }
    async findTickets(query, user) {
        if (!this.isStaffMember(user)) {
            const customerId = await this.resolveCustomerId(user.sub);
            if (!customerId)
                return response_builder_1.ResponseBuilder.success([]);
            query.customerId = customerId;
        }
        return response_builder_1.ResponseBuilder.success(await this.supportService.findTickets(query));
    }
    async findTicketById(id, user) {
        const ticket = await this.supportService.findTicketById(id);
        if (!this.isStaffMember(user)) {
            const customerId = await this.resolveCustomerId(user.sub);
            if (!customerId || ticket.customerId !== customerId) {
                throw new common_2.ForbiddenException('Ticket not found');
            }
        }
        return response_builder_1.ResponseBuilder.success(ticket);
    }
    async createTicket(dto, user) {
        const customerId = await this.resolveCustomerId(user.sub);
        if (!customerId)
            throw new common_2.ForbiddenException('Customer profile not found');
        return response_builder_1.ResponseBuilder.created(await this.supportService.createTicket(customerId, dto), 'Ticket created');
    }
    async updateTicketStatus(id, dto) {
        return response_builder_1.ResponseBuilder.success(await this.supportService.updateTicketStatus(id, dto), 'Ticket status updated');
    }
    async addReply(id, dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.supportService.addReply(id, dto, this.isStaffMember(user)), 'Reply added');
    }
};
exports.SupportController = SupportController;
__decorate([
    (0, common_1.Post)('contact'),
    (0, swagger_1.ApiOperation)({ summary: 'Create contact message (public)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [support_types_1.CreateContactMessageDto]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "createContact", null);
__decorate([
    (0, common_1.Get)('contacts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List contact messages (admin)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [support_types_1.ContactQueryDto]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "findContacts", null);
__decorate([
    (0, common_1.Patch)('contacts/:id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update contact status (admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, support_types_1.UpdateTicketStatusDto]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "updateContactStatus", null);
__decorate([
    (0, common_1.Get)('tickets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List tickets (admin: all, customer: own)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [support_types_1.TicketQueryDto, Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "findTickets", null);
__decorate([
    (0, common_1.Get)('tickets/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get ticket by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "findTicketById", null);
__decorate([
    (0, common_1.Post)('tickets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create support ticket' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [support_types_1.CreateSupportTicketDto, Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "createTicket", null);
__decorate([
    (0, common_1.Patch)('tickets/:id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin', 'staff'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update ticket status (admin or support-desk staff)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, support_types_1.UpdateTicketStatusDto]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "updateTicketStatus", null);
__decorate([
    (0, common_1.Post)('tickets/:id/replies'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add reply to ticket' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, support_types_1.CreateSupportReplyDto, Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "addReply", null);
exports.SupportController = SupportController = __decorate([
    (0, swagger_1.ApiTags)('Support'),
    (0, common_1.Controller)('support'),
    __metadata("design:paramtypes", [support_service_1.SupportService,
        prisma_service_1.PrismaService])
], SupportController);
//# sourceMappingURL=support.controller.js.map