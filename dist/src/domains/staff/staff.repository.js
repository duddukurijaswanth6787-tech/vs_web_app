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
exports.StaffRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let StaffRepository = class StaffRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { search, department, designation, employmentStatus, page, limit, sortBy, sortOrder, } = params;
        const skip = (page - 1) * limit;
        const where = { user: { deletedAt: null } };
        if (search) {
            where.OR = [
                { employeeId: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { user: { firstName: { contains: search, mode: 'insensitive' } } },
                { user: { lastName: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (department)
            where.department = department;
        if (designation)
            where.designation = designation;
        if (employmentStatus)
            where.employmentStatus = employmentStatus;
        const [data, total] = await Promise.all([
            this.prisma.staffProfile.findMany({
                where,
                skip,
                take: limit,
                orderBy: sortBy === 'createdAt'
                    ? { createdAt: sortOrder }
                    : { [sortBy]: sortOrder },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            accountStatus: true,
                            createdAt: true,
                        },
                    },
                },
            }),
            this.prisma.staffProfile.count({ where }),
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
    async findById(id) {
        return this.prisma.staffProfile.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        accountStatus: true,
                        lastLoginAt: true,
                        createdAt: true,
                    },
                },
                reportingManager: {
                    select: { id: true, employeeId: true, jobTitle: true },
                },
            },
        });
    }
    async findByUserId(userId) {
        return this.prisma.staffProfile.findUnique({ where: { userId } });
    }
    async findByEmployeeId(employeeId) {
        return this.prisma.staffProfile.findUnique({ where: { employeeId } });
    }
    async generateEmployeeId() {
        for (let attempt = 0; attempt < 5; attempt++) {
            const count = await this.prisma.staffProfile.count();
            const candidate = `EMP-${String(count + 1 + attempt).padStart(4, '0')}`;
            const existing = await this.findByEmployeeId(candidate);
            if (!existing)
                return candidate;
        }
        return `EMP-${Date.now()}`;
    }
    async create(data) {
        return this.prisma.staffProfile.create({ data: data });
    }
    async update(id, data) {
        return this.prisma.staffProfile.update({
            where: { id },
            data: data,
        });
    }
    async updateEmploymentStatus(id, status) {
        return this.prisma.staffProfile.update({
            where: { id },
            data: { employmentStatus: status },
        });
    }
    async updateUser(userId, data) {
        return this.prisma.user.update({
            where: { id: userId },
            data: data,
        });
    }
    async updateStaffProfile(id, data) {
        return this.prisma.staffProfile.update({
            where: { id },
            data: data,
        });
    }
};
exports.StaffRepository = StaffRepository;
exports.StaffRepository = StaffRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StaffRepository);
//# sourceMappingURL=staff.repository.js.map