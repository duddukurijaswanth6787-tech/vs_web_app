"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const crypto = __importStar(require("crypto"));
let PackingService = class PackingService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async createJob(dto, userId) {
        const order = await this.prisma.order.findFirst({
            where: { id: dto.orderId, deletedAt: null },
        });
        if (!order)
            throw new exceptions_1.BusinessException('Order not found', 'ORDER_001');
        const existing = await this.prisma.packingJob.findFirst({
            where: {
                orderId: order.id,
                status: { notIn: ['COMPLETED', 'CANCELLED'] },
            },
        });
        if (existing)
            throw new exceptions_1.BusinessException('Active packing job already exists', 'PACK_001');
        const barcode = `PKG-${order.orderNumber}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        const job = await this.prisma.packingJob.create({
            data: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                status: dto.assignedTo ? 'ASSIGNED' : 'QUEUED',
                assignedTo: dto.assignedTo,
                barcode,
                notes: dto.notes,
                createdBy: userId,
            },
        });
        await this.auditService.log({
            action: 'PACKING_JOB_CREATED',
            module: 'packing',
            resource: 'packing_job',
            resourceId: job.id,
            userId,
            newValue: { orderId: order.id, barcode },
        });
        return job;
    }
    async getQueue(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const where = {};
        if (query.status)
            where.status = query.status;
        const [data, total] = await Promise.all([
            this.prisma.packingJob.findMany({
                where,
                orderBy: { createdAt: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    order: {
                        select: {
                            id: true,
                            orderNumber: true,
                            status: true,
                            grandTotal: true,
                        },
                    },
                },
            }),
            this.prisma.packingJob.count({ where }),
        ]);
        return { data, meta: { page, limit, total } };
    }
    async assign(jobId, dto, userId) {
        const job = await this.prisma.packingJob.findUnique({
            where: { id: jobId },
        });
        if (!job)
            throw new exceptions_1.BusinessException('Packing job not found', 'PACK_002');
        const updated = await this.prisma.packingJob.update({
            where: { id: jobId },
            data: {
                assignedTo: dto.assignedTo,
                status: 'ASSIGNED',
                updatedBy: userId,
            },
        });
        return updated;
    }
    async startPacking(jobId, userId) {
        const job = await this.prisma.packingJob.findUnique({
            where: { id: jobId },
        });
        if (!job)
            throw new exceptions_1.BusinessException('Packing job not found', 'PACK_002');
        return this.prisma.packingJob.update({
            where: { id: jobId },
            data: { status: 'PACKING', updatedBy: userId },
        });
    }
    async verifyBarcode(jobId, dto, userId) {
        const job = await this.prisma.packingJob.findUnique({
            where: { id: jobId },
        });
        if (!job)
            throw new exceptions_1.BusinessException('Packing job not found', 'PACK_002');
        const success = job.barcode === dto.barcode || job.orderNumber === dto.barcode;
        await this.prisma.packingScan.create({
            data: {
                packingJobId: job.id,
                barcode: dto.barcode,
                scanType: 'VERIFY',
                success,
                scannedBy: userId,
                message: success ? 'Barcode verified' : 'Barcode mismatch',
            },
        });
        if (!success)
            throw new exceptions_1.BusinessException('Barcode verification failed', 'PACK_003');
        return this.prisma.packingJob.update({
            where: { id: jobId },
            data: { status: 'VERIFIED', verifiedAt: new Date(), updatedBy: userId },
        });
    }
    async generateLabel(jobId, userId) {
        const job = await this.prisma.packingJob.findUnique({
            where: { id: jobId },
        });
        if (!job)
            throw new exceptions_1.BusinessException('Packing job not found', 'PACK_002');
        const labelUrl = `/labels/packing/${job.orderNumber}-${job.barcode}.pdf`;
        const updated = await this.prisma.packingJob.update({
            where: { id: jobId },
            data: {
                labelUrl,
                status: 'LABELLED',
                packedAt: new Date(),
                updatedBy: userId,
            },
        });
        await this.auditService.log({
            action: 'PACKING_LABEL_GENERATED',
            module: 'packing',
            resource: 'packing_job',
            resourceId: jobId,
            userId,
            newValue: { labelUrl },
        });
        return updated;
    }
    async complete(jobId, userId) {
        const job = await this.prisma.packingJob.findUnique({
            where: { id: jobId },
        });
        if (!job)
            throw new exceptions_1.BusinessException('Packing job not found', 'PACK_002');
        return this.prisma.packingJob.update({
            where: { id: jobId },
            data: { status: 'COMPLETED', updatedBy: userId },
        });
    }
    async getById(jobId) {
        const job = await this.prisma.packingJob.findUnique({
            where: { id: jobId },
            include: { scans: { orderBy: { createdAt: 'desc' } }, order: true },
        });
        if (!job)
            throw new exceptions_1.BusinessException('Packing job not found', 'PACK_002');
        return job;
    }
};
exports.PackingService = PackingService;
exports.PackingService = PackingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], PackingService);
//# sourceMappingURL=packing.service.js.map