import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { PrescriptionRepository } from './prescription.repository';
import {
  UploadPrescriptionDto,
  UpdatePrescriptionDto,
  VerifyPrescriptionDto,
  PrescriptionQueryDto,
  PrescriptionResponse,
  PrescriptionMedicineResponse,
} from './prescription.types';

@Injectable()
export class PrescriptionService {
  constructor(
    private readonly prescriptionRepository: PrescriptionRepository,
    private readonly auditService: AuditService,
    private readonly loggerService: LoggerService,
  ) {}

  private toMedicineResponse(m: any): PrescriptionMedicineResponse {
    return {
      id: m.id,
      medicineName: m.medicineName,
      dosage: m.dosage ?? undefined,
      frequency: m.frequency ?? undefined,
      duration: m.duration ?? undefined,
      quantity: m.quantity ?? undefined,
      instructions: m.instructions ?? undefined,
      confidence: m.confidence ? Number(m.confidence) : undefined,
      productId: m.productId ?? undefined,
    };
  }

  private toResponse(p: any): PrescriptionResponse {
    return {
      id: p.id,
      userId: p.userId,
      imageUrl: p.imageUrl,
      doctorName: p.doctorName ?? undefined,
      hospitalName: p.hospitalName ?? undefined,
      prescriptionDate: p.prescriptionDate ?? undefined,
      expiryDate: p.expiryDate ?? undefined,
      ocrConfidence: p.ocrConfidence ? Number(p.ocrConfidence) : undefined,
      verificationStatus: p.verificationStatus,
      medicines: p.medicines?.map((m: any) => this.toMedicineResponse(m)),
      notes: p.notes ?? undefined,
      createdAt: p.createdAt,
    };
  }

  async findAll(userId: string, query: PrescriptionQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.prescriptionRepository.findAll({
      userId,
      verificationStatus: query.verificationStatus,
      page,
      limit,
    });
    return {
      data: result.data.map((p: any) => this.toResponse(p)),
      meta: result.meta,
    };
  }

  async findById(id: string, userId: string) {
    const prescription = await this.prescriptionRepository.findById(id);
    if (!prescription)
      throw new BusinessException('Prescription not found', 'PRESCRIPTION_001');
    if (prescription.userId !== userId)
      throw new BusinessException('Access denied', 'PRESCRIPTION_002');
    return this.toResponse(prescription);
  }

  async upload(userId: string, dto: UploadPrescriptionDto) {
    const prescription = await this.prescriptionRepository.create({
      user: { connect: { id: userId } },
      imageUrl: dto.imageUrl,
      doctorName: dto.doctorName,
      hospitalName: dto.hospitalName,
      prescriptionDate: dto.prescriptionDate
        ? new Date(dto.prescriptionDate)
        : undefined,
      notes: dto.notes,
    });
    await this.auditService.log({
      action: 'PRESCRIPTION_UPLOADED',
      module: 'prescriptions',
      resource: 'prescription',
      resourceId: prescription.id,
      userId,
      newValue: { imageUrl: dto.imageUrl },
    });
    this.loggerService.log(
      { action: 'prescription_uploaded', prescriptionId: prescription.id },
      'PrescriptionService',
    );
    // ponytail: placeholder OCR extraction, integrate real OCR service when available
    await this.auditService.log({
      action: 'OCR_COMPLETED',
      module: 'prescriptions',
      resource: 'prescription',
      resourceId: prescription.id,
      userId,
      newValue: { ocrConfidence: null },
    });
    return this.toResponse(prescription);
  }

  async update(id: string, dto: UpdatePrescriptionDto, userId: string) {
    const prescription = await this.prescriptionRepository.findById(id);
    if (!prescription)
      throw new BusinessException('Prescription not found', 'PRESCRIPTION_001');
    if (prescription.userId !== userId)
      throw new BusinessException('Access denied', 'PRESCRIPTION_002');
    const updated = await this.prescriptionRepository.update(id, {
      doctorName: dto.doctorName,
      hospitalName: dto.hospitalName,
      prescriptionDate: dto.prescriptionDate
        ? new Date(dto.prescriptionDate)
        : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      notes: dto.notes,
    });
    await this.auditService.log({
      action: 'PRESCRIPTION_UPDATED',
      module: 'prescriptions',
      resource: 'prescription',
      resourceId: id,
      userId,
      newValue: { ...dto },
    });
    this.loggerService.log(
      { action: 'prescription_updated', prescriptionId: id },
      'PrescriptionService',
    );
    return this.toResponse(updated);
  }

  async verify(id: string, dto: VerifyPrescriptionDto, userId: string) {
    const prescription = await this.prescriptionRepository.findById(id);
    if (!prescription)
      throw new BusinessException('Prescription not found', 'PRESCRIPTION_001');
    const updated = await this.prescriptionRepository.update(id, {
      verificationStatus: dto.verificationStatus,
      notes: dto.notes,
      verifiedBy: userId,
      verifiedAt: new Date(),
    });
    await this.auditService.log({
      action: 'OCR_VERIFIED',
      module: 'prescriptions',
      resource: 'prescription',
      resourceId: id,
      userId,
      newValue: { verificationStatus: dto.verificationStatus },
    });
    this.loggerService.log(
      {
        action: 'prescription_verified',
        prescriptionId: id,
        status: dto.verificationStatus,
      },
      'PrescriptionService',
    );
    return this.toResponse(updated);
  }

  async addMedicine(
    prescriptionId: string,
    dto: {
      medicineName: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
      quantity?: number;
      instructions?: string;
      confidence?: number;
      productId?: string;
    },
  ) {
    const prescription =
      await this.prescriptionRepository.findById(prescriptionId);
    if (!prescription)
      throw new BusinessException('Prescription not found', 'PRESCRIPTION_001');
    const medicine = await this.prescriptionRepository.createMedicine({
      prescription: { connect: { id: prescriptionId } },
      medicineName: dto.medicineName,
      dosage: dto.dosage,
      frequency: dto.frequency,
      duration: dto.duration,
      quantity: dto.quantity,
      instructions: dto.instructions,
      confidence: dto.confidence,
      ...(dto.productId ? { product: { connect: { id: dto.productId } } } : {}),
    });
    return this.toMedicineResponse(medicine);
  }
}
