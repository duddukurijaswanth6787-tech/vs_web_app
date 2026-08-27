"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagIngestionWorker = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const rag_ingestion_service_1 = require("./rag-ingestion.service");
let RagIngestionWorker = class RagIngestionWorker extends bullmq_1.WorkerHost {
    ingestionService;
    constructor(ingestionService) {
        super();
        this.ingestionService = ingestionService;
    }
    async process(job) {
        const { sourceId } = job.data;
        await this.ingestionService.processIngestion(sourceId);
    }
};
exports.RagIngestionWorker = RagIngestionWorker;
exports.RagIngestionWorker = RagIngestionWorker = __decorate([
    (0, bullmq_1.Processor)('rag-ingestion'),
    __metadata("design:paramtypes", [rag_ingestion_service_1.RagIngestionService])
], RagIngestionWorker);
//# sourceMappingURL=rag-ingestion.worker.js.map