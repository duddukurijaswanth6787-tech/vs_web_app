export interface CreateSupportTicketDto {
  subject: string;
  description: string;
  category?: string;
  priority?: string;
}

export interface CreateSupportReplyDto {
  message: string;
  attachments?: string[];
}

export interface SupportReplyResponse {
  id: string;
  ticketId: string;
  message: string;
  attachments?: string[];
  senderType?: string;
  createdAt: string;
}

export interface SupportTicketResponse {
  id: string;
  orderNumber?: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  replies: SupportReplyResponse[];
}
