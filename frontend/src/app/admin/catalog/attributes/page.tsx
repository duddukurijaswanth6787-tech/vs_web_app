'use client';

import React, { useState } from 'react';
import { 
  useAttributes, 
  useCreateAttribute, 
  useDeleteAttribute,
  useAttributeGroups,
  useCreateAttributeGroup,
  useCreateAttributeOption,
  useAttributeOptions
} from '@/features/catalog/attributes/attribute.hooks';
import { AttributeType } from '@/features/catalog/products/product.types';
import { useAuth } from '@/hooks/useAuth';
import { categorizeApiError } from '@/lib/api-error-handler';
import { apiClient } from '@/lib/api/client';
import { SectionLoader } from '@/components/feedback/FeedbackStates';
import { 
  Plus, 
  Layers, 
  Tag, 
  Trash2, 
  Save, 
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

type SubViewType = 'attributes' | 'groups';

export default function AttributesPage() {
  const { user } = useAuth();
  
  const [subView, setSubView] = useState<SubViewType>('attributes');

  // Form states - Attribute
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [groupId, setGroupId] = useState('');
  const [type, setType] = useState<AttributeType>(AttributeType.TEXT);
  const [isVariant, setIsVariant] = useState(false);
  const [isFilterable, setIsFilterable] = useState(false);
  const [usesSwatch, setUsesSwatch] = useState(false);

  // Form states - Group
  const [groupName, setGroupName] = useState('');
  const [groupSlug, setGroupSlug] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  // Form states - Option
  const [targetAttrId, setTargetAttrId] = useState('');
  const [optValue, setOptValue] = useState('');
  const [optLabel, setOptLabel] = useState('');
  const [optSwatchUrl, setOptSwatchUrl] = useState('');
  const [uploadingSwatch, setUploadingSwatch] = useState(false);

  // Queries
  const { data: attributesData, isLoading: loadingAttrs, refetch: refetchAttrs } = useAttributes({ limit: 100 });
  const { data: groupsData, isLoading: loadingGroups, refetch: refetchGroups } = useAttributeGroups({ limit: 100 });
  const { refetch: refetchOptions } = useAttributeOptions({ attributeId: targetAttrId || undefined });

  // Mutations
  const createAttrMut = useCreateAttribute();
  const deleteAttrMut = useDeleteAttribute();
  const createGroupMut = useCreateAttributeGroup();
  const createOptionMut = useCreateAttributeOption();

  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !groupId) return;

    try {
      await createAttrMut.mutateAsync({
        groupId,
        name,
        slug: slug || undefined,
        type,
        isVariant,
        isFilterable,
        usesSwatch,
      });
      refetchAttrs();
      setName('');
      setSlug('');
      setIsVariant(false);
      setIsFilterable(false);
      setUsesSwatch(false);
    } catch (err) {
      console.error(categorizeApiError(err));
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      await createGroupMut.mutateAsync({
        name: groupName,
        slug: groupSlug || undefined,
        description: groupDesc || undefined,
      });
      refetchGroups();
      setGroupName('');
      setGroupSlug('');
      setGroupDesc('');
    } catch (err) {
      console.error(categorizeApiError(err));
    }
  };

  const handleSwatchFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSwatch(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post<{ data: { url: string } }>('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setOptSwatchUrl(res.data.data.url);
    } catch (err) {
      alert('Failed to upload swatch image');
    } finally {
      setUploadingSwatch(false);
    }
  };

  const handleCreateOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAttrId || !optValue.trim() || !optLabel.trim()) return;

    try {
      await createOptionMut.mutateAsync({
        attributeId: targetAttrId,
        value: optValue,
        label: optLabel,
        swatchImageUrl: optSwatchUrl || undefined,
      });
      refetchOptions();
      refetchAttrs();
      setOptValue('');
      setOptLabel('');
      setOptSwatchUrl('');
    } catch (err) {
      console.error(categorizeApiError(err));
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    if (!window.confirm('Delete this dynamic attribute?')) return;
    try {
      await deleteAttrMut.mutateAsync(id);
      refetchAttrs();
    } catch (err) {
      console.error(categorizeApiError(err));
    }
  };

  const isSuperAdmin = user?.roles?.includes('super_admin');

  return (
    <div className="space-y-6">
      {/* Header tab panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 font-sans tracking-tight">Dynamic Attribute Registry</h1>
          <p className="text-xs text-neutral-400 mt-1">Setup sizing options, colors, patterns, and dynamic fields used in Product Builder variant generators.</p>
        </div>
        <div className="flex bg-neutral-100 p-1.5 rounded-xl border border-neutral-200 self-stretch md:self-auto">
          <button
            onClick={() => setSubView('attributes')}
            className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              subView === 'attributes' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'
            }`}
          >
            Attributes & Options
          </button>
          <button
            onClick={() => setSubView('groups')}
            className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              subView === 'groups' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'
            }`}
          >
            Attribute Groups
          </button>
        </div>
      </div>

      {subView === 'attributes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attributes List table */}
          <div className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-neutral-950 flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-500" /> Catalog Specifications
            </h2>

            {loadingAttrs ? (
              <SectionLoader message="Syncing specifications..." />
            ) : (
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold">
                        <th className="p-3">Attribute</th>
                        <th className="p-3">Group</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Variant / Filter</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-700">
                      {attributesData?.data?.map((attr) => (
                        <tr key={attr.id} className="hover:bg-neutral-50/50">
                          <td className="p-3">
                            <div className="font-bold text-neutral-950">{attr.name}</div>
                            <div className="text-[10px] text-neutral-400 font-mono">/{attr.slug}</div>
                            {attr.options && attr.options.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {attr.options.map((opt) => (
                                  <span key={opt.id} className="bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-[4px] text-[9px] font-semibold border border-neutral-200">
                                    {opt.label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-semibold text-neutral-800">{attr.groupName || 'Unspecified'}</td>
                          <td className="p-3">
                            <span className="bg-neutral-100 border border-neutral-200 text-neutral-600 px-2 py-0.5 rounded font-mono text-[9px] uppercase font-bold">
                              {attr.type}
                            </span>
                          </td>
                          <td className="p-3 space-y-1">
                            <div>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                attr.isVariant ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-neutral-50 text-neutral-400'
                              }`}>
                                {attr.isVariant ? 'Variant Combiner' : 'Static Info'}
                              </span>
                            </div>
                            <div>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                attr.isFilterable ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-neutral-50 text-neutral-400'
                              }`}>
                                {attr.isFilterable ? 'Search Filter' : 'Standard'}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            {isSuperAdmin && (
                              <button
                                onClick={() => handleDeleteAttribute(attr.id)}
                                className="p-1.5 hover:bg-red-50 rounded text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!attributesData?.data || attributesData.data.length === 0) && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-neutral-400">No specifications created yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Create Attribute form panel */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-neutral-950 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-neutral-500" /> Create Attribute
              </h2>

              <form onSubmit={handleCreateAttribute} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Attribute Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Size"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Slug Key</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="product-size"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Group *</label>
                  <select
                    required
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900 focus:outline-none"
                  >
                    <option value="">Select Attribute Group</option>
                    {groupsData?.data?.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Data Input Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AttributeType)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900 focus:outline-none"
                  >
                    {Object.values(AttributeType).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100">
                  <label className="flex items-center gap-2 text-xs font-semibold text-neutral-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVariant}
                      onChange={(e) => setIsVariant(e.target.checked)}
                      className="rounded border-neutral-300 text-neutral-900"
                    />
                    Use as Variant Combinator (e.g. Size, Color)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-neutral-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFilterable}
                      onChange={(e) => setIsFilterable(e.target.checked)}
                      className="rounded border-neutral-300 text-neutral-900"
                    />
                    Use as Search Filter
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" /> Save Attribute
                </button>
              </form>
            </div>

            {/* Create Attribute Option form panel */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-neutral-950 mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-neutral-500" /> Add Attribute Options
              </h2>

              <form onSubmit={handleCreateOption} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Target Attribute *</label>
                  <select
                    required
                    value={targetAttrId}
                    onChange={(e) => setTargetAttrId(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900 focus:outline-none"
                  >
                    <option value="">Select target attribute</option>
                    {attributesData?.data?.filter((a) => [AttributeType.SELECT, AttributeType.COLOR, AttributeType.SIZE, AttributeType.MULTI_SELECT].includes(a.type))
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Option Value *</label>
                    <input
                      type="text"
                      required
                      value={optValue}
                      onChange={(e) => setOptValue(e.target.value)}
                      placeholder="e.g. XL"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Option Label *</label>
                    <input
                      type="text"
                      required
                      value={optLabel}
                      onChange={(e) => setOptLabel(e.target.value)}
                      placeholder="e.g. Extra Large"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Swatch Image (Optional)</label>
                  <div className="flex items-center gap-3">
                    {optSwatchUrl ? (
                      <div className="relative w-9 h-9 rounded-full overflow-hidden border border-neutral-300 shadow-sm shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={optSwatchUrl} alt="Swatch preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-neutral-100 border border-dashed border-neutral-300 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-4 h-4 text-neutral-400" />
                      </div>
                    )}
                    <label className="flex-1 cursor-pointer bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-700 font-semibold flex items-center justify-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-neutral-500" />
                      {uploadingSwatch ? 'Uploading...' : optSwatchUrl ? 'Change Swatch' : 'Upload Swatch Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSwatchFileUpload}
                        disabled={uploadingSwatch}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Option Value
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {subView === 'groups' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Groups list */}
          <div className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-neutral-950 flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-500" /> Attribute Groups
            </h2>

            {loadingGroups ? (
              <SectionLoader message="Syncing groups..." />
            ) : (
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold">
                      <th className="p-3">Group Name</th>
                      <th className="p-3">Slug Key</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {groupsData?.data?.map((g) => (
                      <tr key={g.id} className="hover:bg-neutral-50/50">
                        <td className="p-3 font-bold text-neutral-950">{g.name}</td>
                        <td className="p-3 font-mono text-[10px] text-neutral-400">/{g.slug}</td>
                        <td className="p-3 text-neutral-600">{g.description || 'No description set'}</td>
                      </tr>
                    ))}
                    {(!groupsData?.data || groupsData.data.length === 0) && (
                      <tr>
                        <td colSpan={3} className="p-6 text-center text-neutral-400">No attribute groups registered.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Create Group form */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm h-fit">
            <h2 className="text-sm font-bold text-neutral-950 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-neutral-500" /> Add Attribute Group
            </h2>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Group Name *</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Dimensions"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Slug URL</label>
                <input
                  type="text"
                  value={groupSlug}
                  onChange={(e) => setGroupSlug(e.target.value)}
                  placeholder="dimensions-spec"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Description</label>
                <textarea
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  rows={3}
                  placeholder="Group specifications description..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2 text-xs text-neutral-900"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" /> Save Group
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
