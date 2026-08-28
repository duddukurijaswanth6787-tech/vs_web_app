import { MediaService } from './media.service';
import { CreateMediaDto, UpdateMediaDto, MediaQueryDto, ReorderMediaDto } from './media.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    findAll(query: MediaQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./media.types").MediaResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findById(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./media.types").MediaResponse>>;
    create(dto: CreateMediaDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./media.types").MediaResponse>>;
    update(id: string, dto: UpdateMediaDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./media.types").MediaResponse>>;
    delete(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    restore(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./media.types").MediaResponse>>;
    setPrimary(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./media.types").MediaResponse>>;
    reorder(dto: ReorderMediaDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        updated: number;
    }>>;
    getUploadUrl(body: {
        productId: string;
        mediaType: string;
        extension: string;
    }): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        uploadUrl: string;
        s3Key: string;
        url: string;
    }>>;
}
