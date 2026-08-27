import { SupportService } from './support.service';
import { CreateContactMessageDto, CreateSupportTicketDto, CreateSupportReplyDto, UpdateTicketStatusDto, ContactQueryDto, TicketQueryDto } from './support.types';
import { PrismaService } from "../../database/prisma.service";
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class SupportController {
    private readonly supportService;
    private readonly prisma;
    constructor(supportService: SupportService, prisma: PrismaService);
    private isStaffMember;
    private resolveCustomerId;
    createContact(dto: CreateContactMessageDto): Promise<import("@common/responses/response.builder").ResponsePayload<import("./support.types").ContactMessageResponse>>;
    findContacts(query: ContactQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./support.types").ContactMessageResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    updateContactStatus(id: string, dto: UpdateTicketStatusDto): Promise<import("@common/responses/response.builder").ResponsePayload<import("./support.types").ContactMessageResponse>>;
    findTickets(query: TicketQueryDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<never[]> | import("@common/responses/response.builder").ResponsePayload<{
        data: import("./support.types").SupportTicketResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findTicketById(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./support.types").SupportTicketResponse>>;
    createTicket(dto: CreateSupportTicketDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./support.types").SupportTicketResponse>>;
    updateTicketStatus(id: string, dto: UpdateTicketStatusDto): Promise<import("@common/responses/response.builder").ResponsePayload<import("./support.types").SupportTicketResponse>>;
    addReply(id: string, dto: CreateSupportReplyDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./support.types").SupportReplyResponse>>;
}
