import { LoggerService } from "../../common/logger/logger.service";
import { AuditService } from "../audit/audit.service";
import { CustomerAddressRepository } from './customer-address.repository';
import { CreateAddressDto, UpdateAddressDto, AddressQueryDto, AddressResponse } from './customer-address.types';
export declare class CustomerAddressService {
    private readonly addressRepository;
    private readonly auditService;
    private readonly loggerService;
    constructor(addressRepository: CustomerAddressRepository, auditService: AuditService, loggerService: LoggerService);
    private toResponse;
    private getCustomerId;
    findAll(userId: string, query: AddressQueryDto): Promise<{
        data: AddressResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string, userId: string): Promise<AddressResponse>;
    create(dto: CreateAddressDto, userId: string): Promise<AddressResponse>;
    update(id: string, dto: UpdateAddressDto, userId: string): Promise<AddressResponse>;
    delete(id: string, userId: string): Promise<void>;
    findByCustomerIdAdmin(customerId: string): Promise<AddressResponse[]>;
}
