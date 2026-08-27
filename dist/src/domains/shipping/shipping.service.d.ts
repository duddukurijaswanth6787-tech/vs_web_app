import { AuditService } from "../audit/audit.service";
import { ShippingRepository } from './shipping.repository';
import { CreateShippingMethodDto, CreateShippingZoneDto, CalculateShippingDto, ShippingMethodResponse, ShippingZoneResponse, ShippingCalculationResponse } from './shipping.types';
export declare class ShippingService {
    private readonly shippingRepository;
    private readonly auditService;
    constructor(shippingRepository: ShippingRepository, auditService: AuditService);
    private toMethodResponse;
    private toZoneResponse;
    getMethods(): Promise<ShippingMethodResponse[]>;
    createMethod(dto: CreateShippingMethodDto, userId: string): Promise<ShippingMethodResponse>;
    getZones(methodId: string): Promise<ShippingZoneResponse[]>;
    createZone(dto: CreateShippingZoneDto, userId: string): Promise<ShippingZoneResponse>;
    calculateShipping(dto: CalculateShippingDto): Promise<ShippingCalculationResponse>;
    getEstimatedDelivery(methodCode: string): Promise<string>;
}
