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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerAddressController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const customer_address_service_1 = require("./customer-address.service");
const customer_address_types_1 = require("./customer-address.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let CustomerAddressController = class CustomerAddressController {
    addressService;
    constructor(addressService) {
        this.addressService = addressService;
    }
    async findAll(query, user) {
        return response_builder_1.ResponseBuilder.success(await this.addressService.findAll(user.sub, query));
    }
    async findById(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.addressService.findById(id, user.sub));
    }
    async create(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.addressService.create(dto, user.sub), 'Address created');
    }
    async update(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.addressService.update(id, dto, user.sub), 'Address updated');
    }
    async delete(id, user) {
        await this.addressService.delete(id, user.sub);
        return response_builder_1.ResponseBuilder.deleted('Address deleted');
    }
    async findByCustomerIdAdmin(customerId) {
        const result = await this.addressService.findByCustomerIdAdmin(customerId);
        return response_builder_1.ResponseBuilder.success(result);
    }
};
exports.CustomerAddressController = CustomerAddressController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List own addresses' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customer_address_types_1.AddressQueryDto, Object]),
    __metadata("design:returntype", Promise)
], CustomerAddressController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get address by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomerAddressController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new address' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customer_address_types_1.CreateAddressDto, Object]),
    __metadata("design:returntype", Promise)
], CustomerAddressController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an address' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_address_types_1.UpdateAddressDto, Object]),
    __metadata("design:returntype", Promise)
], CustomerAddressController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an address' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomerAddressController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)('admin/customer/:customerId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get addresses of any customer' }),
    __param(0, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerAddressController.prototype, "findByCustomerIdAdmin", null);
exports.CustomerAddressController = CustomerAddressController = __decorate([
    (0, swagger_1.ApiTags)('Customer Addresses'),
    (0, common_1.Controller)('customer-addresses'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [customer_address_service_1.CustomerAddressService])
], CustomerAddressController);
//# sourceMappingURL=customer-address.controller.js.map