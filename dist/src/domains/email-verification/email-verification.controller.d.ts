import { EmailVerificationService } from './email-verification.service';
import { VerifyEmailDto } from './email-verification.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class EmailVerificationController {
    private readonly emailVerificationService;
    constructor(emailVerificationService: EmailVerificationService);
    send(user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        message: string;
    }>>;
    verify(dto: VerifyEmailDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        message: string;
    }>>;
    resend(user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        message: string;
    }>>;
    validateToken(dto: VerifyEmailDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        valid: boolean;
    }>>;
}
