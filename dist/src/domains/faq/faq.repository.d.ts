import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class FaqRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        search?: string;
        category?: string;
        isActive?: boolean;
        page: number;
        limit: number;
    }): Promise<{
        data: {
            id: string;
            slug: string;
            displayOrder: number;
            createdAt: Date;
            updatedAt: Date;
            category: string | null;
            isActive: boolean;
            helpfulCount: number;
            answer: string;
            question: string;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<{
        id: string;
        slug: string;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        category: string | null;
        isActive: boolean;
        helpfulCount: number;
        answer: string;
        question: string;
    } | null>;
    create(data: Prisma.FaqCreateInput): Promise<{
        id: string;
        slug: string;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        category: string | null;
        isActive: boolean;
        helpfulCount: number;
        answer: string;
        question: string;
    }>;
    update(id: string, data: Prisma.FaqUpdateInput): Promise<{
        id: string;
        slug: string;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        category: string | null;
        isActive: boolean;
        helpfulCount: number;
        answer: string;
        question: string;
    }>;
    incrementHelpful(id: string): Promise<{
        id: string;
        slug: string;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        category: string | null;
        isActive: boolean;
        helpfulCount: number;
        answer: string;
        question: string;
    }>;
    findBySlug(slug: string): Promise<{
        id: string;
        slug: string;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        category: string | null;
        isActive: boolean;
        helpfulCount: number;
        answer: string;
        question: string;
    } | null>;
    getCategories(): Promise<{
        name: string;
        slug: string;
        faqCount: number;
    }[]>;
}
