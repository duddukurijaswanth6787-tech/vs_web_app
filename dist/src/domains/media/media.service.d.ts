import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notification/notification.service";
import { StorageService } from "../../infrastructure/storage/storage.service";
import { MediaRepository } from './media.repository';
import { CreateMediaDto, UpdateMediaDto, MediaQueryDto, MediaResponse, ReorderMediaDto } from './media.types';
export declare class MediaService {
    private readonly mediaRepository;
    private readonly auditService;
    private readonly notificationService;
    private readonly storageService;
    constructor(mediaRepository: MediaRepository, auditService: AuditService, notificationService: NotificationService, storageService: StorageService);
    getUploadUrl(productId: string, mediaType: string, extension: string): Promise<{
        uploadUrl: string;
        s3Key: string;
        url: string;
    }>;
    private toResponse;
    findAll(query: MediaQueryDto): Promise<{
        data: MediaResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<MediaResponse>;
    create(dto: CreateMediaDto, userId: string): Promise<MediaResponse>;
    update(id: string, dto: UpdateMediaDto, userId: string): Promise<MediaResponse>;
    delete(id: string, userId: string): Promise<void>;
    restore(id: string, userId: string): Promise<MediaResponse>;
    setPrimary(id: string, userId: string): Promise<MediaResponse>;
    reorder(dto: ReorderMediaDto): Promise<{
        updated: number;
    }>;
}
