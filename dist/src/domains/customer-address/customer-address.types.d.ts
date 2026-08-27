export declare class CreateAddressDto {
    label?: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country?: string;
    postalCode: string;
    landmark?: string;
    latitude?: string;
    longitude?: string;
    isDefaultBilling?: boolean;
    isDefaultShipping?: boolean;
}
export declare class UpdateAddressDto {
    label?: string;
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    landmark?: string;
    latitude?: string;
    longitude?: string;
    isDefaultBilling?: boolean;
    isDefaultShipping?: boolean;
}
export declare class AddressQueryDto {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class AddressResponse {
    id: string;
    customerId: string;
    label: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    landmark?: string;
    latitude?: string;
    longitude?: string;
    isDefaultBilling: boolean;
    isDefaultShipping: boolean;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class AddressListResponse {
    data: AddressResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
