import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './roles.types';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAll(): Promise<import("@common/responses/response.builder").ResponsePayload<import("./roles.types").RoleResponse[]>>;
    findById(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./roles.types").RoleResponse>>;
    create(dto: CreateRoleDto): Promise<import("@common/responses/response.builder").ResponsePayload<import("./roles.types").RoleResponse>>;
    update(id: string, dto: UpdateRoleDto): Promise<import("@common/responses/response.builder").ResponsePayload<import("./roles.types").RoleResponse>>;
    delete(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
    assignPermissions(id: string, dto: AssignPermissionsDto): Promise<import("@common/responses/response.builder").ResponsePayload<import("./roles.types").RoleResponse>>;
    removePermission(id: string, permissionId: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./roles.types").RoleResponse>>;
}
