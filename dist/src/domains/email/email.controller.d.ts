import { EmailService } from './email.service';
import { SendEmailDto } from './email.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class EmailController {
    private readonly emailService;
    constructor(emailService: EmailService);
    send(user: JwtPayload, dto: SendEmailDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        error: string | null;
        id: string;
        status: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string | null;
        template: string;
        subject: string;
        toEmail: string;
        providerRef: string | null;
    }>>;
    logs(page?: string, limit?: string): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: {
            error: string | null;
            id: string;
            status: string;
            createdAt: Date;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            userId: string | null;
            template: string;
            subject: string;
            toEmail: string;
            providerRef: string | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>>;
}
