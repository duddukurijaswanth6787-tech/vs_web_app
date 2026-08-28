import { LoggerService } from "../../common/logger/logger.service";
import { PermissionsRepository } from './permissions.repository';
import { CreatePermissionDto, UpdatePermissionDto, PermissionResponse } from './permissions.types';
export declare class PermissionsService {
    private readonly permissionsRepository;
    private readonly loggerService;
    constructor(permissionsRepository: PermissionsRepository, loggerService: LoggerService);
    private toResponse;
    findAll(module?: string): Promise<PermissionResponse[]>;
    findById(id: string): Promise<PermissionResponse>;
    create(dto: CreatePermissionDto): Promise<PermissionResponse>;
    update(id: string, dto: UpdatePermissionDto): Promise<PermissionResponse>;
    delete(id: string): Promise<void>;
}
