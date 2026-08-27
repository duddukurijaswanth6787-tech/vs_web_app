"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageUtils = void 0;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = require("path");
const MIME_EXTENSIONS = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/avif': '.avif',
    'application/pdf': '.pdf',
    'video/mp4': '.mp4',
    'text/csv': '.csv',
};
class StorageUtils {
    static generateFilename(originalName) {
        const ext = (0, path_1.extname)(originalName) || '';
        return `${crypto_1.default.randomUUID()}${ext}`;
    }
    static generateKey(folder, entityId, mimeType) {
        const uuid = crypto_1.default.randomUUID();
        const ext = mimeType ? (MIME_EXTENSIONS[mimeType] ?? '') : '';
        const parts = [folder, entityId, `${uuid}${ext}`].filter(Boolean);
        return parts.join('/');
    }
    static assertSafePath(filePath) {
        if (filePath.includes('..') ||
            filePath.startsWith('/') ||
            filePath.startsWith('\\')) {
            throw new Error('INVALID_STORAGE_PATH');
        }
    }
}
exports.StorageUtils = StorageUtils;
//# sourceMappingURL=storage.utils.js.map