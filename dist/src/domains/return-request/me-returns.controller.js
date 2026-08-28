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
exports.MeReturnsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const exceptions_1 = require("../../common/exceptions");
const return_request_service_1 = require("./return-request.service");
const return_request_types_1 = require("./return-request.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const audit_service_1 = require("../audit/audit.service");
const notification_service_1 = require("../notification/notification.service");
const prisma_service_1 = require("../../database/prisma.service");
const response_builder_1 = require("../../common/responses/response.builder");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_2 = require("@nestjs/swagger");
class CustomerReturnItemDto {
    orderItemId;
    quantity;
    reason;
}
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CustomerReturnItemDto.prototype, "orderItemId", void 0);
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CustomerReturnItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomerReturnItemDto.prototype, "reason", void 0);
class CustomerCreateReturnDto {
    orderId;
    reason;
    description;
    refundPreference;
    images;
    items;
}
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CustomerCreateReturnDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomerCreateReturnDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomerCreateReturnDto.prototype, "description", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomerCreateReturnDto.prototype, "refundPreference", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CustomerCreateReturnDto.prototype, "images", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ type: [CustomerReturnItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CustomerReturnItemDto),
    __metadata("design:type", Array)
], CustomerCreateReturnDto.prototype, "items", void 0);
let MeReturnsController = class MeReturnsController {
    returnRequestService;
    prisma;
    auditService;
    notificationService;
    constructor(returnRequestService, prisma, auditService, notificationService) {
        this.returnRequestService = returnRequestService;
        this.prisma = prisma;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }
    async resolveCustomerId(userId) {
        const profile = await this.prisma.customerProfile.findUnique({
            where: { userId },
        });
        return profile?.id ?? null;
    }
    async create(dto, user) {
        const isAdmin = user.roles?.some((r) => ['super_admin', 'admin'].includes(r));
        if (!isAdmin) {
            const order = await this.prisma.order.findUnique({
                where: { id: dto.orderId },
                select: { customerId: true },
            });
            if (!order)
                throw new exceptions_1.BusinessException('Order not found', 'ORDER_001');
            const customerId = await this.resolveCustomerId(user.sub);
            if (!customerId || order.customerId !== customerId)
                throw new exceptions_1.BusinessException('Not authorized', 'RETURN_003');
            const existing = await this.prisma.returnRequest.findFirst({
                where: { orderId: dto.orderId, status: { notIn: ['CANCELLED'] } },
            });
            if (existing)
                throw new exceptions_1.BusinessException('Return already requested for this order', 'RETURN_004');
        }
        const reason = dto.description
            ? `${dto.reason}: ${dto.description}`
            : dto.reason;
        const result = await this.returnRequestService.create(user.sub, {
            orderId: dto.orderId,
            reason,
            items: dto.items,
            refundPreference: dto.refundPreference,
            images: dto.images,
        });
        return response_builder_1.ResponseBuilder.created(result, 'Return request created');
    }
    async findAll(query, user) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const skip = (page - 1) * limit;
        const customerId = await this.resolveCustomerId(user.sub);
        if (!customerId) {
            return response_builder_1.ResponseBuilder.success({
                data: [],
                meta: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 1,
                    hasNext: false,
                    hasPrevious: false,
                },
            });
        }
        const where = { order: { customerId } };
        if (query.status)
            where.status = query.status;
        const [data, total] = await Promise.all([
            this.prisma.returnRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { items: true, order: { select: { orderNumber: true } } },
            }),
            this.prisma.returnRequest.count({ where }),
        ]);
        return response_builder_1.ResponseBuilder.success({
            data: data.map((r) => ({
                id: r.id,
                returnNumber: r.returnNumber,
                orderNumber: r.order.orderNumber,
                status: r.status,
                reason: r.reason,
                items: r.items.map((i) => ({
                    id: i.id,
                    orderItemId: i.orderItemId,
                    quantity: i.quantity,
                    reason: i.reason,
                })),
                createdAt: r.createdAt,
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
                hasNext: page < Math.ceil(total / limit),
                hasPrevious: page > 1,
            },
        });
    }
    async findById(returnId, user) {
        const ret = await this.prisma.returnRequest.findUnique({
            where: { id: returnId },
            include: {
                items: { include: { images: { orderBy: { displayOrder: 'asc' } } } },
                order: {
                    include: {
                        timeline: { orderBy: { createdAt: 'asc' } },
                        addresses: true,
                    },
                },
            },
        });
        if (!ret)
            return response_builder_1.ResponseBuilder.success(null, 'Return not found');
        const customerId = await this.resolveCustomerId(user.sub);
        if (!customerId || ret.order.customerId !== customerId)
            return response_builder_1.ResponseBuilder.success(null, 'Return not found');
        return response_builder_1.ResponseBuilder.success({
            id: ret.id,
            returnNumber: ret.returnNumber,
            status: ret.status,
            reason: ret.reason,
            refundPreference: ret.refundPreference ?? undefined,
            adminNotes: ret.adminNotes ?? undefined,
            items: ret.items.map((i) => ({
                id: i.id,
                orderItemId: i.orderItemId,
                quantity: i.quantity,
                reason: i.reason,
                images: i.images?.map((img) => ({
                    url: img.url,
                    displayOrder: img.displayOrder,
                })),
            })),
            order: {
                orderNumber: ret.order.orderNumber,
                status: ret.order.status,
                timeline: ret.order.timeline.map((t) => ({
                    status: t.status,
                    time: t.createdAt.toISOString(),
                })),
            },
            createdAt: ret.createdAt,
        });
    }
    async cancel(returnId, user) {
        const ret = await this.prisma.returnRequest.findUnique({
            where: { id: returnId },
            include: {
                order: { select: { customerId: true, id: true, orderNumber: true } },
            },
        });
        if (!ret)
            return response_builder_1.ResponseBuilder.success(null, 'Return not found');
        const customerId = await this.resolveCustomerId(user.sub);
        if (!customerId || ret.order.customerId !== customerId)
            return response_builder_1.ResponseBuilder.success(null, 'Return not found');
        if (!['REQUESTED', 'APPROVED'].includes(ret.status))
            throw new exceptions_1.BusinessException('Cannot cancel return in current status', 'RETURN_005');
        await this.prisma.returnRequest.update({
            where: { id: returnId },
            data: { status: 'CANCELLED', updatedBy: user.sub },
        });
        await this.prisma.orderTimeline.create({
            data: {
                orderId: ret.order.id,
                status: 'RETURN_CANCELLED',
                message: `Return ${ret.returnNumber} cancelled by customer`,
                createdBy: user.sub,
            },
        });
        await this.auditService.log({
            action: 'RETURN_CANCELLED',
            module: 'returns',
            resource: 'return_request',
            resourceId: returnId,
            userId: user.sub,
            oldValue: { status: ret.status },
            newValue: { status: 'CANCELLED' },
        });
        await this.notificationService.create({
            userId: user.sub,
            type: 'ORDER_RETURNED',
            title: 'Return Cancelled',
            message: `Return ${ret.returnNumber} has been cancelled`,
            data: { returnId, returnNumber: ret.returnNumber },
        });
        return response_builder_1.ResponseBuilder.success({ id: ret.id, status: 'CANCELLED' }, 'Return cancelled');
    }
};
exports.MeReturnsController = MeReturnsController;
__decorate([
    (0, common_1.Post)('returns'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a return request' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CustomerCreateReturnDto, Object]),
    __metadata("design:returntype", Promise)
], MeReturnsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('me/returns'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current customer returns' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [return_request_types_1.ReturnQueryDto, Object]),
    __metadata("design:returntype", Promise)
], MeReturnsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('me/returns/:returnId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get return request details' }),
    __param(0, (0, common_1.Param)('returnId')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MeReturnsController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)('me/returns/:returnId/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a return request' }),
    __param(0, (0, common_1.Param)('returnId')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MeReturnsController.prototype, "cancel", null);
exports.MeReturnsController = MeReturnsController = __decorate([
    (0, swagger_1.ApiTags)('Returns'),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [return_request_service_1.ReturnRequestService,
        prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        notification_service_1.NotificationService])
], MeReturnsController);
//# sourceMappingURL=me-returns.controller.js.map