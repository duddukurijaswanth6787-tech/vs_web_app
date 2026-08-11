'use client';

import React, { useState } from 'react';
import { useLibraryMedia, useCreateLibraryMedia } from '@/features/catalog/media/library.hooks';
import { libraryService } from '@/features/catalog/media/library.service';
import type { LibraryMedia } from '@/features/catalog/media/library.types';
import { resolveMediaUrl } from '@/lib/media-url';
import { X, Search, Image, Check, Upload, AlertCircle } from 'lucide-react';

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: LibraryMedia | LibraryMedia[]) => void;
  multiple?: boolean;
  mimeFilter?: string;
}

function isImage(mime: string) { return mime.startsWith('image/'); }

function getThumbUrl(m: LibraryMedia) {
  return resolveMediaUrl(m.publicUrl || m.mediumUrl || m.thumbnailUrl);
}

export function MediaPickerModal({ open, onClose, onSelect, multiple, mimeFilter: initialMime }: MediaPickerModalProps) {
  const [activeTab, setActiveTab] = useState<'BROWSE' | 'UPLOAD'>('BROWSE');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<LibraryMedia[]>([]);
  const [mimeFilter, setMimeFilter] = useState(initialMime || '');
  const [page, setPage] = useState(1);

  // Local file upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const createMediaMut = useCreateLibraryMedia();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLocalUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError('');
    try {
      const { uploadUrl, storageKey, publicUrl } = await libraryService.getUploadUrl(uploadFile.name, uploadFile.type);
      await libraryService.uploadToS3(uploadUrl, uploadFile, (pct) => {
        setUploadProgress(pct);
      });

      let width: number | undefined;
      let height: number | undefined;
      if (isImage(uploadFile.type)) {
        try {
          const bmp = await createImageBitmap(uploadFile);
          width = bmp.width;
          height = bmp.height;
          bmp.close();
        } catch {
          // best effort
        }
      }

      let checksum: string | undefined;
      try {
        const buf = await uploadFile.arrayBuffer();
        const hashBuf = await crypto.subtle.digest('SHA-256', buf);
        const hashArr = Array.from(new Uint8Array(hashBuf));
        checksum = hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
      } catch {
        // best effort
      }

      const newMedia = await createMediaMut.mutateAsync({
        filename: storageKey.split('/').pop() || uploadFile.name,
        originalFilename: uploadFile.name,
        mimeType: uploadFile.type,
        size: uploadFile.size,
        width,
        height,
        storageKey,
        publicUrl,
        // Presigned uploads store the original only — do not invent missing variants
        thumbnailUrl: publicUrl,
        mediumUrl: publicUrl,
        largeUrl: publicUrl,
        checksum,
      });

      onSelect(newMedia);
      onClose();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to upload file';
      setUploadError(errMsg);
    } finally {
      setUploading(false);
      setUploadFile(null);
      setUploadProgress(0);
    }
  };

  const { data, isLoading } = useLibraryMedia({
    search: search || undefined,
    mimeType: mimeFilter || undefined,
    page,
    limit: 30,
  });

  if (!open) return null;

  const toggleSelect = (m: LibraryMedia) => {
    if (!multiple) {
      onSelect(m);
      onClose();
      return;
    }
    setSelected((prev) =>
      prev.find((x) => x.id === m.id) ? prev.filter((x) => x.id !== m.id) : [...prev, m],
    );
  };

  const handleConfirm = () => {
    if (selected.length) {
      onSelect(selected);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Tabs */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('BROWSE')}
              className={`text-xs font-bold pb-2.5 border-b-2 transition-all ${
                activeTab === 'BROWSE' 
                  ? 'border-neutral-900 text-neutral-900' 
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              Browse Library
            </button>
            <button
              onClick={() => setActiveTab('UPLOAD')}
              className={`text-xs font-bold pb-2.5 border-b-2 transition-all ${
                activeTab === 'UPLOAD' 
                  ? 'border-neutral-900 text-neutral-900' 
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              Upload Local File
            </button>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
        </div>

        {activeTab === 'BROWSE' ? (
          <>
            {/* Filter controls */}
            <div className="flex items-center gap-2 p-4 border-b border-neutral-100">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search..." className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none" />
              </div>
              <select value={mimeFilter} onChange={(e) => { setMimeFilter(e.target.value); setPage(1); }} className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-2 text-xs">
                <option value="">All</option>
                <option value="image/">Images</option>
                <option value="video/">Videos</option>
                <option value="application/">Documents</option>
              </select>
            </div>

            {/* Media list */}
            <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-48 text-xs text-neutral-400">Loading...</div>
              ) : !data?.data?.length ? (
                <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
                  <Image className="w-10 h-10 mb-2" />
                  <p className="text-xs">No media found</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {data.data.map((m) => {
                    const isSelected = !!selected.find((x) => x.id === m.id);
                    return (
                      <button key={m.id} onClick={() => toggleSelect(m)} className={`relative aspect-square rounded-xl border-2 overflow-hidden bg-neutral-50 transition-all ${isSelected ? 'border-neutral-900 ring-2 ring-neutral-900/20' : 'border-transparent hover:border-neutral-300'}`}>
                        {isImage(m.mimeType) ? (
                          <img src={getThumbUrl(m)} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-6 h-6 text-neutral-300" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-neutral-900 text-white rounded-full p-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-1.5 text-left">
                          <p className="text-[9px] text-white truncate">{m.originalFilename}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selection bottom bar */}
            <div className="flex items-center justify-between p-4 border-t border-neutral-200">
              <p className="text-xs text-neutral-500">{data?.meta?.total ?? 0} items{multiple && selected.length > 0 ? ` · ${selected.length} selected` : ''}</p>
              <div className="flex gap-2">
                {data?.meta && data.meta.totalPages > 1 && (
                  <>
                    <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs disabled:opacity-30">Prev</button>
                    <button disabled={!data.meta.hasNext} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs disabled:opacity-30">Next</button>
                  </>
                )}
                {multiple && selected.length > 0 && (
                  <button onClick={handleConfirm} className="bg-neutral-900 text-white rounded-lg px-4 py-1.5 text-xs font-bold">
                    Select ({selected.length})
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Upload Local File Tab View */
          <div className="p-8 flex-1 min-h-[380px] flex flex-col justify-center">
            {!uploadFile ? (
              <div 
                className="border-2 border-dashed border-neutral-200 hover:border-neutral-400 rounded-2xl p-16 text-center cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.length) {
                    setUploadFile(e.dataTransfer.files[0]);
                  }
                }}
              >
                <Upload className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-neutral-850">Drag your file here or click to browse</p>
                <p className="text-xs text-neutral-400 mt-1">Supports JPEG, PNG, WEBP, and standard file formats.</p>
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-2xl p-6 bg-neutral-50/50 space-y-5 max-w-xl mx-auto w-full">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-xs font-bold text-neutral-800 truncate">{uploadFile.name}</p>
                    <p className="text-[10px] text-neutral-400">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button 
                    type="button" 
                    disabled={uploading} 
                    onClick={() => setUploadFile(null)} 
                    className="text-neutral-400 hover:text-neutral-600 p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {uploading && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-2xs font-semibold">
                      <span>Uploading to S3...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-neutral-900 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="p-3 bg-red-50 border border-red-150 text-red-650 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-neutral-100">
                  <button 
                    type="button" 
                    onClick={() => setUploadFile(null)} 
                    disabled={uploading} 
                    className="px-4 py-2 border border-neutral-200 hover:bg-neutral-100 rounded-xl text-xs font-bold transition-all text-neutral-700"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={handleLocalUpload} 
                    disabled={uploading} 
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    {uploading ? 'Uploading...' : 'Upload & Select'}
                  </button>
                </div>
              </div>
            )}
            <input 
              ref={fileInputRef} 
              type="file" 
              className="hidden" 
              accept="image/*,video/*,.pdf,.doc,.docx,.csv,.xlsx,.zip" 
              onChange={(e) => {
                if (e.target.files?.length) {
                  setUploadFile(e.target.files[0]);
                }
              }} 
            />
          </div>
        )}

      </div>
    </div>
  );
}
