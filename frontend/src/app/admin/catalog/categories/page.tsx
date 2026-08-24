'use client';

import { useToast } from '@/components/toast/ToastProvider';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  useCategoryTree, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory, 
  useRestoreCategory 
} from '@/features/catalog/categories/category.hooks';
import { CreateCategoryDto, CategoryResponse } from '@/features/catalog/categories/category.types';
import { useAuth } from '@/hooks/useAuth';
import { categorizeApiError } from '@/lib/api-error-handler';
import { getApiErrorMessage } from '@/utils/api-error';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { 
  FolderTree, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  ChevronRight, 
  ChevronDown, 
  Save,
  CheckCircle,
  Folder,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { MediaPickerModal } from '@/components/media/MediaPickerModal';
import type { LibraryMedia } from '@/features/catalog/media/library.types';
import { resolveMediaUrl } from '@/lib/media-url';

export default function CategoriesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // States
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  
  // Form local state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isFeatured, setIsFeatured] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [icon, setIcon] = useState('');
  const [categoryImage, setCategoryImage] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'icon' | 'image' | 'banner'>('image');

  // Query / Mutation hooks
  const { data: categoryTree, isLoading, isError, refetch } = useCategoryTree();
  const createCategoryMut = useCreateCategory();
  const updateCategoryMut = useUpdateCategory();
  const deleteCategoryMut = useDeleteCategory();
  const restoreCategoryMut = useRestoreCategory();

  const handleToggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setIsEditing(false);
    setName('');
    setSlug('');
    setDescription('');
    setParentId('');
    setDisplayOrder('0');
    setIsFeatured(true);
    setIsVisible(true);
    setIsMenuVisible(true);
    setSeoTitle('');
    setSeoDescription('');
    setStatus('ACTIVE');
    setIcon('');
    setCategoryImage('');
    setBannerImage('');
  };

  const selectCategoryForEdit = (cat: CategoryResponse) => {
    setSelectedCategory(cat);
    setIsEditing(true);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setParentId(cat.parentId || '');
    setDisplayOrder(cat.displayOrder.toString());
    setIsFeatured(cat.isFeatured);
    setIsVisible(cat.isVisible);
    setIsMenuVisible(cat.isMenuVisible);
    setSeoTitle(cat.seoTitle || '');
    setSeoDescription(cat.seoDescription || '');
    setStatus(cat.status);
    setIcon(cat.icon || '');
    setCategoryImage(cat.image || '');
    setBannerImage(cat.bannerImage || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Self-parent circularity guard
    if (isEditing && selectedCategory && parentId === selectedCategory.id) {
      toast('warning', 'Invalid parent', 'A category cannot be set as its own parent.');
      return;
    }

    const payload: CreateCategoryDto = {
      name,
      slug: slug || undefined,
      description: description || undefined,
      parentId: parentId || undefined,
      displayOrder: parseInt(displayOrder) || 0,
      isFeatured,
      isVisible,
      isMenuVisible,
      icon: icon || undefined,
      image: categoryImage || undefined,
      bannerImage: bannerImage || undefined,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
    };

    try {
      if (isEditing && selectedCategory) {
        await updateCategoryMut.mutateAsync({ id: selectedCategory.id, dto: payload });
        toast('success', `Category "${name}" updated successfully`);
      } else {
        await createCategoryMut.mutateAsync(payload);
        toast('success', `Category "${name}" created successfully`);
      }
      refetch();
      resetForm();
    } catch (err) {
      toast('error', 'Failed to save category', getApiErrorMessage(err));
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!window.confirm(`Are you sure you want to archive category "${catName}"?`)) return;
    try {
      await deleteCategoryMut.mutateAsync(id);
      toast('success', `Category "${catName}" archived successfully`);
      refetch();
      resetForm();
    } catch (err) {
      toast('error', 'Failed to archive category', getApiErrorMessage(err));
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreCategoryMut.mutateAsync(id);
      toast('success', 'Category restored successfully');
      refetch();
      resetForm();
    } catch (err) {
      toast('error', 'Failed to restore category', getApiErrorMessage(err));
    }
  };

  const handleMediaSelected = (media: LibraryMedia | LibraryMedia[]) => {
    const m = Array.isArray(media) ? media[0] : media;
    if (!m) return;
    if (mediaPickerTarget === 'icon') setIcon(m.publicUrl);
    else if (mediaPickerTarget === 'image') setCategoryImage(m.publicUrl);
    else if (mediaPickerTarget === 'banner') setBannerImage(m.publicUrl);
    setShowMediaPicker(false);
  };

  const openMediaPicker = (target: 'icon' | 'image' | 'banner') => {
    setMediaPickerTarget(target);
    setShowMediaPicker(true);
  };

  const isSuperAdmin = user?.roles?.some(role => ['super_admin', 'admin'].includes(role));

  // Flattened lists of parent categories to select from
  const getFlattenedOptions = (nodes?: CategoryResponse[], depth = 0): { id: string; name: string }[] => {
    if (!nodes) return [];
    let opts: { id: string; name: string }[] = [];
    for (const node of nodes) {
      // Exclude current editing category from parents list
      if (isEditing && selectedCategory && node.id === selectedCategory.id) continue;
      opts.push({ id: node.id, name: `${'— '.repeat(depth)}${node.name}` });
      if (node.children) {
        opts = [...opts, ...getFlattenedOptions(node.children, depth + 1)];
      }
    }
    return opts;
  };
  const parentOptions = getFlattenedOptions(categoryTree);

  return (
    <>
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 font-sans tracking-tight">Categories Taxonomy Manager</h1>
          <p className="text-xs text-neutral-400 mt-1">Configure hierarchical catalog categories structure, operational parameters, and menu targets.</p>
        </div>
        <button
          onClick={resetForm}
          className="bg-neutral-950 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {isLoading ? (
        <SectionLoader message="Syncing categories tree structure..." />
      ) : isError ? (
        <PageError title="Loading Failure" message="Could not fetch category trees." retry={refetch} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories Tree list */}
          <div className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-neutral-950 mb-4 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-neutral-500" /> Taxonomic Tree Layout
            </h2>

            <div className="space-y-1">
              {categoryTree?.map((root) => {
                const renderTreeNode = (node: CategoryResponse) => {
                  const hasChildren = node.children && node.children.length > 0;
                  const isExpanded = !!expandedNodes[node.id];

                  return (
                    <div key={node.id} className="border-l border-neutral-100 ml-4 pl-2">
                      <div className="flex items-center justify-between py-2 group hover:bg-neutral-50 rounded px-2 transition-all">
                        <div className="flex items-center gap-2 text-xs">
                          {hasChildren ? (
                            <button onClick={() => handleToggleExpand(node.id)} className="p-0.5 text-neutral-400">
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          ) : (
                            <Folder className="w-4 h-4 text-neutral-300" />
                          )}
                          <span className={`font-semibold ${node.status === 'ARCHIVED' ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>
                            {node.name}
                          </span>
                          <span className="text-[9px] font-mono text-neutral-400">/{node.slug}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => selectCategoryForEdit(node)}
                            className="p-1 hover:bg-neutral-200/60 rounded text-neutral-600 hover:text-neutral-900 transition-colors"
                            title="Edit Category"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {node.status === 'ARCHIVED' ? (
                            isSuperAdmin && (
                              <button
                                onClick={() => handleRestore(node.id)}
                                className="p-1 hover:bg-green-100 rounded text-green-600 transition-colors"
                                title="Restore Category"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )
                          ) : (
                            isSuperAdmin && (
                              <button
                                onClick={() => handleDelete(node.id, node.name)}
                                className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                                title="Delete / Archive Category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {hasChildren && isExpanded && (
                        <div className="space-y-1">
                          {node.children?.map((child) => renderTreeNode(child))}
                        </div>
                      )}
                    </div>
                  );
                };

                return renderTreeNode(root);
              })}
              {(!categoryTree || categoryTree.length === 0) && (
                <p className="text-xs text-neutral-400 py-6 text-center">No categories registered yet.</p>
              )}
            </div>
          </div>

          {/* Form Create/Edit Panel */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm h-fit">
            <h2 className="text-sm font-bold text-neutral-950 mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-neutral-500" />
              {isEditing ? 'Edit Category Node' : 'Create Category Node'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarees"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Slug URL</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="sarees-ethnic"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">
                  Parent Category
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900 focus:outline-none"
                >
                  <option value="">None (Root Category - Top Level)</option>
                  {parentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {parentId === ''
                    ? '✨ Selecting "None (Root Category)" will create a main Top-Level Parent Category.'
                    : '📂 This category will be created as a Sub-Category inside the selected parent.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Display Order</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900"
                />
              </div>

              <div className="pt-2 border-t border-neutral-100 space-y-3">
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Category Images</p>

                {['icon', 'image', 'banner'].map((field) => {
                  const val = field === 'icon' ? icon : field === 'image' ? categoryImage : bannerImage;
                  const label = field === 'icon' ? 'Icon' : field === 'image' ? 'Category Image' : 'Banner Image';
                  const setter = field === 'icon' ? setIcon : field === 'image' ? setCategoryImage : setBannerImage;
                  
                  const recSize = field === 'icon' 
                    ? 'Recommended: 128x128px (Square 1:1)' 
                    : field === 'image' 
                      ? 'Recommended: 800x800px (Square 1:1)' 
                      : 'Recommended: 1200x400px (Banner 3:1)';
                  
                  const shortRecSize = field === 'icon' ? '128x128px' : field === 'image' ? '800x800px' : '1200x400px';

                  return (
                    <div key={field}>
                      {val ? (
                        <div className="flex items-center gap-3 border border-neutral-200 rounded-xl p-2 bg-neutral-50">
                          <Image src={resolveMediaUrl(val)} alt={label} width={48} height={48} unoptimized className="w-12 h-12 object-contain rounded bg-white border" />
                          <span className="text-[10px] font-mono text-neutral-500 truncate flex-1" title={resolveMediaUrl(val)}>{resolveMediaUrl(val)}</span>
                          <button type="button" onClick={() => setter('')} className="text-red-500 hover:text-red-700 p-1" title="Remove image"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-neutral-200 rounded-xl p-3 text-center cursor-pointer hover:border-neutral-400" onClick={() => openMediaPicker(field as 'icon' | 'image' | 'banner')}>
                          <ImageIcon className="w-5 h-5 text-neutral-300 mx-auto mb-1" />
                          <p className="text-xs text-neutral-500 font-medium">Select {label}</p>
                          <p className="text-[9px] text-neutral-400 mt-0.5 font-medium">{recSize}</p>
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <button type="button" onClick={() => openMediaPicker(field as 'icon' | 'image' | 'banner')} className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 font-bold py-1 px-2.5 rounded-lg text-2xs">
                          {val ? 'Replace' : 'Choose'} {label}
                        </button>
                        <span className="text-[9px] text-neutral-400 font-medium">({shortRecSize})</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2.5 pt-2 border-t border-neutral-100">
                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  Featured Category
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  Taxonomic Visibility
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMenuVisible}
                    onChange={(e) => setIsMenuVisible(e.target.checked)}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  Show in Navigation Menu
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
                  disabled={createCategoryMut.isPending || updateCategoryMut.isPending}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" /> Save Category
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
      )}
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
