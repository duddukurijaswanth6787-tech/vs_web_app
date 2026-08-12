'use client';

import { useState } from 'react';
import { useFooter, useAddFooterLink, useUpdateFooterLink, useDeleteFooterLink } from '@/features/storefront/storefront.hooks';
import type { FooterLink } from '@/features/storefront/storefront.types';
import { PageLoader, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { Plus, Trash2, Edit3, X } from 'lucide-react';
import { getApiErrorMessage } from '@/utils/api-error';

export default function FooterPage() {
  const { data: footer, isLoading } = useFooter();
  const addMut = useAddFooterLink();
  const updateMut = useUpdateFooterLink();
  const deleteMut = useDeleteFooterLink();
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sections = footer ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this footer link?')) return;
    try { await deleteMut.mutateAsync(id); } catch (err) { setError(getApiErrorMessage(err, 'Failed to delete')); }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(null);
    const fd = new FormData(e.currentTarget);
    const data = {
      footerSectionId: fd.get('footerSectionId') as string,
      title: fd.get('title') as string,
      url: fd.get('url') as string,
      openInNewTab: fd.get('openInNewTab') === 'on',
      enabled: fd.get('enabled') === 'on',
      displayOrder: parseInt(fd.get('displayOrder') as string) || 0,
    };
    try {
      if (editingLink) await updateMut.mutateAsync({ id: editingLink.id, dto: data });
      else await addMut.mutateAsync(data);
      setShowDialog(false); setEditingLink(null);
    } catch (err) { setError(getApiErrorMessage(err, 'Failed to save')); }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Footer Management</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage footer sections and links</p>
        </div>
        <button onClick={() => { setEditingLink(null); setShowDialog(true); }} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-sm"><Plus className="w-4 h-4" /> Add Link</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium flex items-center justify-between"><span>{error}</span><button onClick={() => setError(null)}><X className="w-4 h-4" /></button></div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div key={section.id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">{section.title}</h3>
                <span className="text-[10px] text-neutral-400">{section.enabled ? 'Enabled' : 'Disabled'} · Order {section.displayOrder}</span>
              </div>
            </div>
            <div className="divide-y divide-neutral-100">
              {section.links.length === 0 && <div className="px-5 py-4 text-xs text-neutral-400 italic">No links in this section.</div>}
              {section.links.map((link) => (
                <div key={link.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900">{link.title}</span>
                      {!link.enabled && <span className="text-[9px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">Hidden</span>}
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate font-mono">{link.url}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <button onClick={() => { setEditingLink(link); setShowDialog(true); }} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-500"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(link.id)} className="p-1.5 hover:bg-red-50 rounded text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900">{editingLink ? 'Edit Link' : 'Add Link'}</h3>
              <button onClick={() => { setShowDialog(false); setEditingLink(null); }} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="mt-4 space-y-4 text-sm">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Section</label>
                <select name="footerSectionId" defaultValue={editingLink?.footerSectionId ?? sections[0]?.id ?? ''} required className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
                  {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Title</label>
                <input type="text" name="title" defaultValue={editingLink?.title ?? ''} required className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">URL</label>
                <input type="url" name="url" defaultValue={editingLink?.url ?? ''} required className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="openInNewTab" defaultChecked={editingLink?.openInNewTab ?? false} className="rounded border-neutral-300" /> Open in new tab</label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="enabled" defaultChecked={editingLink?.enabled ?? true} className="rounded border-neutral-300" /> Enabled</label>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Display Order</label>
                <input type="number" name="displayOrder" defaultValue={editingLink?.displayOrder ?? 0} className="w-24 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2" />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
                <button type="button" onClick={() => { setShowDialog(false); setEditingLink(null); }} className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700">Cancel</button>
                <button type="submit" disabled={addMut.isPending || updateMut.isPending} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs disabled:opacity-55 flex items-center">{(addMut.isPending || updateMut.isPending) && <ButtonLoader />} {editingLink ? 'Save Changes' : 'Add Link'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
