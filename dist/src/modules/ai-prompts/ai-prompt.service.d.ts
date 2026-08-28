import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../domains/audit/audit.service";
import { PromptTemplate, UpdatePromptTemplateDto } from './ai-prompt.types';
export declare class AiPromptService {
    private readonly prisma;
    private readonly auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    private readJson;
    private writeJson;
    list(): Promise<PromptTemplate[]>;
    get(type: string): Promise<PromptTemplate>;
    listWithMeta(): Promise<{
        templates: PromptTemplate[];
        variables: ("category" | "brand" | "occasion" | "tags" | "color" | "fabric" | "pattern" | "fit" | "product_fields" | "rules" | "product_name" | "subcategory" | "sleeve" | "neck" | "material" | "collection")[];
        accuracyRule: string;
    }>;
    update(userId: string, type: string, dto: UpdatePromptTemplateDto): Promise<PromptTemplate>;
    history(type: string): Promise<PromptTemplate[]>;
    reset(userId: string, type: string): Promise<PromptTemplate>;
}
