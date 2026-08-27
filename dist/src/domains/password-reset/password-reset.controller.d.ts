import type { Request } from 'express';
import { PasswordResetService } from './password-reset.service';
import { ForgotPasswordDto, ResetPasswordDto, ValidateTokenDto } from './password-reset.types';
export declare class PasswordResetController {
    private readonly passwordResetService;
    constructor(passwordResetService: PasswordResetService);
    forgot(dto: ForgotPasswordDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        message: string;
    }>>;
    reset(dto: ResetPasswordDto, req: Request): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        message: string;
    }>>;
    validateToken(dto: ValidateTokenDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        valid: boolean;
    }>>;
}
