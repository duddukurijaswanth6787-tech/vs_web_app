import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { libraryService } from './library.service';

interface MapQuery {
  folderId?: string;
  mimeType?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const libraryKeys = {
  all: ['library'] as const,
  media: () => [...libraryKeys.all, 'media'] as const,
  mediaList: (q: MapQuery) => [...libraryKeys.media(), q] as const,
  mediaDetail: (id: string) => [...libraryKeys.media(), id] as const,
  folders: () => [...libraryKeys.all, 'folders'] as const,
  folderDetail: (id: string) => [...libraryKeys.folders(), id] as const,
};

export function useLibraryMedia(query: MapQuery) {
  return useQuery({
    queryKey: libraryKeys.mediaList(query),
    queryFn: () => libraryService.listMedia(query),
    placeholderData: keepPreviousData,
  });
}

export function useLibraryMediaDetail(id: string | null) {
  return useQuery({
    queryKey: libraryKeys.mediaDetail(id!),
    queryFn: () => libraryService.getMedia(id!),
    enabled: !!id,
  });
}

export function useCreateLibraryMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Parameters<typeof libraryService.createMedia>[0]) => libraryService.createMedia(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.media() }),
  });
}

export function useUpdateLibraryMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { altText?: string; caption?: string; folderId?: string } }) =>
      libraryService.updateMedia(id, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: libraryKeys.media() });
      qc.invalidateQueries({ queryKey: libraryKeys.mediaDetail(data.id) });
    },
  });
}

export function useRenameLibraryMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, originalFilename }: { id: string; originalFilename: string }) =>
      libraryService.renameMedia(id, originalFilename),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: libraryKeys.media() });
      qc.invalidateQueries({ queryKey: libraryKeys.mediaDetail(data.id) });
    },
  });
}

export function useReplaceLibraryMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Parameters<typeof libraryService.replaceMedia>[1] }) =>
      libraryService.replaceMedia(id, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: libraryKeys.media() });
      qc.invalidateQueries({ queryKey: libraryKeys.mediaDetail(data.id) });
    },
  });
}

export function useBulkDeleteLibraryMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => libraryService.bulkDeleteMedia(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.media() }),
  });
}

export function useBulkMoveLibraryMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, folderId }: { ids: string[]; folderId: string | null }) =>
      libraryService.bulkMoveMedia(ids, folderId),
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.media() }),
  });
}

export function useDeleteLibraryMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => libraryService.deleteMedia(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.media() }),
  });
}

export function useLibraryFolders(parentId?: string) {
  return useQuery({
    queryKey: [...libraryKeys.folders(), parentId],
    queryFn: () => libraryService.listFolders(parentId),
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { name: string; parentId?: string; description?: string }) => libraryService.createFolder(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.folders() }),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => libraryService.deleteFolder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.folders() }),
  });
}
