import { Request } from 'express';
export declare class SecurityUtils {
    static getClientIp(req: Request): string;
    static getUserAgent(req: Request): string;
    static isValidOrigin(origin: string, allowedOrigins: string[]): boolean;
    static maskIp(ip: string): string;
}
