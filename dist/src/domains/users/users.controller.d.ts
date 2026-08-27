import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, AssignRoleDto, UserQueryDto } from './users.types';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(query: UserQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: {
            id: string;
            createdAt: Date;
            email: string;
            userType: import(".prisma/client").$Enums.UserType;
            accountStatus: import(".prisma/client").$Enums.AccountStatus;
            firstName: string;
            lastName: string | null;
            lastLoginAt: Date | null;
            isEmailVerified: boolean;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findById(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./users.types").UserDetailResponse>>;
    create(dto: CreateUserDto): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./users.types").UserDetailResponse>>;
    update(id: string, dto: UpdateUserDto): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./users.types").UserDetailResponse>>;
    delete(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    restore(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./users.types").UserDetailResponse>>;
    activate(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./users.types").UserDetailResponse>>;
    deactivate(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./users.types").UserDetailResponse>>;
    suspend(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./users.types").UserDetailResponse>>;
    unlock(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./users.types").UserDetailResponse>>;
    assignRole(id: string, dto: AssignRoleDto): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./users.types").UserDetailResponse>>;
    removeRole(id: string, roleId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./users.types").UserDetailResponse>>;
    getRoles(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        id: string;
        name: string;
        displayName: string;
    }[]>>;
    getPermissions(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        code: string;
        name: string;
        module: string;
    }[]>>;
}
