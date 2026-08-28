"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuesModule = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const isBullMQEnabled = process.env.ENABLE_BULLMQ !== 'false';
const imports = [];
const providers = [];
const exportsArray = [];
if (isBullMQEnabled) {
    imports.push(bullmq_1.BullModule.forRootAsync({
        imports: [config_1.ConfigModule],
        useFactory: (configService) => ({
            prefix: configService.get('app.bullmq.prefix') ||
                process.env.BULLMQ_PREFIX ||
                'vasanthi',
            connection: {
                host: configService.get('app.redis.host', 'localhost'),
                port: configService.get('app.redis.port', 6379),
                password: configService.get('app.redis.password', ''),
                db: configService.get('app.redis.db', 0),
            },
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: false,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
            },
        }),
        inject: [config_1.ConfigService],
    }), bullmq_1.BullModule.registerQueue({
        name: 'rag-ingestion',
    }), bullmq_1.BullModule.registerQueue({
        name: 'report-export',
    }));
    exportsArray.push(bullmq_1.BullModule);
}
else {
    const mockQueueProvider = {
        provide: 'BullQueue_rag-ingestion',
        useValue: {
            client: Promise.resolve({
                ping: async () => 'PONG',
            }),
        },
    };
    const mockReportQueueProvider = {
        provide: 'BullQueue_report-export',
        useValue: {
            add: async (name, data) => {
                console.log('Mock Queue: report-export job added:', name, data);
                return { id: 'mock-job-id' };
            },
            client: Promise.resolve({
                ping: async () => 'PONG',
            }),
        },
    };
    providers.push(mockQueueProvider, mockReportQueueProvider);
    exportsArray.push(mockQueueProvider, mockReportQueueProvider);
}
let QueuesModule = class QueuesModule {
};
exports.QueuesModule = QueuesModule;
exports.QueuesModule = QueuesModule = __decorate([
    (0, common_1.Module)({
        imports,
        providers,
        exports: exportsArray,
    })
], QueuesModule);
//# sourceMappingURL=queues.module.js.map