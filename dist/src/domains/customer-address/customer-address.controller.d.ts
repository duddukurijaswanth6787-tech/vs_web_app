import { CustomerAddressService } from './customer-address.service';
import { CreateAddressDto, UpdateAddressDto, AddressQueryDto } from './customer-address.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class CustomerAddressController {
    private readonly addressService;
    constructor(addressService: CustomerAddressService);
    findAll(query: AddressQueryDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./customer-address.types").AddressResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findById(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./customer-address.types").AddressResponse>>;
    create(dto: CreateAddressDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./customer-address.types").AddressResponse>>;
    update(id: string, dto: UpdateAddressDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./customer-address.types").AddressResponse>>;
    delete(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
    findByCustomerIdAdmin(customerId: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./customer-address.types").AddressResponse[]>>;
}
