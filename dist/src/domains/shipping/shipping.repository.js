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
exports.ShippingRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let ShippingRepository = class ShippingRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findMethods() {
        return this.prisma.shippingMethod.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
        });
    }
    async findMethodById(id) {
        return this.prisma.shippingMethod.findUnique({ where: { id } });
    }
    async findMethodByCode(code) {
        return this.prisma.shippingMethod.findUnique({ where: { code } });
    }
    async createMethod(data) {
        return this.prisma.shippingMethod.create({ data });
    }
    async findZones(methodId) {
        return this.prisma.shippingZone.findMany({
            where: { methodId, isActive: true },
        });
    }
    async createZone(data) {
        return this.prisma.shippingZone.create({ data });
    }
    async findMatchingZone(methodId, country, state, pincode) {
        const zones = await this.prisma.shippingZone.findMany({
            where: { methodId, isActive: true },
        });
        return zones.find((z) => {
            const countryMatch = z.countries.length === 0 || z.countries.includes(country);
            const stateMatch = z.states.length === 0 || z.states.includes(state);
            const pincodeMatch = !pincode || z.pincodes.length === 0 || z.pincodes.includes(pincode);
            return countryMatch && stateMatch && pincodeMatch;
        });
    }
};
exports.ShippingRepository = ShippingRepository;
exports.ShippingRepository = ShippingRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShippingRepository);
//# sourceMappingURL=shipping.repository.js.map