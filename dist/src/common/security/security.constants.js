"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECURITY_CONSTANTS = void 0;
exports.SECURITY_CONSTANTS = {
    MAX_JSON_SIZE: '2mb',
    MAX_URLENCODED_SIZE: '2mb',
    DEFAULT_THROTTLE_TTL: 60,
    DEFAULT_THROTTLE_LIMIT: 100,
    TRUSTED_HEADERS: [
        'x-correlation-id',
        'x-request-id',
        'x-forwarded-for',
        'x-real-ip',
    ],
    COOKIE_NAMES: {
        SESSION: 'vd_session',
        CSRF: 'vd_csrf',
    },
    ERROR_CODES: {
        SEC_001: 'SEC_001',
        SEC_002: 'SEC_002',
    },
    CORRELATION_ID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};
//# sourceMappingURL=security.constants.js.map