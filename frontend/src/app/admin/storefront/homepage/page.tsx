'use client';

import { useState, type DragEvent } from 'react';
import { useHomepage, useUpdateHomepage } from '@/features/storefront/storefront.hooks';
import type { HomepageSection } from '@/features/storefront/storefront.types';
import { PageLoader, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { Save, Eye, EyeOff, GripVertical } from 'lucide-react';
import { getApiErrorMessage } from '@/utils/api-error';

export default function HomepagePage() {
  const { data: sections, isLoading } = useHomepage();
  const updateMut = useUpdateHomepage();
  const [editState, setEditState] = useState<Record<string, HomepageSection>>({});
  const [error, setError] = useState<string | null>(null);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  if (isLoading) return <PageLoader />;

  const items = sections ?? [];
  const isDirty = Object.keys(editState).length > 0;

  const toggle = (key: string) => {
    const section = items.find(s => s.key === key);
    if (!section) return;
    setEditState(p => ({ ...p, [key]: { ...section, enabled: !section.enabled } }));
  };

  const updateOrder = (key: string, newOrder: number) => {
    const section = items.find(s => s.key === key);
    if (!section) return;
    setEditState(p => ({ ...p, [key]: { ...section, displayOrder: newOrder } }));
  };

  const getSectionState = (key: string) => editState[key] ?? items.find(s => s.key === key);

  const orderedItems = [...items].sort((a, b) => getSectionState(a.key)!.displayOrder - getSectionState(b.key)!.displayOrder);

  const reorder = (fromKey: string, toKey: string) => {
    if (fromKey === toKey) return;
    const keys = orderedItems.map(s => s.key);
    const fromIndex = keys.indexOf(fromKey);
    const toIndex = keys.indexOf(toKey);
    if (fromIndex === -1 || toIndex === -1) return;
    keys.splice(fromIndex, 1);
    keys.splice(toIndex, 0, fromKey);

    setEditState(prev => {
      const next = { ...prev };
      keys.forEach((key, idx) => {
        const newOrder = idx + 1;
        const section = items.find(s => s.key === key);
        if (!section) return;
        const current = next[key] ?? section;
        if (current.displayOrder !== newOrder) {
          next[key] = { ...current, displayOrder: newOrder };
        }
      });
      return next;
    });
  };

  const handleDragStart = (key: string) => setDraggedKey(key);

  const handleDragOver = (key: string) => (e: DragEvent) => {
    e.preventDefault();
    if (draggedKey && draggedKey !== key) setDragOverKey(key);
  };

  const handleDrop = (key: string) => (e: DragEvent) => {
    e.preventDefault();
    if (draggedKey) reorder(draggedKey, key);
    setDraggedKey(null);
    setDragOverKey(null);
  };

  const handleDragEnd = () => {
    setDraggedKey(null);
    setDragOverKey(null);
  };

  const saveAll = async () => {
    setError(null);
    try {
      const entries = Object.entries(editState);
      await updateMut.mutateAsync(entries.map(([key, data]) => ({ key, data: { enabled: data.enabled, displayOrder: data.displayOrder } })));
      setEditState({});
    } catch (err) { setError(getApiErrorMessage(err, 'Failed to save')); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Homepage Sections</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage and reorder homepage layout sections</p>
        </div>
        {isDirty && (
          <button onClick={saveAll} disabled={updateMut.isPending} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-sm">
            {updateMut.isPending && <ButtonLoader />} <Save className="w-4 h-4" /> Save Changes
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">{error}</div>}

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_80px_100px_120px_80px] gap-2 px-5 py-3 bg-neutral-50 border-b border-neutral-200 text-[10px] font-bold text-neutral-500 uppercase">
          <span></span><span>Section</span><span>Toggle</span><span>Order</span><span>Schedule</span><span>Actions</span>
        </div>
        {orderedItems.map((section) => {
          const state = getSectionState(section.key)!;
          const isDragging = draggedKey === section.key;
          const isDropTarget = dragOverKey === section.key && draggedKey !== section.key;
          return (
            <div
              key={section.key}
              draggable
              onDragStart={() => handleDragStart(section.key)}
              onDragOver={handleDragOver(section.key)}
              onDrop={handleDrop(section.key)}
              onDragEnd={handleDragEnd}
              className={`grid grid-cols-[40px_1fr_80px_100px_120px_80px] gap-2 items-center px-5 py-3 border-b border-neutral-100 last:border-0 transition-colors ${editState[section.key] ? 'bg-amber-50/50' : ''} ${isDragging ? 'opacity-40' : ''} ${isDropTarget ? 'border-t-2 border-t-neutral-900' : ''}`}
            >
              <div className="text-neutral-300 cursor-grab active:cursor-grabbing"><GripVertical className="w-4 h-4" /></div>
              <div>
                <div className="text-sm font-semibold text-neutral-900 capitalize">{section.key.replace(/_/g, ' ').toLowerCase()}</div>
                {section.title && <div className="text-[11px] text-neutral-400 truncate">{section.title}</div>}
              </div>
              <div>
                <button onClick={() => toggle(section.key)} className={`p-1.5 rounded-lg ${state.enabled ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-400'}`}>
                  {state.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <div>
                <input type="number" value={state.displayOrder} onChange={(e) => updateOrder(section.key, parseInt(e.target.value) || 0)} className="w-16 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-xs text-center" />
              </div>
              <div>
                {/* ponytail: schedule picker when calendar integration needed */}
                <span className="text-xs text-neutral-400 italic">—</span>
              </div>
              <div>
                {editState[section.key] && <span className="text-[10px] text-amber-600 font-semibold">Edited</span>}
              </div>
            </div>
          );
        })}
        {items.length === 0 && <div className="p-8 text-center text-xs text-neutral-400">No homepage sections configured.</div>}
      </div>
    </div>
  );
}
