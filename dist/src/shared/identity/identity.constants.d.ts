export declare const IDENTITY_CONSTANTS: {
    readonly DEFAULT_SUPER_ADMIN_ROLE: "super_admin";
    readonly DEFAULT_ADMIN_ROLE: "admin";
    readonly DEFAULT_STAFF_ROLE: "staff";
    readonly DEFAULT_CUSTOMER_ROLE: "customer";
    readonly ROLE_HIERARCHY: {
        readonly super_admin: 100;
        readonly admin: 80;
        readonly staff: 50;
        readonly customer: 10;
    };
    readonly SYSTEM_USER: "system";
    readonly SYSTEM_EMAIL: "system@vasanthidesigners.com";
    readonly SYSTEM_AVATAR: "/avatars/system.png";
    readonly DEFAULT_LANGUAGE: "en";
    readonly DEFAULT_COUNTRY: "IN";
    readonly MAX_LOGIN_ATTEMPTS: 5;
    readonly LOCKOUT_DURATION_MINUTES: 30;
    readonly PASSWORD_HISTORY_COUNT: 5;
    readonly SESSION_EXPIRY_HOURS: 24;
    readonly REFRESH_TOKEN_EXPIRY_DAYS: 7;
    readonly EMAIL_VERIFICATION_EXPIRY_HOURS: 24;
    readonly OTP_EXPIRY_MINUTES: 10;
};
