import type { JwtPayload } from "../../domains/auth/services/jwt.service";
import { AiPromptService } from './ai-prompt.service';
import { UpdatePromptTemplateDto } from './ai-prompt.types';
export declare class AiPromptController {
    private readonly service;
    constructor(service: AiPromptService);
    list(): Promise<import("@common/responses/response.builder").ResponsePayload<{
        templates: import("./ai-prompt.types").PromptTemplate[];
        variables: ("category" | "brand" | "occasion" | "tags" | "color" | "fabric" | "pattern" | "fit" | "product_fields" | "rules" | "product_name" | "subcategory" | "sleeve" | "neck" | "material" | "collection")[];
        accuracyRule: string;
    }>>;
    get(type: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./ai-prompt.types").PromptTemplate>>;
    history(type: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./ai-prompt.types").PromptTemplate[]>>;
    update(user: JwtPayload, type: string, dto: UpdatePromptTemplateDto): Promise<import("@common/responses/response.builder").ResponsePayload<import("./ai-prompt.types").PromptTemplate>>;
    reset(user: JwtPayload, type: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./ai-prompt.types").PromptTemplate>>;
}
