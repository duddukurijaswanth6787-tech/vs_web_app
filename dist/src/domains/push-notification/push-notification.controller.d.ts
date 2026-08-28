import { PushNotificationService } from './push-notification.service';
import { RegisterDeviceDto, SendPushDto } from './push-notification.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class PushNotificationController {
    private readonly pushService;
    constructor(pushService: PushNotificationService);
    register(user: JwtPayload, dto: RegisterDeviceDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        platform: string;
        token: string;
        userId: string;
        deviceName: string | null;
        lastUsedAt: Date | null;
    }>>;
    myDevices(user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        platform: string;
        token: string;
        userId: string;
        deviceName: string | null;
        lastUsedAt: Date | null;
    }[]>>;
    unregister(user: JwtPayload, token: string): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        platform: string;
        token: string;
        userId: string;
        deviceName: string | null;
        lastUsedAt: Date | null;
    }>>;
    send(user: JwtPayload, dto: SendPushDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        error: string | null;
        id: string;
        status: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue | null;
        title: string;
        userId: string | null;
        body: string;
        targetCount: number;
        successCount: number;
    }>>;
    logs(page?: string, limit?: string): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: {
            error: string | null;
            id: string;
            status: string;
            createdAt: Date;
            data: import("@prisma/client/runtime/client").JsonValue | null;
            title: string;
            userId: string | null;
            body: string;
            targetCount: number;
            successCount: number;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>>;
}
