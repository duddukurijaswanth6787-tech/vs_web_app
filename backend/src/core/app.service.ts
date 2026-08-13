import { Injectable } from '@nestjs/common';

/**
 * Root Application Service containing core hello-world messages.
 */
@Injectable()
export class AppService {
  /**
   * Returns a standard greeting message.
   */
  getHello() {
    return {
      status: 'online',
      name: "Vasanthi's Signature API",
      version: '1.0.0',
      health: '/health',
      docs: '/api/docs',
      apiVersion: 'api/v1',
    };
  }
}
