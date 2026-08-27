import { OrderService } from './order.service';
import { OrderQueryDto } from './order.types';
import { PrismaService } from "../../database/prisma.service";
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class OrderController {
    private readonly orderService;
    private readonly prisma;
    constructor(orderService: OrderService, prisma: PrismaService);
    private resolveCustomerId;
    findAll(query: OrderQueryDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./order.types").OrderResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findByOrderNumber(orderNumber: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null> | import("@common/responses/response.builder").ResponsePayload<import("./order.types").OrderResponse>>;
    findById(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null> | import("@common/responses/response.builder").ResponsePayload<import("./order.types").OrderResponse>>;
    updateStatus(id: string, body: {
        status: string;
        message?: string;
    }, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./order.types").OrderResponse>>;
}
