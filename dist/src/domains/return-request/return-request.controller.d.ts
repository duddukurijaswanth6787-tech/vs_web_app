import { ReturnRequestService } from './return-request.service';
import { CreateReturnDto, UpdateReturnStatusDto, ReturnQueryDto } from './return-request.types';
import { PrismaService } from "../../database/prisma.service";
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class ReturnRequestController {
    private readonly returnService;
    private readonly prisma;
    constructor(returnService: ReturnRequestService, prisma: PrismaService);
    private isAdmin;
    private resolveCustomerId;
    findAll(query: ReturnQueryDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./return-request.types").ReturnRequestResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }> | import("@common/responses/response.builder").ResponsePayload<{
        data: never[];
        meta: {};
    }>>;
    findById(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./return-request.types").ReturnRequestResponse>>;
    create(dto: CreateReturnDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./return-request.types").ReturnRequestResponse>>;
    updateStatus(id: string, dto: UpdateReturnStatusDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./return-request.types").ReturnRequestResponse>>;
}
