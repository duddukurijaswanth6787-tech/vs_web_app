"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityUtils = void 0;
class SecurityUtils {
    static getClientIp(req) {
        const forwardedFor = req.headers['x-forwarded-for'];
        if (forwardedFor) {
            const ipList = typeof forwardedFor === 'string'
                ? forwardedFor.split(',')
                : forwardedFor;
            if (ipList && ipList.length > 0) {
                return ipList[0].trim();
            }
        }
        const realIp = req.headers['x-real-ip'];
        if (typeof realIp === 'string') {
            return realIp;
        }
        return req.ip || req.socket.remoteAddress || '';
    }
    static getUserAgent(req) {
        return req.headers['user-agent'] || 'Unknown';
    }
    static isValidOrigin(origin, allowedOrigins) {
        if (allowedOrigins.includes('*')) {
            return true;
        }
        return allowedOrigins.includes(origin);
    }
    static maskIp(ip) {
        if (!ip)
            return '';
        const parts = ip.split('.');
        if (parts.length === 4) {
            parts[3] = 'xxx';
            return parts.join('.');
        }
        return ip;
    }
}
exports.SecurityUtils = SecurityUtils;
//# sourceMappingURL=security.utils.js.map