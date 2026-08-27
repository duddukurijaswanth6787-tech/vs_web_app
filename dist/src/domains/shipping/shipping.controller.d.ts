import { ShippingService } from './shipping.service';
import { CreateShippingMethodDto, CreateShippingZoneDto, CalculateShippingDto } from './shipping.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class ShippingController {
    private readonly shippingService;
    constructor(shippingService: ShippingService);
    getMethods(): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./shipping.types").ShippingMethodResponse[]>>;
    calculateShipping(code: string, query: CalculateShippingDto): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./shipping.types").ShippingCalculationResponse>>;
    createMethod(dto: CreateShippingMethodDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./shipping.types").ShippingMethodResponse>>;
    getZones(methodId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./shipping.types").ShippingZoneResponse[]>>;
    createZone(dto: CreateShippingZoneDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./shipping.types").ShippingZoneResponse>>;
}
