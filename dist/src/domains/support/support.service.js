"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const support_repository_1 = require("./support.repository");
let SupportService = class SupportService {
    supportRepository;
    auditService;
    constructor(supportRepository, auditService) {
        this.supportRepository = supportRepository;
        this.auditService = auditService;
    }
    toContactResponse(c) {
        return {
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone ?? undefined,
            subject: c.subject,
            message: c.message,
            status: c.status,
            assignedTo: c.assignedTo ?? undefined,
            createdAt: c.createdAt,
        };
    }
    toReplyResponse(r) {
        return {
            id: r.id,
            message: r.message,
            isStaff: r.isStaff,
            attachments: r.attachments ?? [],
            createdAt: r.createdAt,
        };
    }
    toTicketResponse(t) {
        const customerName = t.customer?.user
            ? [t.customer.user.firstName, t.customer.user.lastName].filter(Boolean).join(' ').trim()
            : undefined;
        return {
            id: t.id,
            ticketNumber: t.ticketNumber,
            customerId: t.customerId ?? undefined,
            customerName: customerName || undefined,
            subject: t.subject,
            description: t.description,
            category: t.category ?? undefined,
            priority: t.priority,
            status: t.status,
            assignedTo: t.assignedTo ?? undefined,
            replies: t.replies?.map((r) => this.toReplyResponse(r)),
            createdAt: t.createdAt,
        };
    }
    async findContacts(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.supportRepository.findContacts({
            status: query.status,
            page,
            limit,
        });
        return {
            data: result.data.map((c) => this.toContactResponse(c)),
            meta: result.meta,
        };
    }
    async createContact(dto) {
        const contact = await this.supportRepository.createContact({
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            subject: dto.subject,
            message: dto.message,
            status: 'NEW',
        });
        return this.toContactResponse(contact);
    }
    async updateContactStatus(id, status, assignedTo) {
        const contact = await this.supportRepository.findContactById(id);
        if (!contact)
            throw new exceptions_1.BusinessException('Contact not found', 'SUPPORT_002');
        const updateData = { status };
        if (assignedTo)
            updateData.assignedTo = assignedTo;
        await this.supportRepository.updateContact(id, updateData);
        const updated = await this.supportRepository.findContactById(id);
        return this.toContactResponse(updated);
    }
    async findTickets(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.supportRepository.findTickets({
            status: query.status,
            priority: query.priority,
            customerId: query.customerId,
            page,
            limit,
        });
        return {
            data: result.data.map((t) => this.toTicketResponse(t)),
            meta: result.meta,
        };
    }
    async findTicketById(id) {
        const ticket = await this.supportRepository.findTicketById(id);
        if (!ticket)
            throw new exceptions_1.BusinessException('Ticket not found', 'SUPPORT_001');
        return this.toTicketResponse(ticket);
    }
    async createTicket(userId, dto) {
        const ticketNumber = await this.supportRepository.generateTicketNumber();
        const ticket = await this.supportRepository.createTicket({
            ticketNumber,
            customer: { connect: { id: userId } },
            subject: dto.subject,
            description: dto.description,
            category: dto.category ?? 'GENERAL',
            priority: dto.priority ?? 'MEDIUM',
            status: 'OPEN',
        });
        await this.auditService.log({
            action: 'SUPPORT_CREATED',
            module: 'support',
            resource: 'support_ticket',
            resourceId: ticket.id,
            userId,
            newValue: { ticketNumber, subject: dto.subject },
        });
        return this.findTicketById(ticket.id);
    }
    async updateTicketStatus(id, dto) {
        const ticket = await this.supportRepository.findTicketById(id);
        if (!ticket)
            throw new exceptions_1.BusinessException('Ticket not found', 'SUPPORT_001');
        const updateData = {};
        if (dto.status)
            updateData.status = dto.status;
        if (dto.assignedTo)
            updateData.assignedTo = dto.assignedTo;
        if (dto.priority)
            updateData.priority = dto.priority;
        await this.supportRepository.updateTicket(id, updateData);
        return this.findTicketById(id);
    }
    async addReply(ticketId, dto, isStaff) {
        const ticket = await this.supportRepository.findTicketById(ticketId);
        if (!ticket)
            throw new exceptions_1.BusinessException('Ticket not found', 'SUPPORT_001');
        const reply = await this.supportRepository.createReply({
            ticket: { connect: { id: ticketId } },
            message: dto.message,
            isStaff,
            attachments: dto.attachments ?? [],
        });
        return this.toReplyResponse(reply);
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [support_repository_1.SupportRepository,
        audit_service_1.AuditService])
], SupportService);
//# sourceMappingURL=support.service.js.map