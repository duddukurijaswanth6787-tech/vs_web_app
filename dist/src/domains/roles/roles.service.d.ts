import { LoggerService } from "../../common/logger/logger.service";
import { RolesRepository } from './roles.repository';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto, RoleResponse } from './roles.types';
export declare class RolesService {
    private readonly rolesRepository;
    private readonly loggerService;
    constructor(rolesRepository: RolesRepository, loggerService: LoggerService);
    private toResponse;
    findAll(): Promise<RoleResponse[]>;
    findById(id: string): Promise<RoleResponse>;
    create(dto: CreateRoleDto): Promise<RoleResponse>;
    update(id: string, dto: UpdateRoleDto): Promise<RoleResponse>;
    delete(id: string): Promise<void>;
    assignPermissions(id: string, dto: AssignPermissionsDto): Promise<RoleResponse>;
    removePermission(id: string, permissionId: string): Promise<RoleResponse>;
}
