import { AuditService } from "../audit/audit.service";
import { SupportRepository } from './support.repository';
import { CreateContactMessageDto, CreateSupportTicketDto, CreateSupportReplyDto, UpdateTicketStatusDto, ContactQueryDto, TicketQueryDto, ContactMessageResponse, SupportTicketResponse, SupportReplyResponse } from './support.types';
export declare class SupportService {
    private readonly supportRepository;
    private readonly auditService;
    constructor(supportRepository: SupportRepository, auditService: AuditService);
    private toContactResponse;
    private toReplyResponse;
    private toTicketResponse;
    findContacts(query: ContactQueryDto): Promise<{
        data: ContactMessageResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    createContact(dto: CreateContactMessageDto): Promise<ContactMessageResponse>;
    updateContactStatus(id: string, status: string, assignedTo?: string): Promise<ContactMessageResponse>;
    findTickets(query: TicketQueryDto): Promise<{
        data: SupportTicketResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findTicketById(id: string): Promise<SupportTicketResponse>;
    createTicket(userId: string, dto: CreateSupportTicketDto): Promise<SupportTicketResponse>;
    updateTicketStatus(id: string, dto: UpdateTicketStatusDto): Promise<SupportTicketResponse>;
    addReply(ticketId: string, dto: CreateSupportReplyDto, isStaff: boolean): Promise<SupportReplyResponse>;
}
