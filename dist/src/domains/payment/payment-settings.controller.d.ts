import { PaymentService } from './payment.service';
import { UpdateRazorpayConfigDto } from './payment.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class PaymentSettingsController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    getConfig(): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./payment.types").RazorpayConfigResponse>>;
    updateConfig(dto: UpdateRazorpayConfigDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./payment.types").RazorpayConfigResponse>>;
}
