import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    channel?: string;
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const {
      search,
      channel,
      status,
      customerId,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = {};
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (channel) {
      if (channel === 'ONLINE' || channel === 'ONLINE_STORE') {
        where.channel = 'ONLINE_STORE' as any;
      } else if (channel === 'POS' || channel === 'POS_SHOPORA') {
        where.channel = 'POS_SHOPORA' as any;
      } else {
        where.channel = channel as any;
      }
    }
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: {
              id: true,
              phone: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          items: true,
          payments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.order.count({ where }),
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
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        addresses: true,
        timeline: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async findByOrderNumber(orderNumber: string) {
    return this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        addresses: true,
        timeline: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async findByCustomerId(customerId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = { customerId };
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
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

  async create(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({
      data,
      include: { items: true, addresses: true },
    });
  }

  async update(id: string, data: Prisma.OrderUpdateInput) {
    return this.prisma.order.update({ where: { id }, data });
  }

  async createTimeline(
    orderId: string,
    status: string,
    message?: string,
    createdBy?: string,
    metadata?: any,
  ) {
    return this.prisma.orderTimeline.create({
      data: { orderId, status, message, createdBy, metadata },
    });
  }

  async updateStatus(orderId: string, status: string, userId?: string) {
    const [order] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status },
      }),
      this.prisma.orderTimeline.create({
        data: {
          orderId,
          status,
          message: `Status changed to ${status}`,
          createdBy: userId,
        },
      }),
    ]);
    return order;
  }
}
