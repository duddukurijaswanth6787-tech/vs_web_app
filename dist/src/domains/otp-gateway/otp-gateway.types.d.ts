export declare const OTP_GATEWAY_PROVIDERS: readonly ["mock", "startmessaging"];
export type OtpGatewayProvider = (typeof OTP_GATEWAY_PROVIDERS)[number];
export interface OtpTemplateOption {
    id: string;
    body: string;
    usesAppName: boolean;
    usesExpiry: boolean;
}
export declare const STARTMESSAGING_TEMPLATES: OtpTemplateOption[];
export declare class OtpGatewayConfigResponse {
    provider: OtpGatewayProvider;
    appName: string;
    templateLogin: string;
    templateRegister: string;
    templateVerifyPhone: string;
    templateOrderConfirmed: string;
    expiryMinutes: number;
    apiKeyConfigured: boolean;
}
export declare class UpdateOtpGatewayConfigDto {
    provider?: OtpGatewayProvider;
    appName?: string;
    templateLogin?: string;
    templateRegister?: string;
    templateVerifyPhone?: string;
    templateOrderConfirmed?: string;
    expiryMinutes?: number;
    apiKey?: string;
}
