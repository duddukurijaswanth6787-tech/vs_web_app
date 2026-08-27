export declare class SendOtpDto {
    phone: string;
    purpose?: string;
}
export declare class VerifyOtpDto {
    phone: string;
    code: string;
    purpose?: string;
}
export declare class OtpLoginDto {
    phone: string;
    code: string;
    firstName?: string;
    rememberMe?: boolean;
}
export declare class FirebasePhoneLoginDto {
    idToken: string;
    firstName?: string;
    rememberMe?: boolean;
}
export declare class SendOtpResponse {
    phone: string;
    expiresInSeconds: number;
    purpose: string;
    devCode?: string;
}
