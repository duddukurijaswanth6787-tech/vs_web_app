export declare enum RateType {
    FLAT = "FLAT",
    WEIGHT = "WEIGHT",
    PRICE = "PRICE"
}
export declare class CreateShippingMethodDto {
    name: string;
    code: string;
    description?: string;
    estimatedDays: string;
}
export declare class CreateShippingZoneDto {
    methodId: string;
    name: string;
    countries: string[];
    states: string[];
    pincodes: string[];
    rateType: RateType;
    rate: number;
    freeAbove?: number;
    maxWeight?: number;
}
export declare class CalculateShippingDto {
    methodCode: string;
    country: string;
    state: string;
    pincode?: string;
    weight?: number;
    orderAmount?: number;
}
export declare class ShippingMethodResponse {
    id: string;
    name: string;
    code: string;
    description?: string;
    estimatedDays: string;
    isActive: boolean;
}
export declare class ShippingZoneResponse {
    id: string;
    methodId: string;
    name: string;
    countries: string[];
    states: string[];
    rateType: string;
    rate: number;
    freeAbove?: number;
}
export declare class ShippingCalculationResponse {
    methodCode: string;
    methodName: string;
    rate: number;
    estimatedDelivery: string;
    freeShipping: boolean;
}
