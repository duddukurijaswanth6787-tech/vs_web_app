import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class SupportRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findContacts(params: {
        status?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: {
            id: string;
            name: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            email: string;
            message: string;
            subject: string;
            assignedTo: string | null;
            repliedAt: Date | null;
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
    createContact(data: Prisma.ContactMessageCreateInput): Promise<{
        id: string;
        name: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        email: string;
        message: string;
        subject: string;
        assignedTo: string | null;
        repliedAt: Date | null;
    }>;
    findContactById(id: string): Promise<{
        id: string;
        name: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        email: string;
        message: string;
        subject: string;
        assignedTo: string | null;
        repliedAt: Date | null;
    } | null>;
    updateContact(id: string, data: Prisma.ContactMessageUpdateInput): Promise<{
        id: string;
        name: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        email: string;
        message: string;
        subject: string;
        assignedTo: string | null;
        repliedAt: Date | null;
    }>;
    findTickets(params: {
        status?: string;
        priority?: string;
        customerId?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: ({
            customer: ({
                user: {
                    firstName: string;
                    lastName: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                phone: string | null;
                gender: string | null;
                userId: string;
                profileImage: string | null;
                dateOfBirth: Date | null;
                preferredLanguage: string;
                preferredCurrency: string;
                preferredCategories: string[];
                preferredBrands: string[];
                preferredSizes: string[];
                preferredColors: string[];
                preferredPriceMin: Prisma.Decimal | null;
                preferredPriceMax: Prisma.Decimal | null;
                companyName: string | null;
                gstin: string | null;
                taxExempt: boolean;
            }) | null;
        } & {
            id: string;
            description: string;
            status: string;
            createdBy: string | null;
            updatedBy: string | null;
            createdAt: Date;
            updatedAt: Date;
            category: string | null;
            priority: string;
            customerId: string | null;
            subject: string;
            assignedTo: string | null;
            ticketNumber: string;
            resolvedAt: Date | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findTicketById(id: string): Promise<({
        customer: ({
            user: {
                firstName: string;
                lastName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            gender: string | null;
            userId: string;
            profileImage: string | null;
            dateOfBirth: Date | null;
            preferredLanguage: string;
            preferredCurrency: string;
            preferredCategories: string[];
            preferredBrands: string[];
            preferredSizes: string[];
            preferredColors: string[];
            preferredPriceMin: Prisma.Decimal | null;
            preferredPriceMax: Prisma.Decimal | null;
            companyName: string | null;
            gstin: string | null;
            taxExempt: boolean;
        }) | null;
        replies: {
            id: string;
            createdBy: string | null;
            createdAt: Date;
            message: string;
            attachments: string[];
            isStaff: boolean;
            ticketId: string;
        }[];
    } & {
        id: string;
        description: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        category: string | null;
        priority: string;
        customerId: string | null;
        subject: string;
        assignedTo: string | null;
        ticketNumber: string;
        resolvedAt: Date | null;
    }) | null>;
    createTicket(data: Prisma.SupportTicketCreateInput): Promise<{
        id: string;
        description: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        category: string | null;
        priority: string;
        customerId: string | null;
        subject: string;
        assignedTo: string | null;
        ticketNumber: string;
        resolvedAt: Date | null;
    }>;
    updateTicket(id: string, data: Prisma.SupportTicketUpdateInput): Promise<{
        id: string;
        description: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        category: string | null;
        priority: string;
        customerId: string | null;
        subject: string;
        assignedTo: string | null;
        ticketNumber: string;
        resolvedAt: Date | null;
    }>;
    createReply(data: Prisma.SupportReplyCreateInput): Promise<{
        id: string;
        createdBy: string | null;
        createdAt: Date;
        message: string;
        attachments: string[];
        isStaff: boolean;
        ticketId: string;
    }>;
    generateTicketNumber(): Promise<string>;
}
