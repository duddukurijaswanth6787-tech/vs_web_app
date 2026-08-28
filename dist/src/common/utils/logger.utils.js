"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskSensitiveData = maskSensitiveData;
function maskSensitiveData(data) {
    if (!data || typeof data !== 'object') {
        return data;
    }
    if (Array.isArray(data)) {
        return data.map((item) => maskSensitiveData(item));
    }
    const sensitiveKeys = [
        'password',
        'token',
        'jwt',
        'authorization',
        'secret',
        'apikey',
        'api_key',
        'otp',
        'card',
        'payment',
        'cookie',
        'access_token',
        'refresh_token',
    ];
    const obj = data;
    const masked = {};
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveKeys.some((sKey) => lowerKey.includes(sKey));
        if (isSensitive) {
            masked[key] = '***MASKED***';
        }
        else if (typeof value === 'object') {
            masked[key] = maskSensitiveData(value);
        }
        else {
            masked[key] = value;
        }
    }
    return masked;
}
//# sourceMappingURL=logger.utils.js.map