'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Star,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  useAllTestimonials,
  useCreateTestimonial,
  useUpdateTestimonial,
  useDeleteTestimonial,
} from '@/features/testimonials/testimonial.hooks';
import { Testimonial } from '@/features/testimonials/testimonial.types';

export default function TestimonialsAdminPage() {
  const { data: testimonials = [], isLoading } = useAllTestimonials();
  const createMutation = useCreateTestimonial();
  const updateMutation = useUpdateTestimonial();
  const deleteMutation = useDeleteTestimonial();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    role: 'Verified Buyer',
    comment: '',
    rating: 5,
    location: '',
    isFeatured: true,
    displayOrder: 0,
  });

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      role: 'Verified Buyer',
      comment: '',
      rating: 5,
      location: '',
      isFeatured: true,
      displayOrder: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Testimonial) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      role: item.role || 'Verified Buyer',
      comment: item.comment,
      rating: item.rating || 5,
      location: item.location || '',
      isFeatured: item.isFeatured,
      displayOrder: item.displayOrder || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, input: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    setIsModalOpen(false);
  };

  const toggleFeatured = async (item: Testimonial) => {
    await updateMutation.mutateAsync({
      id: item.id,
      input: { isFeatured: !item.isFeatured },
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer testimonial?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Content Management</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900">
            Customer Testimonials
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage customer review quotes and toggle featured status for the storefront homepage.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-[#0284c7] text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-[#0B3B78] transition-all shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Testimonial</span>
        </button>
      </div>

      {/* Testimonials Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-neutral-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#0284c7]" />
            <span className="text-xs font-medium">Loading testimonials...</span>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 space-y-3">
            <MessageSquare className="w-10 h-10 mx-auto text-neutral-300" />
            <h3 className="text-base font-bold text-neutral-800">No Testimonials Found</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Add your first customer review quote to showcase customer love on the storefront homepage.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 bg-[#0284c7] text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#0B3B78] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Testimonial</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200/80">
                <tr>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Comment</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Featured</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
                {testimonials.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-4 px-4 shrink-0">
                      <div className="font-bold text-neutral-900">{item.name}</div>
                      <div className="text-[10px] text-neutral-400">{item.role || 'Verified Buyer'} • {item.location || 'India'}</div>
                    </td>
                    <td className="py-4 px-4 max-w-md italic text-neutral-600 line-clamp-2">
                      &quot;{item.comment}&quot;
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(item.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => toggleFeatured(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                          item.isFeatured
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                        }`}
                      >
                        {item.isFeatured ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-rose-600" />
                            <span>Featured</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-neutral-400" />
                            <span>Standard</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 font-bold text-[10px]">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-900 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-neutral-900">
                {editingId ? 'Edit Testimonial' : 'Add New Testimonial'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Author Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#0284c7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Role / Tag</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Verified Buyer"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#0284c7]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Hyderabad, Telangana"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#0284c7]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Rating (1 to 5)</label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#0284c7]"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                  <option value={3}>⭐⭐⭐ (3 Stars)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Comment / Review Quote *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="e.g. The quality of the silk saree is amazing! Beautiful zari embroidery work."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#0284c7]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="rounded border-neutral-300 text-[#0284c7] focus:ring-[#0284c7]"
                />
                <label htmlFor="isFeatured" className="font-bold text-neutral-800 cursor-pointer">
                  Feature on Storefront Homepage
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-[#0284c7] text-white font-bold hover:bg-[#0B3B78] transition-all flex items-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>{editingId ? 'Save Changes' : 'Create Testimonial'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
