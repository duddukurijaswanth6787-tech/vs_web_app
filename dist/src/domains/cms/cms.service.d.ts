import { LoggerService } from "../../common/logger/logger.service";
import { AuditService } from "../audit/audit.service";
import { StorageService } from "../../infrastructure/storage/storage.service";
import { CmsRepository } from './cms.repository';
import { CreateBannerDto, UpdateBannerDto, BannerQueryDto, BannerResponse, CreateCmsPageDto, UpdateCmsPageDto, CmsPageQueryDto, CmsPageResponse, CreateCmsSectionDto, CmsSectionResponse } from './cms.types';
export declare class CmsService {
    private readonly cmsRepository;
    private readonly auditService;
    private readonly loggerService;
    private readonly storageService;
    constructor(cmsRepository: CmsRepository, auditService: AuditService, loggerService: LoggerService, storageService: StorageService);
    private toBannerResponse;
    private toPageResponse;
    private toSectionResponse;
    findBanners(query: BannerQueryDto): Promise<{
        data: BannerResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findBannerById(id: string): Promise<BannerResponse>;
    createBanner(dto: CreateBannerDto, userId: string): Promise<BannerResponse>;
    updateBanner(id: string, dto: UpdateBannerDto, userId: string): Promise<BannerResponse>;
    deleteBanner(id: string, userId: string): Promise<void>;
    findPages(query: CmsPageQueryDto): Promise<{
        data: CmsPageResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findPageBySlug(slug: string): Promise<CmsPageResponse>;
    createPage(dto: CreateCmsPageDto, userId: string): Promise<CmsPageResponse>;
    updatePage(id: string, dto: UpdateCmsPageDto, userId: string): Promise<CmsPageResponse>;
    findSections(): Promise<CmsSectionResponse[]>;
    createSection(dto: CreateCmsSectionDto, userId: string): Promise<CmsSectionResponse>;
}
