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
exports.FaqService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const faq_repository_1 = require("./faq.repository");
let FaqService = class FaqService {
    faqRepository;
    auditService;
    constructor(faqRepository, auditService) {
        this.faqRepository = faqRepository;
        this.auditService = auditService;
    }
    toResponse(f) {
        return {
            id: f.id,
            question: f.question,
            answer: f.answer,
            slug: f.slug,
            category: f.category ?? undefined,
            displayOrder: f.displayOrder,
            isActive: f.isActive,
            helpfulCount: f.helpfulCount,
            createdAt: f.createdAt,
        };
    }
    generateSlug(question) {
        return question
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 200);
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.faqRepository.findAll({
            search: query.search,
            category: query.category,
            isActive: query.isActive,
            page,
            limit,
        });
        return {
            data: result.data.map((f) => this.toResponse(f)),
            meta: result.meta,
        };
    }
    async findById(id) {
        const faq = await this.faqRepository.findById(id);
        if (!faq)
            throw new exceptions_1.BusinessException('FAQ not found', 'FAQ_001');
        return this.toResponse(faq);
    }
    async create(dto) {
        const slug = dto.slug || this.generateSlug(dto.question);
        const faq = await this.faqRepository.create({
            question: dto.question,
            answer: dto.answer,
            slug,
            category: dto.category,
            displayOrder: dto.displayOrder ?? 0,
            isActive: dto.isActive ?? true,
        });
        return this.toResponse(faq);
    }
    async update(id, dto) {
        const faq = await this.faqRepository.findById(id);
        if (!faq)
            throw new exceptions_1.BusinessException('FAQ not found', 'FAQ_001');
        await this.faqRepository.update(id, { ...dto });
        await this.auditService.log({
            action: 'FAQ_UPDATED',
            module: 'faq',
            resource: 'faq',
            resourceId: id,
            newValue: { ...dto },
        });
        return this.findById(id);
    }
    async delete(id) {
        const faq = await this.faqRepository.findById(id);
        if (!faq)
            throw new exceptions_1.BusinessException('FAQ not found', 'FAQ_001');
        await this.faqRepository.update(id, { isActive: false });
    }
    async markHelpful(id) {
        const faq = await this.faqRepository.findById(id);
        if (!faq)
            throw new exceptions_1.BusinessException('FAQ not found', 'FAQ_001');
        await this.faqRepository.incrementHelpful(id);
        return this.findById(id);
    }
    async findBySlug(slug) {
        const faq = await this.faqRepository.findBySlug(slug);
        if (!faq || !faq.isActive)
            throw new exceptions_1.BusinessException('FAQ not found', 'FAQ_001');
        return this.toResponse(faq);
    }
    async getCategories() {
        return this.faqRepository.getCategories();
    }
};
exports.FaqService = FaqService;
exports.FaqService = FaqService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [faq_repository_1.FaqRepository,
        audit_service_1.AuditService])
], FaqService);
//# sourceMappingURL=faq.service.js.map