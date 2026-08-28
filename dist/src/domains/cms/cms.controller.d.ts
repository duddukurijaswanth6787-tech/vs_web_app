import { CmsService } from './cms.service';
import { CreateBannerDto, UpdateBannerDto, BannerQueryDto, CreateCmsPageDto, UpdateCmsPageDto, CmsPageQueryDto, CreateCmsSectionDto } from './cms.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class CmsController {
    private readonly cmsService;
    constructor(cmsService: CmsService);
    findBanners(query: BannerQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./cms.types").BannerResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findBannerById(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cms.types").BannerResponse>>;
    createBanner(dto: CreateBannerDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cms.types").BannerResponse>>;
    updateBanner(id: string, dto: UpdateBannerDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cms.types").BannerResponse>>;
    deleteBanner(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    findPages(query: CmsPageQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./cms.types").CmsPageResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findPageBySlug(slug: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cms.types").CmsPageResponse>>;
    createPage(dto: CreateCmsPageDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cms.types").CmsPageResponse>>;
    updatePage(id: string, dto: UpdateCmsPageDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cms.types").CmsPageResponse>>;
    findSections(): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cms.types").CmsSectionResponse[]>>;
    createSection(dto: CreateCmsSectionDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cms.types").CmsSectionResponse>>;
}
