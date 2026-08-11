import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_METADATA } from '@common/constants';

@Injectable()
export class StartupVersionService {
  constructor(private readonly configService: ConfigService) {}

  getAppVersion(): string {
    return APP_METADATA.VERSION;
  }

  getNodeVersion(): string {
    return process.version;
  }

  getNestVersion(): string {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pkg = require('@nestjs/core/package.json');
      return `v${pkg.version}`;
    } catch {
      return 'v11.x';
    }
  }

  getEnv(): string {
    return this.configService.get<string>('app.env', 'development');
  }

  getPort(): number {
    return this.configService.get<number>('app.port', 4000);
  }

  getHostname(): string {
    return this.configService.get<string>('app.hostname', 'localhost');
  }

  getApiPrefix(): string {
    return APP_METADATA.API_PREFIX;
  }
}
