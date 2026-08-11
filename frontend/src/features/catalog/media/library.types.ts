export interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { media: number; children: number };
}

export interface LibraryMedia {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  extension: string;
  size: number;
  width: number | null;
  height: number | null;
  folderId: string | null;
  altText: string | null;
  caption: string | null;
  checksum: string | null;
  storageKey: string;
  publicUrl: string;
  thumbnailUrl: string | null;
  mediumUrl: string | null;
  largeUrl: string | null;
  uploadedBy: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  folder: { id: string; name: string } | null;
}

export interface LibraryMediaListResponse {
  data: LibraryMedia[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface UploadUrlResponse {
  uploadUrl: string;
  storageKey: string;
  publicUrl: string;
}

export interface MediaPickerOptions {
  multiple?: boolean;
  mimeType?: string;
  onSelect: (media: LibraryMedia | LibraryMedia[]) => void;
}
