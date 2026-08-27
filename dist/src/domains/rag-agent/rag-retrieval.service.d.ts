import { PrismaService } from "../../database/prisma.service";
import { RetrievalResult } from './rag-agent.types';
export declare class RagRetrievalService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    retrieve(params: {
        agentId: string;
        query: string;
        queryEmbedding: number[];
        limit?: number;
        minScore?: number;
    }): Promise<RetrievalResult[]>;
}
