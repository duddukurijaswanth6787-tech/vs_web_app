import type { Request, Response } from 'express';
import { OtpService } from './otp.service';
import { SendOtpDto, VerifyOtpDto, OtpLoginDto, FirebasePhoneLoginDto } from './otp.types';
export declare class OtpController {
    private readonly otpService;
    constructor(otpService: OtpService);
    send(dto: SendOtpDto): Promise<import("@common/responses/response.builder").ResponsePayload<import("./otp.types").SendOtpResponse>>;
    verify(dto: VerifyOtpDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        verified: boolean;
        phone: string;
    }>>;
    login(dto: OtpLoginDto, req: Request, res: Response): Promise<import("@common/responses/response.builder").ResponsePayload<Omit<import("../auth").AuthTokensResponse, "refreshToken">>>;
    firebaseLogin(dto: FirebasePhoneLoginDto, req: Request, res: Response): Promise<import("@common/responses/response.builder").ResponsePayload<Omit<import("../auth").AuthTokensResponse, "refreshToken">>>;
}
