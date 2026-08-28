export declare const ERROR_CODES: {
    readonly AUTH_001: "AUTH_001";
    readonly AUTH_002: "AUTH_002";
    readonly SYSTEM_001: "SYSTEM_001";
    readonly DATABASE_001: "DATABASE_001";
    readonly DATABASE_002: "DATABASE_002";
    readonly DATABASE_003: "DATABASE_003";
    readonly DATABASE_TIMEOUT: "DATABASE_TIMEOUT";
    readonly DATABASE_CONSTRAINT: "DATABASE_CONSTRAINT";
    readonly DATABASE_RECORD_NOT_FOUND: "DATABASE_RECORD_NOT_FOUND";
    readonly CONFIG_001: "CONFIG_001";
    readonly VALIDATION_001: "VALIDATION_001";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly INVALID_FILE: "INVALID_FILE";
    readonly INVALID_REQUEST: "INVALID_REQUEST";
    readonly BUSINESS_RULE_FAILED: "BUSINESS_RULE_FAILED";
    readonly INVALID_OPERATION: "INVALID_OPERATION";
    readonly RESOURCE_CONFLICT: "RESOURCE_CONFLICT";
    readonly CACHE_FAILURE: "CACHE_FAILURE";
    readonly QUEUE_FAILURE: "QUEUE_FAILURE";
    readonly EMAIL_FAILURE: "EMAIL_FAILURE";
    readonly SMS_FAILURE: "SMS_FAILURE";
    readonly STORAGE_FAILURE: "STORAGE_FAILURE";
    readonly PAYMENT_PROVIDER_FAILURE: "PAYMENT_PROVIDER_FAILURE";
    readonly SHIPPING_PROVIDER_FAILURE: "SHIPPING_PROVIDER_FAILURE";
    readonly THIRD_PARTY_TIMEOUT: "THIRD_PARTY_TIMEOUT";
};
export declare const APP_METADATA: {
    readonly NAME: "Vasanthi Designers";
    readonly VERSION: "1.0.0";
    readonly API_PREFIX: "api/v1";
    readonly DEFAULT_TIMEZONE: "Asia/Kolkata";
    readonly DEFAULT_COUNTRY: "IN";
    readonly DEFAULT_CURRENCY: "INR";
    readonly DEFAULT_LANGUAGE: "en";
};
export declare const PAGINATION_DEFAULTS: {
    readonly PAGE: 1;
    readonly LIMIT: 10;
    readonly MAX_LIMIT: 100;
};
export declare const FILE_LIMITS: {
    readonly MAX_FILE_SIZE: number;
    readonly ALLOWED_MIME_TYPES: readonly ["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf", "video/mp4"];
};
export declare const PASSWORD_RULES: {
    readonly MIN_LENGTH: 8;
    readonly REQUIRE_UPPERCASE: true;
    readonly REQUIRE_LOWERCASE: true;
    readonly REQUIRE_NUMBER: true;
    readonly REQUIRE_SPECIAL_CHARACTER: true;
};
