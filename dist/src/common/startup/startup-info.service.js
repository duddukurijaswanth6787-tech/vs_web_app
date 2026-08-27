"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartupInfoService = void 0;
const common_1 = require("@nestjs/common");
const os = __importStar(require("os"));
let StartupInfoService = class StartupInfoService {
    getSystemInfo() {
        return {
            os: this.getOsName(),
            arch: os.arch(),
            cpu: this.getCpuModel(),
            memory: this.getMemoryUsage(),
            pid: process.pid,
            gitBranch: this.getGitBranch(),
            gitCommit: this.getGitCommit(),
        };
    }
    getOsName() {
        const platform = os.platform();
        switch (platform) {
            case 'win32': {
                const release = os.release();
                const build = release.split('.').pop();
                const major = parseInt(release.split('.')[0], 10);
                return major >= 10
                    ? `Windows 11 (Build ${build})`
                    : `Windows ${release}`;
            }
            case 'darwin':
                return `macOS ${os.release()}`;
            case 'linux':
                return `Linux ${os.release()}`;
            default:
                return `${platform} ${os.release()}`;
        }
    }
    getCpuModel() {
        const cpus = os.cpus();
        if (cpus.length === 0)
            return 'Unknown';
        const model = cpus[0].model;
        return model.replace(/\s+/g, ' ').trim();
    }
    getMemoryUsage() {
        const used = process.memoryUsage().heapUsed;
        return `${Math.round(used / 1024 / 1024)} MB`;
    }
    getGitBranch() {
        try {
            const { execSync } = require('child_process');
            return execSync('git rev-parse --abbrev-ref HEAD', {
                encoding: 'utf8',
                timeout: 5000,
                stdio: ['pipe', 'pipe', 'pipe'],
            }).trim();
        }
        catch {
            return 'unknown';
        }
    }
    getGitCommit() {
        try {
            const { execSync } = require('child_process');
            return execSync('git rev-parse --short HEAD', {
                encoding: 'utf8',
                timeout: 5000,
                stdio: ['pipe', 'pipe', 'pipe'],
            }).trim();
        }
        catch {
            return 'unknown';
        }
    }
};
exports.StartupInfoService = StartupInfoService;
exports.StartupInfoService = StartupInfoService = __decorate([
    (0, common_1.Injectable)()
], StartupInfoService);
//# sourceMappingURL=startup-info.service.js.map