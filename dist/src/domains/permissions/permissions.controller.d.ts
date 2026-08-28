import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, UpdatePermissionDto } from './permissions.types';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
    findAll(module?: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./permissions.types").PermissionResponse[]>>;
    findById(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./permissions.types").PermissionResponse>>;
    create(dto: CreatePermissionDto): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./permissions.types").PermissionResponse>>;
    update(id: string, dto: UpdatePermissionDto): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./permissions.types").PermissionResponse>>;
    delete(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
}
