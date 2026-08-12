'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand, useRestoreBrand } from '@/features/catalog/brands/brand.hooks';
import { CreateBrandDto, BrandResponse } from '@/features/catalog/brands/brand.types';
import { useAuth } from '@/hooks/useAuth';
import { categorizeApiError } from '@/lib/api-error-handler';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { 
  Plus, 
  Search, 
  Trash2, 
  RefreshCw, 
  Edit3, 
  Save, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { MediaPickerModal } from '@/components/media/MediaPickerModal';
import type { LibraryMedia } from '@/features/catalog/media/library.types';

export default function BrandsPage() {
  const { user } = useAuth();
  
  // Local list filter states
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [localSearch, setLocalSearch] = useState('');

  // Editing form states
  const [selectedBrand, setSelectedBrand] = useState<BrandResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [website, setWebsite] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [displayOrder, setDisplayOrder] = useState('0');
  const [status, setStatus] = useState('ACTIVE');

  // Queries
  const { data: brandsData, isLoading, isError, refetch } = useBrands({
    page,
    limit: 10,
    search,
  });

  // Mutations
  const createBrandMut = useCreateBrand();
  const updateBrandMut = useUpdateBrand();
  const deleteBrandMut = useDeleteBrand();
  const restoreBrandMut = useRestoreBrand();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(localSearch);
    setPage(1);
  };

  const resetForm = () => {
    setSelectedBrand(null);
    setIsEditing(false);
    setName('');
    setSlug('');
    setDescription('');
    setLogo('');
    setWebsite('');
    setIsFeatured(false);
    setIsVisible(true);
    setDisplayOrder('0');
    setStatus('ACTIVE');
  };

  const selectBrandForEdit = (brand: BrandResponse) => {
    setSelectedBrand(brand);
    setIsEditing(true);
    setName(brand.name);
    setSlug(brand.slug);
    setDescription(brand.description || '');
    setLogo(brand.logo || '');
    setWebsite(brand.website || '');
    setIsFeatured(brand.isFeatured);
    setIsVisible(brand.isVisible);
    setDisplayOrder(brand.displayOrder.toString());
    setStatus(brand.status);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: CreateBrandDto = {
      name,
      slug: slug || undefined,
      description: description || undefined,
      logo: logo || undefined,
      website: website || undefined,
      isFeatured,
      isVisible,
      displayOrder: parseInt(displayOrder) || 0,
    };

    try {
      if (isEditing && selectedBrand) {
        await updateBrandMut.mutateAsync({
          id: selectedBrand.id,
          dto: { ...payload, status },
        });
      } else {
        await createBrandMut.mutateAsync(payload);
      }
      refetch();
      resetForm();
    } catch (err) {
      console.error(categorizeApiError(err));
    }
  };

  const handleDelete = async (id: string, brandName: string) => {
    if (!window.confirm(`Archive brand "${brandName}"?`)) return;
    try {
      await deleteBrandMut.mutateAsync(id);
      refetch();
      resetForm();
    } catch (err) {
      console.error(categorizeApiError(err));
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreBrandMut.mutateAsync(id);
      refetch();
      resetForm();
    } catch (err) {
      console.error(categorizeApiError(err));
    }
  };

  const handleMediaSelected = (media: LibraryMedia | LibraryMedia[]) => {
    const m = Array.isArray(media) ? media[0] : media;
    if (m) setLogo(m.publicUrl);
    setShowMediaPicker(false);
  };

  const clearLogo = () => setLogo('');

  const isSuperAdmin = user?.roles?.includes('super_admin');

  return (
    <>
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 font-sans tracking-tight">Brands & Manufacturers</h1>
          <p className="text-xs text-neutral-400 mt-1">Configure designer brands, logos, display orders, and landing configurations.</p>
        </div>
        <button
          onClick={resetForm}
          className="bg-neutral-950 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Brand
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Brand Grid/Table view */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center gap-4">
            <form onSubmit={handleSearchSubmit} className="relative w-72">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search brand name..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-900 focus:outline-none"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            </form>
          </div>

          {isLoading ? (
            <SectionLoader message="Syncing brands registry..." />
          ) : isError ? (
            <PageError title="Loading Failed" message="Could not load brands list." retry={refetch} />
          ) : (
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold">
                      <th className="p-3">Brand Name</th>
                      <th className="p-3">Website</th>
                      <th className="p-3">Featured</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {brandsData?.data?.map((b) => (
                      <tr key={b.id} className="hover:bg-neutral-50/50">
                        <td className="p-3">
                          <div className="font-bold text-neutral-950">{b.name}</div>
                          <div className="text-[10px] text-neutral-400 font-mono">/{b.slug}</div>
                        </td>
                        <td className="p-3">
                          {b.website ? (
                            <a
                              href={b.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-neutral-600 hover:text-neutral-950 flex items-center gap-1 font-semibold"
                            >
                              Visit <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-neutral-300">N/A</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            b.isFeatured ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-neutral-50 text-neutral-400'
                          }`}>
                            {b.isFeatured ? 'Featured' : 'Standard'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            b.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-100 text-neutral-500'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => selectBrandForEdit(b)}
                              className="p-1 hover:bg-neutral-100 rounded text-neutral-600 hover:text-neutral-900"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {b.status === 'ARCHIVED' ? (
                              isSuperAdmin && (
                                <button
                                  onClick={() => handleRestore(b.id)}
                                  className="p-1 hover:bg-green-50 rounded text-green-600"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              )
                            ) : (
                              isSuperAdmin && (
                                <button
                                  onClick={() => handleDelete(b.id, b.name)}
                                  className="p-1 hover:bg-red-50 rounded text-red-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!brandsData?.data || brandsData.data.length === 0) && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-neutral-400">No brands matching search criteria.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {brandsData?.meta && brandsData.meta.totalPages > 1 && (
                <div className="bg-neutral-50 p-3 border-t border-neutral-200 flex justify-between items-center">
                  <span className="text-[10px] text-neutral-500 font-bold">
                    PAGE {brandsData.meta.page} OF {brandsData.meta.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={!brandsData.meta.hasPrevious}
                      onClick={() => setPage(page - 1)}
                      className="p-1.5 border rounded bg-white hover:bg-neutral-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={!brandsData.meta.hasNext}
                      onClick={() => setPage(page + 1)}
                      className="p-1.5 border rounded bg-white hover:bg-neutral-50 disabled:opacity-40"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Brand Editor Form panel */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm h-fit">
          <h2 className="text-sm font-bold text-neutral-950 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neutral-500" />
            {isEditing ? 'Edit Brand Record' : 'Register Brand Record'}
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Brand Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sabyasachi"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Slug URL</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="sabyasachi-designs"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Website Link</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://sabyasachi.com"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Brand Logo</label>
              {logo ? (
                <div className="relative border border-neutral-200 rounded-xl overflow-hidden mb-2 bg-neutral-50 p-2 flex items-center gap-3">
                  <Image src={logo} alt="logo preview" width={48} height={48} className="w-12 h-12 object-contain rounded" />
                  <span className="text-[10px] text-neutral-400 truncate flex-1">{logo}</span>
                  <button type="button" onClick={clearLogo} className="text-red-500 hover:text-red-700 p-1"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-neutral-200 rounded-xl p-4 text-center cursor-pointer hover:border-neutral-400 mb-2" onClick={() => setShowMediaPicker(true)}>
                  <ImageIcon className="w-6 h-6 text-neutral-300 mx-auto mb-1" />
                  <p className="text-xs text-neutral-500 font-medium">Choose Brand Logo</p>
                  <p className="text-[9px] text-neutral-400 mt-0.5 font-medium">Recommended: 500x500px (Square 1:1)</p>
                </div>
              )}
              <div className="mt-1 flex items-center gap-2">
                <button type="button" onClick={() => setShowMediaPicker(true)} className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 font-bold py-1.5 px-3 rounded-lg text-2xs">
                  {logo ? 'Replace Logo' : 'Select Logo'}
                </button>
                <span className="text-[9px] text-neutral-400 font-medium">(500x500px)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Brief Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brand legacy and catalog highlight..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100">
              <label className="flex items-center gap-2 text-xs font-semibold text-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                Featured Brand
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                  className="rounded border-neutral-300 text-neutral-900"
                />
                Operational Visibility
              </label>
            </div>

            {isEditing && (
              <div className="border-t border-neutral-100 pt-3">
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Brand
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-lg text-neutral-600 text-xs font-bold"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>

      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelected}
        mimeFilter="image/"
      />
    </>
  );
}
