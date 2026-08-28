import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto, StaffQueryDto } from './staff.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class StaffController {
    private readonly staffService;
    constructor(staffService: StaffService);
    findAll(query: StaffQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./staff.types").StaffResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findById(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./staff.types").StaffResponse>>;
    create(dto: CreateStaffDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./staff.types").StaffResponse>>;
    update(id: string, dto: UpdateStaffDto): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./staff.types").StaffResponse>>;
    delete(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    restore(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./staff.types").StaffResponse>>;
    activate(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./staff.types").StaffResponse>>;
    deactivate(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./staff.types").StaffResponse>>;
    suspend(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./staff.types").StaffResponse>>;
    lock(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./staff.types").StaffResponse>>;
    unlock(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./staff.types").StaffResponse>>;
}
