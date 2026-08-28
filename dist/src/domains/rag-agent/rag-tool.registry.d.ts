import { PrismaService } from "../../database/prisma.service";
import { SearchService } from "../search/search.service";
import { ProductsService } from "../products/products.service";
export interface RagToolContext {
    userId?: string;
    guestId?: string;
    isAdmin?: boolean;
}
export interface RagTool {
    name: string;
    description: string;
    execute(context: RagToolContext, input: any): Promise<any>;
}
export declare class RagToolRegistry {
    private readonly prisma;
    private readonly searchService;
    private readonly productsService;
    private readonly tools;
    constructor(prisma: PrismaService, searchService: SearchService, productsService: ProductsService);
    getTool(name: string): RagTool | undefined;
    getAllTools(): RagTool[];
    private register;
    private registerTools;
}
