import type { Request, Response } from 'express';
import { StorageService } from './storage.service';
export declare class StorageServeController {
    private readonly storageService;
    constructor(storageService: StorageService);
    upload(file: Express.Multer.File, folder: string | undefined, req: Request): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        url: string | undefined;
    }>>;
    serve(path: string | string[], variant: string | undefined, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
