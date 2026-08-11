import { apiClient } from '@/lib/api/client';
import { StandardResponse, PaginatedResponse } from '@/types/api.types';
import axios from 'axios';
import { LibraryMedia, MediaFolder, LibraryMediaListResponse, UploadUrlResponse } from './library.types';

interface MapQuery {
  folderId?: string;
  mimeType?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const libraryService = {
  listMedia: async (query: MapQuery = {}): Promise<LibraryMediaListResponse> => {
    const params: Record<string, string | number> = {};
    if (query.folderId) params.folderId = query.folderId;
    if (query.mimeType) params.mimeType = query.mimeType;
    if (query.search) params.search = query.search;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;
    if (query.sortBy) params.sortBy = query.sortBy;
    if (query.sortOrder) params.sortOrder = query.sortOrder;
    const res = await apiClient.get<StandardResponse<LibraryMediaListResponse>>('/library/media', { params });
    return res.data.data!;
  },

  getMedia: async (id: string): Promise<LibraryMedia> => {
    const res = await apiClient.get<StandardResponse<LibraryMedia>>(`/library/media/${id}`);
    return res.data.data!;
  },

  createMedia: async (dto: {
    filename: string;
    originalFilename: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    folderId?: string;
    storageKey: string;
    publicUrl: string;
    thumbnailUrl?: string;
    mediumUrl?: string;
    largeUrl?: string;
    checksum?: string;
  }): Promise<LibraryMedia> => {
    const res = await apiClient.post<StandardResponse<LibraryMedia>>('/library/media', dto);
    return res.data.data!;
  },

  updateMedia: async (id: string, dto: { altText?: string; caption?: string; folderId?: string }): Promise<LibraryMedia> => {
    const res = await apiClient.patch<StandardResponse<LibraryMedia>>(`/library/media/${id}`, dto);
    return res.data.data!;
  },

  renameMedia: async (id: string, originalFilename: string): Promise<LibraryMedia> => {
    const res = await apiClient.patch<StandardResponse<LibraryMedia>>(`/library/media/${id}/rename`, { originalFilename });
    return res.data.data!;
  },

  replaceMedia: async (id: string, dto: {
    filename: string;
    originalFilename: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    storageKey: string;
    publicUrl: string;
    thumbnailUrl?: string;
    mediumUrl?: string;
    largeUrl?: string;
    checksum?: string;
  }): Promise<LibraryMedia> => {
    const res = await apiClient.post<StandardResponse<LibraryMedia>>(`/library/media/${id}/replace`, dto);
    return res.data.data!;
  },

  bulkDeleteMedia: async (ids: string[]): Promise<{ deletedCount: number }> => {
    const res = await apiClient.post<StandardResponse<{ deletedCount: number }>>('/library/media/bulk-delete', { ids });
    return res.data.data!;
  },

  bulkMoveMedia: async (ids: string[], folderId: string | null): Promise<void> => {
    await apiClient.post('/library/media/bulk-move', { ids, folderId });
  },

  deleteMedia: async (id: string): Promise<void> => {
    await apiClient.delete(`/library/media/${id}`);
  },

  getUploadUrl: async (filename: string, mimeType: string): Promise<UploadUrlResponse> => {
    const res = await apiClient.post<StandardResponse<UploadUrlResponse>>('/library/media/upload-url', { filename, mimeType });
    return res.data.data!;
  },

  uploadToS3: async (uploadUrl: string, file: File, onProgress?: (pct: number) => void): Promise<void> => {
    if (!uploadUrl || !/^https?:\/\//i.test(uploadUrl)) {
      throw new Error(
        'Invalid upload URL. Backend must use STORAGE_PROVIDER=s3 so uploads go to the S3 bucket.',
      );
    }
    await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': file.type },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },

  findDuplicates: async (checksum: string): Promise<LibraryMedia[]> => {
    const res = await apiClient.get<StandardResponse<LibraryMedia[]>>('/library/media/duplicates', { params: { checksum } });
    return res.data.data ?? [];
  },

  listFolders: async (parentId?: string): Promise<MediaFolder[]> => {
    const params: Record<string, string> = {};
    if (parentId) params.parentId = parentId;
    const res = await apiClient.get<StandardResponse<MediaFolder[]>>('/library/folders', { params });
    return res.data.data ?? [];
  },

  getFolder: async (id: string): Promise<MediaFolder> => {
    const res = await apiClient.get<StandardResponse<MediaFolder>>(`/library/folders/${id}`);
    return res.data.data!;
  },

  createFolder: async (dto: { name: string; parentId?: string; description?: string }): Promise<MediaFolder> => {
    const res = await apiClient.post<StandardResponse<MediaFolder>>('/library/folders', dto);
    return res.data.data!;
  },

  updateFolder: async (id: string, dto: { name?: string; parentId?: string | null; description?: string }): Promise<MediaFolder> => {
    const res = await apiClient.patch<StandardResponse<MediaFolder>>(`/library/folders/${id}`, dto);
    return res.data.data!;
  },

  deleteFolder: async (id: string): Promise<void> => {
    await apiClient.delete(`/library/folders/${id}`);
  },
};
