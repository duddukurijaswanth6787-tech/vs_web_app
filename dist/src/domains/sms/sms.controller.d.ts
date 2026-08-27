import { SmsService } from './sms.service';
import { SendSmsDto, SendOrderSmsDto } from './sms.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class SmsController {
    private readonly smsService;
    constructor(smsService: SmsService);
    send(user: JwtPayload, dto: SendSmsDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        error: string | null;
        id: string;
        status: string;
        createdAt: Date;
        phone: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string | null;
        message: string;
        template: string;
        providerRef: string | null;
    }>>;
    orderSms(user: JwtPayload, dto: SendOrderSmsDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        error: string | null;
        id: string;
        status: string;
        createdAt: Date;
        phone: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string | null;
        message: string;
        template: string;
        providerRef: string | null;
    }>>;
    logs(page?: string, limit?: string): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: {
            error: string | null;
            id: string;
            status: string;
            createdAt: Date;
            phone: string;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            userId: string | null;
            message: string;
            template: string;
            providerRef: string | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>>;
}
