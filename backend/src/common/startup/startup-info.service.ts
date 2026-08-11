import { Injectable } from '@nestjs/common';
import * as os from 'os';

export interface SystemInfo {
  os: string;
  arch: string;
  cpu: string;
  memory: string;
  pid: number;
  gitBranch: string;
  gitCommit: string;
}

@Injectable()
export class StartupInfoService {
  getSystemInfo(): SystemInfo {
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

  private getOsName(): string {
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

  private getCpuModel(): string {
    const cpus = os.cpus();
    if (cpus.length === 0) return 'Unknown';
    const model = cpus[0].model;
    return model.replace(/\s+/g, ' ').trim();
  }

  private getMemoryUsage(): string {
    const used = process.memoryUsage().heapUsed;
    return `${Math.round(used / 1024 / 1024)} MB`;
  }

  private getGitBranch(): string {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { execSync } = require('child_process');
      return execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
    } catch {
      return 'unknown';
    }
  }

  private getGitCommit(): string {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { execSync } = require('child_process');
      return execSync('git rev-parse --short HEAD', {
        encoding: 'utf8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
    } catch {
      return 'unknown';
    }
  }
}
