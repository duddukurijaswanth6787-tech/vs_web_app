import { OtpGatewayService } from './otp-gateway.service';
import { UpdateOtpGatewayConfigDto } from './otp-gateway.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class OtpGatewayController {
    private readonly otpGatewayService;
    constructor(otpGatewayService: OtpGatewayService);
    getConfig(): Promise<import("@common/responses/response.builder").ResponsePayload<import("./otp-gateway.types").OtpGatewayConfigResponse>>;
    listTemplates(): Promise<import("@common/responses/response.builder").ResponsePayload<import("./otp-gateway.types").OtpTemplateOption[]>>;
    updateConfig(dto: UpdateOtpGatewayConfigDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./otp-gateway.types").OtpGatewayConfigResponse>>;
}
