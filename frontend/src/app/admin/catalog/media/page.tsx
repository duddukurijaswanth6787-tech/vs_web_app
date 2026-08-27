'use client';

import React, { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  useLibraryMedia, useLibraryMediaDetail, useCreateLibraryMedia, useUpdateLibraryMedia, useDeleteLibraryMedia,
  useLibraryFolders, useCreateFolder, useDeleteFolder,
  useRenameLibraryMedia, useReplaceLibraryMedia, useBulkDeleteLibraryMedia, useBulkMoveLibraryMedia,
} from '@/features/catalog/media/library.hooks';
import { libraryService } from '@/features/catalog/media/library.service';
import type { LibraryMedia } from '@/features/catalog/media/library.types';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/utils/api-error';
import { resolveMediaUrl } from '@/lib/media-url';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import {
  Upload, Image as ImageIcon, FolderPlus, Trash2, Search, X, Grid3X3, List, FileType, FolderOpen, Folder,
  Edit3, Check, AlertCircle, Download, ArrowUpDown, Copy,
  CheckSquare, Square,
} from 'lucide-react';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getThumbUrl(m: LibraryMedia) {
  return resolveMediaUrl(m.publicUrl || m.mediumUrl || m.thumbnailUrl);
}

function isImage(mime: string) { return mime.startsWith('image/'); }
function isVideo(mime: string) { return mime.startsWith('video/'); }

interface UploadModalProps {
  folderId?: string;
  onClose: () => void;
  onDone: () => void;
}

function UploadModal({ folderId, onClose, onDone }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const createMedia = useCreateLibraryMedia();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files || []));
    setError('');
  }, []);

  const handleUpload = useCallback(async () => {
    if (!files.length) return;
    setUploading(true);
    setError('');
    let success = 0;

    for (const file of files) {
      try {
        const { uploadUrl, storageKey, publicUrl } = await libraryService.getUploadUrl(file.name, file.type);
        await libraryService.uploadToS3(uploadUrl, file, (pct) => {
          setProgress((p) => ({ ...p, [file.name]: pct }));
        });

        let width: number | undefined;
        let height: number | undefined;

        if (isImage(file.type)) {
          const bmp = await createImageBitmap(file);
          width = bmp.width;
          height = bmp.height;
          bmp.close();
        }

        const buf = await file.arrayBuffer();
        const hashBuf = await crypto.subtle.digest('SHA-256', buf);
        const hashArr = Array.from(new Uint8Array(hashBuf));
        const checksum = hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');

        await createMedia.mutateAsync({
          filename: storageKey.split('/').pop() || file.name,
          originalFilename: file.name,
          mimeType: file.type,
          size: file.size,
          width,
          height,
          folderId,
          storageKey,
          publicUrl,
          thumbnailUrl: publicUrl,
          mediumUrl: publicUrl,
          largeUrl: publicUrl,
          checksum,
        });

        success++;
      } catch (err) {
        // categorizeApiError returns an object; interpolating it printed
        // "[object Object]" and hid every upload failure behind it.
        setError(`Failed to upload ${file.name}: ${getApiErrorMessage(err, 'Upload failed')}`);
      }
    }

    setUploading(false);
    if (success > 0) onDone();
    if (success === files.length) onClose();
  }, [files, folderId, createMedia, onClose, onDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-neutral-900">Upload Media</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
        </div>

        <input ref={inputRef} type="file" multiple onChange={handleSelect} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.csv,.xlsx,.zip" />

        {!files.length ? (
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 sm:p-12 text-center cursor-pointer hover:border-neutral-400" onClick={() => inputRef.current?.click()}>
            <Upload className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">Drop files or click to browse</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
            {files.map((f) => (
              <div key={f.name} className="flex items-center justify-between bg-neutral-50 rounded-lg px-3 py-2 text-xs">
                <span className="truncate flex-1 text-neutral-700">{f.name}</span>
                <span className="text-neutral-400 ml-2">{formatSize(f.size)}</span>
                {progress[f.name] !== undefined && (
                  <span className="text-blue-600 ml-2 font-mono">{progress[f.name]}%</span>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 mb-3 flex items-start gap-1.5 break-words">
            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
            <span className="min-w-0">{error}</span>
          </p>
        )}

        <div className="flex gap-2 justify-end">
          {files.length > 0 && (
            <>
              <button onClick={() => inputRef.current?.click()} className="px-4 py-2 border border-neutral-200 rounded-lg text-xs text-neutral-600 hover:bg-neutral-50">Add More</button>
              <button onClick={handleUpload} disabled={uploading} className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 disabled:opacity-50">
                {uploading ? `Uploading...` : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface DetailPanelProps {
  media: LibraryMedia;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

function DetailPanel({ media, onClose, onUpdated, onDeleted }: DetailPanelProps) {
  const [altText, setAltText] = useState(media.altText || '');
  const [caption, setCaption] = useState(media.caption || '');
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(media.originalFilename);
  const [replacing, setReplacing] = useState(false);
  const updateMedia = useUpdateLibraryMedia();
  const deleteMedia = useDeleteLibraryMedia();
  const renameMedia = useRenameLibraryMedia();
  const replaceMedia = useReplaceLibraryMedia();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMedia.mutateAsync({ id: media.id, dto: { altText, caption } });
      onUpdated();
    } catch { }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${media.originalFilename}"? This action can be undone later.`)) return;
    try {
      await deleteMedia.mutateAsync(media.id);
      onDeleted();
    } catch { }
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === media.originalFilename) return setRenaming(false);
    try {
      await renameMedia.mutateAsync({ id: media.id, originalFilename: newName.trim() });
      setRenaming(false);
      onUpdated();
    } catch { }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(media.publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReplacing(true);
    try {
      const { uploadUrl, storageKey, publicUrl } = await libraryService.getUploadUrl(file.name, file.type);
      await libraryService.uploadToS3(uploadUrl, file);

      let width: number | undefined;
      let height: number | undefined;

      if (isImage(file.type)) {
        const bmp = await createImageBitmap(file);
        width = bmp.width;
        height = bmp.height;
        bmp.close();
      }

      const buf = await file.arrayBuffer();
      const hashBuf = await crypto.subtle.digest('SHA-256', buf);
      const hashArr = Array.from(new Uint8Array(hashBuf));
      const checksum = hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');

      await replaceMedia.mutateAsync({
        id: media.id,
        dto: {
          filename: storageKey.split('/').pop() || file.name,
          originalFilename: file.name,
          mimeType: file.type,
          size: file.size,
          width,
          height,
          storageKey,
          publicUrl,
          thumbnailUrl: publicUrl,
          mediumUrl: publicUrl,
          largeUrl: publicUrl,
          checksum,
        },
      });
      onUpdated();
    } catch { }
    setReplacing(false);
  };

  const ratio = media.width && media.height ? (media.width / media.height).toFixed(2) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-neutral-900">Media Details</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
        </div>

        {isImage(media.mimeType) ? (
          <div className="relative w-full h-48 mb-4">
            <Image src={resolveMediaUrl(media.publicUrl)} alt={media.originalFilename} fill sizes="100vw" className="object-contain rounded-xl bg-neutral-50" />
          </div>
        ) : isVideo(media.mimeType) ? (
          <video src={resolveMediaUrl(media.publicUrl)} controls className="w-full h-48 object-contain rounded-xl bg-neutral-50 mb-4" />
        ) : media.mimeType === 'application/pdf' ? (
          <embed src={resolveMediaUrl(media.publicUrl)} type="application/pdf" className="w-full h-48 rounded-xl bg-neutral-50 mb-4" />
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-neutral-50 rounded-xl mb-4">
            <FileType className="w-12 h-12 text-neutral-300" />
          </div>
        )}

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Name:</span>
            {renaming ? (
              <div className="flex gap-1">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-xs flex-1 min-w-0" autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()} />
                <button onClick={handleRename} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                <button onClick={() => { setRenaming(false); setNewName(media.originalFilename); }} className="text-neutral-400 hover:text-neutral-600"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-neutral-800 font-medium truncate max-w-[200px]">{media.originalFilename}</span>
                <button onClick={() => setRenaming(true)} className="text-neutral-400 hover:text-blue-600 ml-1"><Edit3 className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
          <div><span className="text-neutral-400">Type:</span> <span className="text-neutral-800">{media.mimeType}</span></div>
          <div><span className="text-neutral-400">Size:</span> <span className="text-neutral-800">{formatSize(media.size)}</span></div>
          {media.width && <div><span className="text-neutral-400">Dimensions:</span> <span className="text-neutral-800">{media.width} × {media.height}px {ratio && <span className="text-neutral-400">({ratio}:1)</span>}</span></div>}
          <div><span className="text-neutral-400">Uploaded:</span> <span className="text-neutral-800">{new Date(media.createdAt).toLocaleString()}</span></div>
          {media.folder && <div><span className="text-neutral-400">Folder:</span> <span className="text-neutral-800">{media.folder.name}</span></div>}
          {media.checksum && <div><span className="text-neutral-400">Checksum:</span> <span className="text-neutral-500 font-mono text-[10px]">{media.checksum}</span></div>}
          <div><span className="text-neutral-400">Storage Key:</span> <span className="text-neutral-500 text-[10px] break-all">{media.storageKey}</span></div>
          {media.uploadedBy && <div><span className="text-neutral-400">Uploaded by:</span> <span className="text-neutral-800">{media.uploadedBy}</span></div>}

          <div>
            <label className="block text-neutral-400 mb-1">Alt Text</label>
            <input value={altText} onChange={(e) => setAltText(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs" />
          </div>
          <div>
            <label className="block text-neutral-400 mb-1">Caption</label>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs" />
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-100">
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-neutral-900 text-white rounded-lg py-2 text-xs font-bold hover:bg-neutral-800 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          {!renaming && <>
            <button onClick={handleCopyUrl} className="px-3 py-2 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 text-xs flex items-center gap-1" title="Copy URL">
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a href={media.publicUrl} download className="px-3 py-2 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 inline-flex items-center">
              <Download className="w-4 h-4" />
            </a>
            {media.largeUrl && (
              <a href={media.largeUrl} download className="px-3 py-2 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 text-xs" title="Download optimized version">HQ</a>
            )}
            <button onClick={() => replaceInputRef.current?.click()} disabled={replacing} className="px-3 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 text-xs disabled:opacity-50">
              {replacing ? 'Replacing...' : 'Replace'}
            </button>
            <button onClick={handleDelete} className="px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
          </>}
          <input ref={replaceInputRef} type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.csv,.xlsx,.zip" onChange={handleReplaceFile} />
        </div>
      </div>
    </div>
  );
}

export default function MediaLibraryPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mimeFilter, setMimeFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [folderId, setFolderId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUpload, setShowUpload] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTargetFolder, setBulkTargetFolder] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { data, isLoading, isError, refetch } = useLibraryMedia({
    search: debouncedSearch || undefined,
    mimeType: mimeFilter || undefined,
    folderId,
    page,
    limit: 48,
    sortBy,
    sortOrder,
  });

  const bulkDelete = useBulkDeleteLibraryMedia();
  const bulkMove = useBulkMoveLibraryMedia();

  const { data: mediaDetail } = useLibraryMediaDetail(detailId);
  const { data: folders = [] } = useLibraryFolders();
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  }, []);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolder.mutateAsync({ name: newFolderName.trim() });
      setNewFolderName('');
      setShowNewFolder(false);
    } catch { }
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (!confirm(`Delete folder "${name}"? Media will be unlinked.`)) return;
    try { await deleteFolder.mutateAsync(id); } catch { }
  };

  const canUpload = user?.roles?.some((r: string) => ['super_admin', 'admin'].includes(r));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-neutral-900 font-sans tracking-tight">Media Library</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage uploaded images, videos and documents</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="p-2 border border-neutral-200 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50">
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </button>
          {canUpload && (
            <button onClick={() => setShowUpload(true)} className="bg-neutral-950 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm">
              <Upload className="w-4 h-4" /> Upload
            </button>
          )}
        </div>
      </div>

      {/* Below lg the folder rail sat beside the grid at a fixed 224px, which on
          a 360px phone left the thumbnails about 100px wide. Stack it instead. */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        <div className="w-full lg:w-56 lg:shrink-0">
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Folders</h3>
              {canUpload && (
                <button onClick={() => setShowNewFolder(!showNewFolder)} className="text-neutral-400 hover:text-neutral-600">
                  <FolderPlus className="w-4 h-4" />
                </button>
              )}
            </div>

            {showNewFolder && (
              <div className="flex gap-1 mb-2">
                <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Name" className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 text-xs" autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()} />
                <button onClick={handleCreateFolder} className="bg-neutral-900 text-white rounded-lg px-2 py-1.5 text-xs"><Check className="w-3 h-3" /></button>
              </div>
            )}

            <button onClick={() => { setFolderId(undefined); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors ${!folderId ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-600 hover:bg-neutral-50'}`}>
              <FolderOpen className="w-4 h-4" /> All Media
            </button>

            {folders.map((f) => (
              <div key={f.id} className="group flex items-center">
                <button onClick={() => { setFolderId(f.id); setPage(1); }} className={`flex-1 text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors ${folderId === f.id ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-600 hover:bg-neutral-50'}`}>
                  <Folder className="w-4 h-4" /> {f.name}
                  <span className="ml-auto text-[10px] text-neutral-400">{f._count.media}</span>
                </button>
                {canUpload && (
                  <button onClick={() => handleDeleteFolder(f.id, f.name)} aria-label={`Delete folder ${f.name}`} className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 p-1 text-neutral-400 hover:text-red-600 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Search keeps a full row on phones; the filters wrap underneath it
              rather than being crushed to a few characters wide. */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
            <div className="relative w-full sm:flex-1 sm:min-w-50">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search files by name..." className="w-full bg-white border border-neutral-200 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-neutral-400" />
              {search && <button onClick={() => { setSearch(''); setDebouncedSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"><X className="w-4 h-4" /></button>}
            </div>
            <select value={mimeFilter} onChange={(e) => { setMimeFilter(e.target.value); setPage(1); }} aria-label="Filter by type" className="flex-1 sm:flex-none bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none">
              <option value="">All Types</option>
              <option value="image/">Images</option>
              <option value="video/">Videos</option>
              <option value="application/">Documents</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort by" className="flex-1 sm:flex-none bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none">
              <option value="createdAt">Date</option>
              <option value="originalFilename">Name</option>
              <option value="size">Size</option>
              <option value="mimeType">Type</option>
            </select>
            <button onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))} className="p-2.5 border border-neutral-200 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50" title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}>
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 bg-neutral-50 rounded-xl px-3 sm:px-4 py-2.5 border border-neutral-200">
              <span className="text-xs font-medium text-neutral-700">{selectedIds.size} selected</span>
              <button onClick={() => { if (confirm(`Delete ${selectedIds.size} items?`)) { bulkDelete.mutate(Array.from(selectedIds)); setSelectedIds(new Set()); } }} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 border border-red-200">
                Delete Selected
              </button>
              <div className="flex items-center gap-1">
                <select value={bulkTargetFolder} onChange={(e) => setBulkTargetFolder(e.target.value)} className="bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-xs">
                  <option value="">Move to folder...</option>
                  {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <button onClick={() => { if (bulkTargetFolder) { bulkMove.mutate({ ids: Array.from(selectedIds), folderId: bulkTargetFolder }); setSelectedIds(new Set()); setBulkTargetFolder(''); } }} disabled={!bulkTargetFolder} className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-medium disabled:opacity-30">
                  Move
                </button>
              </div>
              <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-neutral-500 hover:text-neutral-700">Clear</button>
            </div>
          )}

          {isLoading ? (
            <SectionLoader message="Loading media library..." />
          ) : isError ? (
            <PageError title="Loading Failure" message="Could not fetch media library." retry={refetch} />
          ) : !data?.data?.length ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-sm">
              <ImageIcon className="w-12 h-12 text-neutral-200 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm text-neutral-500">No media files found</p>
              {canUpload && <button onClick={() => setShowUpload(true)} className="mt-3 bg-neutral-900 text-white rounded-xl px-4 py-2 text-xs font-bold">Upload Now</button>}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {data.data.map((m) => {
                const checked = selectedIds.has(m.id);
                return (
                  <div key={m.id} className="group relative bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <button onClick={() => setDetailId(m.id)} className="w-full text-left">
                      <div className="aspect-square bg-neutral-50 relative overflow-hidden">
                        {isImage(m.mimeType) ? (
                          <Image src={getThumbUrl(m)} alt={m.originalFilename} fill sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw" className="object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                        ) : isVideo(m.mimeType) ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <video src={resolveMediaUrl(m.publicUrl)} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileType className="w-10 h-10 text-neutral-300" />
                          </div>
                        )}
                        {m.checksum && (
                          <span className="absolute top-1 right-1 bg-white/80 text-[9px] px-1.5 py-0.5 rounded text-neutral-500 font-mono" title="Checksum">#{m.checksum.slice(0, 8)}</span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-[11px] font-medium text-neutral-800 truncate">{m.originalFilename}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{formatSize(m.size)}</p>
                      </div>
                    </button>
                    <button onClick={() => {
                      const next = new Set(selectedIds);
                      if (checked) { next.delete(m.id); } else { next.add(m.id); }
                      setSelectedIds(next);
                    }} aria-label={checked ? `Deselect ${m.originalFilename}` : `Select ${m.originalFilename}`}
                      /* Hover-only made this unreachable on a touch screen: there
                         was no way to multi-select from a phone at all. */
                      className={`absolute top-2 left-2 bg-white/90 rounded-md p-1.5 lg:p-0.5 transition-opacity hover:bg-white lg:group-hover:opacity-100 focus-visible:opacity-100 ${checked ? 'opacity-100' : 'opacity-100 lg:opacity-0'}`}>
                      {checked ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-neutral-500" />}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            // overflow-hidden clipped the last columns off-screen on a phone
            // instead of letting the table scroll sideways.
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-x-auto">
              <table className="w-full text-xs min-w-125">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-neutral-500">Preview</th>
                    <th className="text-left px-4 py-3 font-bold text-neutral-500">Name</th>
                    <th className="text-left px-4 py-3 font-bold text-neutral-500">Type</th>
                    <th className="text-left px-4 py-3 font-bold text-neutral-500">Size</th>
                    <th className="text-left px-4 py-3 font-bold text-neutral-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.data.map((m) => (
                    <tr key={m.id} onClick={() => setDetailId(m.id)} className="hover:bg-neutral-50 cursor-pointer">
                      <td className="px-4 py-3">
                        {isImage(m.mimeType) ? (
                          <Image src={getThumbUrl(m)} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded-lg" loading="lazy" />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center bg-neutral-100 rounded-lg"><FileType className="w-5 h-5 text-neutral-400" /></div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-800 max-w-[200px] truncate">{m.originalFilename}</td>
                      <td className="px-4 py-3 text-neutral-500">{m.mimeType}</td>
                      <td className="px-4 py-3 text-neutral-500">{formatSize(m.size)}</td>
                      <td className="px-4 py-3 text-neutral-500">{new Date(m.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 mt-4 bg-white rounded-xl border border-neutral-200 px-3 sm:px-4 py-3 shadow-sm">
              <p className="text-xs text-neutral-500">{data.meta.total} items</p>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs disabled:opacity-30 hover:bg-neutral-50">Prev</button>
                <span className="px-3 py-1.5 text-xs text-neutral-600">Page {page} of {data.meta.totalPages}</span>
                <button disabled={!data.meta.hasNext} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs disabled:opacity-30 hover:bg-neutral-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showUpload && <UploadModal folderId={folderId} onClose={() => setShowUpload(false)} onDone={() => refetch()} />}
      {detailId && mediaDetail && (
        <DetailPanel media={mediaDetail} onClose={() => { setDetailId(null); refetch(); }} onUpdated={() => refetch()} onDeleted={() => { setDetailId(null); refetch(); }} />
      )}
    </div>
  );
}
