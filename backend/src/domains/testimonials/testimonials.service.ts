import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CreateTestimonialDto, UpdateTestimonialDto } from './testimonials.types';

@Injectable()
export class TestimonialsService {
  constructor(private readonly prisma: PrismaService) {}

  async findFeatured() {
    try {
      return await this.prisma.testimonial.findMany({
        where: {
          isFeatured: true,
          status: 'ACTIVE',
          deletedAt: null,
        },
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
      });
    } catch {
      return [];
    }
  }

  async findAll() {
    try {
      return await this.prisma.testimonial.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
      });
    } catch {
      return [];
    }
  }

  async findById(id: string) {
    const item = await this.prisma.testimonial.findFirst({
      where: { id, deletedAt: null },
    });
    if (!item) {
      throw new NotFoundException(`Testimonial with ID "${id}" not found`);
    }
    return item;
  }

  async create(dto: CreateTestimonialDto, userId?: string) {
    return this.prisma.testimonial.create({
      data: {
        ...dto,
        createdBy: userId,
      },
    });
  }

  async update(id: string, dto: UpdateTestimonialDto, userId?: string) {
    await this.findById(id);
    return this.prisma.testimonial.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async delete(id: string, userId?: string) {
    await this.findById(id);
    return this.prisma.testimonial.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
        updatedBy: userId,
      },
    });
  }
}
