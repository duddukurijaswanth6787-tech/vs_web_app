"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDENTITY_CONSTANTS = void 0;
exports.IDENTITY_CONSTANTS = {
    DEFAULT_SUPER_ADMIN_ROLE: 'super_admin',
    DEFAULT_ADMIN_ROLE: 'admin',
    DEFAULT_STAFF_ROLE: 'staff',
    DEFAULT_CUSTOMER_ROLE: 'customer',
    ROLE_HIERARCHY: {
        super_admin: 100,
        admin: 80,
        staff: 50,
        customer: 10,
    },
    SYSTEM_USER: 'system',
    SYSTEM_EMAIL: 'system@vasanthidesigners.com',
    SYSTEM_AVATAR: '/avatars/system.png',
    DEFAULT_LANGUAGE: 'en',
    DEFAULT_COUNTRY: 'IN',
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 30,
    PASSWORD_HISTORY_COUNT: 5,
    SESSION_EXPIRY_HOURS: 24,
    REFRESH_TOKEN_EXPIRY_DAYS: 7,
    EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
    OTP_EXPIRY_MINUTES: 10,
};
//# sourceMappingURL=identity.constants.js.map