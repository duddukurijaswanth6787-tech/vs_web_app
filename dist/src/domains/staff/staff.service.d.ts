import { LoggerService } from "../../common/logger/logger.service";
import { PasswordService } from "../auth/services/password.service";
import { PrismaService } from "../../database/prisma.service";
import { StaffRepository } from './staff.repository';
import { CreateStaffDto, UpdateStaffDto, StaffQueryDto, StaffResponse } from './staff.types';
export declare class StaffService {
    private readonly staffRepository;
    private readonly passwordService;
    private readonly prisma;
    private readonly loggerService;
    constructor(staffRepository: StaffRepository, passwordService: PasswordService, prisma: PrismaService, loggerService: LoggerService);
    private toResponse;
    findAll(query: StaffQueryDto): Promise<{
        data: StaffResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<StaffResponse>;
    create(dto: CreateStaffDto, createdBy: string): Promise<StaffResponse>;
    update(id: string, dto: UpdateStaffDto): Promise<StaffResponse>;
    delete(id: string): Promise<void>;
    restore(id: string): Promise<StaffResponse>;
    private updateStatus;
    activate(id: string): Promise<StaffResponse>;
    deactivate(id: string): Promise<StaffResponse>;
    suspend(id: string): Promise<StaffResponse>;
    lock(id: string): Promise<StaffResponse>;
    unlock(id: string): Promise<StaffResponse>;
}
