export declare class CreateContactMessageDto {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
}
export declare class CreateSupportTicketDto {
    subject: string;
    description: string;
    category?: string;
    priority?: string;
}
export declare class CreateSupportReplyDto {
    message: string;
    attachments?: string[];
}
export declare class UpdateTicketStatusDto {
    status?: string;
    assignedTo?: string;
    priority?: string;
}
export declare class ContactMessageResponse {
    id: string;
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    status: string;
    assignedTo?: string;
    createdAt: Date;
}
export declare class SupportReplyResponse {
    id: string;
    message: string;
    isStaff: boolean;
    attachments: string[];
    createdAt: Date;
}
export declare class SupportTicketResponse {
    id: string;
    ticketNumber: string;
    customerId?: string;
    customerName?: string;
    subject: string;
    description: string;
    category?: string;
    priority: string;
    status: string;
    assignedTo?: string;
    replies?: SupportReplyResponse[];
    createdAt: Date;
}
export declare class ContactQueryDto {
    status?: string;
    page?: number;
    limit?: number;
}
export declare class TicketQueryDto {
    status?: string;
    priority?: string;
    customerId?: string;
    page?: number;
    limit?: number;
}
