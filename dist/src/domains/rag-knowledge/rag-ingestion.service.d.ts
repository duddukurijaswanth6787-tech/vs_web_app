import { PrismaService } from "../../database/prisma.service";
import { RagKnowledgeRepository } from './rag-knowledge.repository';
import { EmbeddingProviderRegistry } from '../rag-agent/rag-providers.service';
import { ConfigService } from '@nestjs/config';
import { StorageService } from "../../infrastructure/storage/storage.service";
export declare class RagIngestionService {
    private readonly prisma;
    private readonly repository;
    private readonly embeddingRegistry;
    private readonly configService;
    private readonly storageService;
    private readonly logger;
    constructor(prisma: PrismaService, repository: RagKnowledgeRepository, embeddingRegistry: EmbeddingProviderRegistry, configService: ConfigService, storageService: StorageService);
    processIngestion(sourceId: string): Promise<void>;
    private splitIntoChunks;
}
