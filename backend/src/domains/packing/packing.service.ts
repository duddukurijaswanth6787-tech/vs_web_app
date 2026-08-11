import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import {
  CreatePackingJobDto,
  VerifyBarcodeDto,
  PackingQueueQueryDto,
  AssignPackingDto,
} from './packing.types';
import * as crypto from 'crypto';

@Injectable()
export class PackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createJob(dto: CreatePackingJobDto, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, deletedAt: null },
    });
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');
    const existing = await this.prisma.packingJob.findFirst({
      where: {
        orderId: order.id,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    });
    if (existing)
      throw new BusinessException(
        'Active packing job already exists',
        'PACK_001',
      );

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

  async getQueue(query: PackingQueueQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where: any = {};
    if (query.status) where.status = query.status;
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

  async assign(jobId: string, dto: AssignPackingDto, userId: string) {
    const job = await this.prisma.packingJob.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new BusinessException('Packing job not found', 'PACK_002');
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

  async startPacking(jobId: string, userId: string) {
    const job = await this.prisma.packingJob.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new BusinessException('Packing job not found', 'PACK_002');
    return this.prisma.packingJob.update({
      where: { id: jobId },
      data: { status: 'PACKING', updatedBy: userId },
    });
  }

  async verifyBarcode(jobId: string, dto: VerifyBarcodeDto, userId: string) {
    const job = await this.prisma.packingJob.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new BusinessException('Packing job not found', 'PACK_002');
    const success =
      job.barcode === dto.barcode || job.orderNumber === dto.barcode;
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
      throw new BusinessException('Barcode verification failed', 'PACK_003');
    return this.prisma.packingJob.update({
      where: { id: jobId },
      data: { status: 'VERIFIED', verifiedAt: new Date(), updatedBy: userId },
    });
  }

  async generateLabel(jobId: string, userId: string) {
    const job = await this.prisma.packingJob.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new BusinessException('Packing job not found', 'PACK_002');
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

  async complete(jobId: string, userId: string) {
    const job = await this.prisma.packingJob.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new BusinessException('Packing job not found', 'PACK_002');
    return this.prisma.packingJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', updatedBy: userId },
    });
  }

  async getById(jobId: string) {
    const job = await this.prisma.packingJob.findUnique({
      where: { id: jobId },
      include: { scans: { orderBy: { createdAt: 'desc' } }, order: true },
    });
    if (!job) throw new BusinessException('Packing job not found', 'PACK_002');
    return job;
  }
}
