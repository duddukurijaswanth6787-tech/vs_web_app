import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomerProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  // firstName/lastName/email live on the User row, not here, so GET /me
  // returned a profile with no name or email and the edit form rendered those
  // fields blank. The relation is needed for the response to describe the
  // whole person rather than just the preferences half of it.
  async findByUserId(userId: string) {
    return this.prisma.customerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  async findById(id: string) {
    return this.prisma.customerProfile.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  // Same shape as findByUserId: a freshly created profile is returned straight
  // to the client on first load, so it must carry the user fields too.
  async create(data: Prisma.CustomerProfileCreateInput) {
    return this.prisma.customerProfile.create({ data, include: { user: true } });
  }

  async update(id: string, data: Prisma.CustomerProfileUpdateInput) {
    return this.prisma.customerProfile.update({ where: { id }, data });
  }
}
