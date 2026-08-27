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
exports.CustomerAddressService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/logger/logger.service");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const customer_address_repository_1 = require("./customer-address.repository");
let CustomerAddressService = class CustomerAddressService {
    addressRepository;
    auditService;
    loggerService;
    constructor(addressRepository, auditService, loggerService) {
        this.addressRepository = addressRepository;
        this.auditService = auditService;
        this.loggerService = loggerService;
    }
    toResponse(a) {
        return {
            id: a.id,
            customerId: a.customerId,
            label: a.label,
            fullName: a.fullName,
            phone: a.phone,
            addressLine1: a.addressLine1,
            addressLine2: a.addressLine2 ?? undefined,
            city: a.city,
            state: a.state,
            country: a.country,
            postalCode: a.postalCode,
            landmark: a.landmark ?? undefined,
            latitude: a.latitude?.toString() ?? undefined,
            longitude: a.longitude?.toString() ?? undefined,
            isDefaultBilling: a.isDefaultBilling,
            isDefaultShipping: a.isDefaultShipping,
            status: a.status,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
        };
    }
    async getCustomerId(userId) {
        const profile = await this.addressRepository.findCustomerByUserId(userId);
        if (!profile)
            throw new exceptions_1.BusinessException('Customer profile not found', 'CUSTOMER_001');
        return profile.id;
    }
    async findAll(userId, query) {
        const customerId = await this.getCustomerId(userId);
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.addressRepository.findAll({
            customerId,
            search: query.search,
            status: query.status,
            page,
            limit,
            sortBy: query.sortBy ?? 'createdAt',
            sortOrder: query.sortOrder ?? 'desc',
        });
        return {
            data: result.data.map((a) => this.toResponse(a)),
            meta: result.meta,
        };
    }
    async findById(id, userId) {
        const customerId = await this.getCustomerId(userId);
        const address = await this.addressRepository.findById(id);
        if (!address || address.customerId !== customerId)
            throw new exceptions_1.BusinessException('Address not found', 'ADDRESS_001');
        return this.toResponse(address);
    }
    async create(dto, userId) {
        const customerId = await this.getCustomerId(userId);
        if (dto.isDefaultBilling)
            await this.addressRepository.clearDefaultBilling(customerId);
        if (dto.isDefaultShipping)
            await this.addressRepository.clearDefaultShipping(customerId);
        const address = await this.addressRepository.create({
            customer: { connect: { id: customerId } },
            label: dto.label ?? 'Home',
            fullName: dto.fullName,
            phone: dto.phone,
            addressLine1: dto.addressLine1,
            addressLine2: dto.addressLine2,
            city: dto.city,
            state: dto.state,
            country: dto.country ?? 'IN',
            postalCode: dto.postalCode,
            landmark: dto.landmark,
            latitude: dto.latitude ? parseFloat(dto.latitude) : undefined,
            longitude: dto.longitude ? parseFloat(dto.longitude) : undefined,
            isDefaultBilling: dto.isDefaultBilling ?? false,
            isDefaultShipping: dto.isDefaultShipping ?? false,
        });
        await this.auditService.log({
            action: 'ADDRESS_CREATED',
            module: 'customer-address',
            resource: 'address',
            resourceId: address.id,
            userId,
            newValue: { fullName: dto.fullName, city: dto.city },
        });
        this.loggerService.log({ action: 'address_created', addressId: address.id }, 'CustomerAddressService');
        return this.toResponse(address);
    }
    async update(id, dto, userId) {
        const customerId = await this.getCustomerId(userId);
        const address = await this.addressRepository.findById(id);
        if (!address || address.customerId !== customerId)
            throw new exceptions_1.BusinessException('Address not found', 'ADDRESS_001');
        if (dto.isDefaultBilling)
            await this.addressRepository.clearDefaultBilling(customerId);
        if (dto.isDefaultShipping)
            await this.addressRepository.clearDefaultShipping(customerId);
        const updateData = { ...dto };
        if (dto.latitude !== undefined)
            updateData.latitude = dto.latitude ? parseFloat(dto.latitude) : null;
        if (dto.longitude !== undefined)
            updateData.longitude = dto.longitude ? parseFloat(dto.longitude) : null;
        await this.addressRepository.update(id, updateData);
        await this.auditService.log({
            action: 'ADDRESS_UPDATED',
            module: 'customer-address',
            resource: 'address',
            resourceId: id,
            userId,
            oldValue: { fullName: address.fullName },
            newValue: { ...dto },
        });
        this.loggerService.log({ action: 'address_updated', addressId: id }, 'CustomerAddressService');
        return this.findById(id, userId);
    }
    async delete(id, userId) {
        const customerId = await this.getCustomerId(userId);
        const address = await this.addressRepository.findById(id);
        if (!address || address.customerId !== customerId)
            throw new exceptions_1.BusinessException('Address not found', 'ADDRESS_001');
        await this.addressRepository.delete(id);
        await this.auditService.log({
            action: 'ADDRESS_DELETED',
            module: 'customer-address',
            resource: 'address',
            resourceId: id,
            userId,
            oldValue: { fullName: address.fullName },
        });
        this.loggerService.log({ action: 'address_deleted', addressId: id }, 'CustomerAddressService');
    }
    async findByCustomerIdAdmin(customerId) {
        const result = await this.addressRepository.findAll({
            customerId,
            page: 1,
            limit: 100,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        });
        return result.data.map((a) => this.toResponse(a));
    }
};
exports.CustomerAddressService = CustomerAddressService;
exports.CustomerAddressService = CustomerAddressService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [customer_address_repository_1.CustomerAddressRepository,
        audit_service_1.AuditService,
        logger_service_1.LoggerService])
], CustomerAddressService);
//# sourceMappingURL=customer-address.service.js.map