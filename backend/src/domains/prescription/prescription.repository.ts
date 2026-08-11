import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrescriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    userId: string;
    verificationStatus?: string;
    page: number;
    limit: number;
  }) {
    const { userId, verificationStatus, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.PrescriptionWhereInput = { userId };
    if (verificationStatus) where.verificationStatus = verificationStatus;

    const [data, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { medicines: true },
      }),
      this.prisma.prescription.count({ where }),
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

  async findById(id: string) {
    return this.prisma.prescription.findUnique({
      where: { id },
      include: { medicines: true },
    });
  }

  async create(data: Prisma.PrescriptionCreateInput) {
    return this.prisma.prescription.create({
      data,
      include: { medicines: true },
    });
  }

  async update(id: string, data: Prisma.PrescriptionUpdateInput) {
    return this.prisma.prescription.update({
      where: { id },
      data,
      include: { medicines: true },
    });
  }

  async createMedicine(data: Prisma.PrescriptionMedicineCreateInput) {
    return this.prisma.prescriptionMedicine.create({ data });
  }
}
