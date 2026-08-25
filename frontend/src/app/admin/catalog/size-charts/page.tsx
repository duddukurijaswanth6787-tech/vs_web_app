'use client';

import React, { useState } from 'react';
import {
  useSizeCharts,
  useCreateSizeChart,
  useUpdateSizeChart,
  useDeleteSizeChart,
} from '@/features/catalog/size-charts/size-chart.hooks';
import {
  SizeChartTemplateResponse,
  SizeChartRow,
  DEFAULT_MEASUREMENTS,
  GARMENT_TYPES,
} from '@/features/catalog/size-charts/size-chart.types';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { Plus, Trash2, Save, Ruler, X, Columns3 } from 'lucide-react';

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/**
 * Size charts are defined once per garment shape and attached to many products,
 * so a merchant types each measurement once instead of on every listing.
 */
export default function SizeChartsPage() {
  const { data, isLoading, error, refetch } = useSizeCharts({ limit: 100 });
  const createChart = useCreateSizeChart();
  const updateChart = useUpdateSizeChart();
  const deleteChart = useDeleteSizeChart();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [garmentType, setGarmentType] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('inch');
  const [columns, setColumns] = useState<string[]>(DEFAULT_MEASUREMENTS);
  const [rows, setRows] = useState<SizeChartRow[]>([]);
  const [newColumn, setNewColumn] = useState('');
  const [newSize, setNewSize] = useState('');
  const [message, setMessage] = useState('');

  const templates = data?.data ?? [];
  const isSaving = createChart.isPending || updateChart.isPending;

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setGarmentType('');
    setDescription('');
    setUnit('inch');
    setColumns(DEFAULT_MEASUREMENTS);
    setRows(
      DEFAULT_SIZES.map((size, index) => ({
        size,
        measurements: Object.fromEntries(DEFAULT_MEASUREMENTS.map((c) => [c, ''])),
        displayOrder: index,
      })),
    );
  };

  const startNew = () => {
    resetForm();
    setEditingId('new');
  };

  const startEdit = (template: SizeChartTemplateResponse) => {
    setEditingId(template.id);
    setName(template.name);
    setGarmentType(template.garmentType ?? '');
    setDescription(template.description ?? '');
    setUnit(template.unit);
    // Columns come from the stored rows so an edited chart keeps its own shape.
    const keys = template.rows[0] ? Object.keys(template.rows[0].measurements) : DEFAULT_MEASUREMENTS;
    setColumns(keys);
    setRows(template.rows.map((row, index) => ({ ...row, displayOrder: index })));
    setMessage('');
  };

  const addColumn = () => {
    const label = newColumn.trim();
    if (!label || columns.includes(label)) {
      setNewColumn('');
      return;
    }
    setColumns((prev) => [...prev, label]);
    setRows((prev) =>
      prev.map((row) => ({ ...row, measurements: { ...row.measurements, [label]: '' } })),
    );
    setNewColumn('');
  };

  const removeColumn = (label: string) => {
    setColumns((prev) => prev.filter((c) => c !== label));
    setRows((prev) =>
      prev.map((row) => {
        const next = { ...row.measurements };
        delete next[label];
        return { ...row, measurements: next };
      }),
    );
  };

  const addSize = () => {
    const size = newSize.trim();
    if (!size || rows.some((r) => r.size.toLowerCase() === size.toLowerCase())) {
      setNewSize('');
      return;
    }
    setRows((prev) => [
      ...prev,
      {
        size,
        measurements: Object.fromEntries(columns.map((c) => [c, ''])),
        displayOrder: prev.length,
      },
    ]);
    setNewSize('');
  };

  const setCell = (size: string, column: string, value: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.size === size
          ? { ...row, measurements: { ...row.measurements, [column]: value } }
          : row,
      ),
    );
  };

  const handleSave = async () => {
    if (name.trim().length < 2) {
      setMessage('✕ Give the chart a name.');
      return;
    }
    setMessage('');

    // Drop blank cells so an unfilled measurement is absent rather than "".
    const payloadRows = rows.map((row, index) => ({
      size: row.size,
      displayOrder: index,
      measurements: Object.fromEntries(
        Object.entries(row.measurements).filter(([, value]) => String(value).trim() !== ''),
      ),
    }));

    try {
      if (editingId && editingId !== 'new') {
        await updateChart.mutateAsync({
          id: editingId,
          dto: {
            name: name.trim(),
            garmentType: garmentType || undefined,
            description: description.trim() || undefined,
            unit,
            rows: payloadRows,
          },
        });
      } else {
        await createChart.mutateAsync({
          name: name.trim(),
          garmentType: garmentType || undefined,
          description: description.trim() || undefined,
          unit,
          rows: payloadRows,
        });
      }
      setMessage('✓ Saved.');
      setEditingId(null);
      refetch();
    } catch (err) {
      const anyErr = err as { response?: { data?: { message?: string } } };
      setMessage('✕ ' + (anyErr?.response?.data?.message || 'Could not save the chart'));
    }
  };

  const handleDelete = async (template: SizeChartTemplateResponse) => {
    setMessage('');
    try {
      await deleteChart.mutateAsync(template.id);
      if (editingId === template.id) setEditingId(null);
      refetch();
    } catch (err) {
      const anyErr = err as { response?: { data?: { message?: string } } };
      setMessage('✕ ' + (anyErr?.response?.data?.message || 'Could not delete the chart'));
    }
  };

  if (isLoading) return <SectionLoader />;
  if (error) return <PageError retry={() => void refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-[#0284c7] flex items-center justify-center border border-rose-100">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Size Charts</h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Define measurements once per garment shape, then attach the chart to any product.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {message && (
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                message.startsWith('✓')
                  ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                  : 'text-rose-600 bg-rose-50 border-rose-200'
              }`}
            >
              {message}
            </span>
          )}
          <button
            type="button"
            onClick={startNew}
            className="bg-[#0284c7] hover:bg-[#0B3B78] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Chart</span>
          </button>
        </div>
      </div>

      {/* Existing templates */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {templates.length === 0 ? (
          <p className="p-8 text-sm text-neutral-400 text-center">
            No size charts yet. Create one and it becomes selectable on every product.
          </p>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="text-left px-6 py-3 font-bold">NAME</th>
                <th className="text-left px-6 py-3 font-bold">GARMENT</th>
                <th className="text-left px-6 py-3 font-bold">SIZES</th>
                <th className="text-left px-6 py-3 font-bold">UNIT</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id} className="border-t border-neutral-100">
                  <td className="px-6 py-3 font-bold text-neutral-800">{template.name}</td>
                  <td className="px-6 py-3 text-neutral-500">{template.garmentType || '—'}</td>
                  <td className="px-6 py-3 text-neutral-500">
                    {template.rows.map((r) => r.size).join(', ') || '—'}
                  </td>
                  <td className="px-6 py-3 text-neutral-500">{template.unit}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(template)}
                        className="text-xs font-bold text-[#0284c7] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(template)}
                        className="text-neutral-400 hover:text-rose-600 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Editor */}
      {editingId && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900">
              {editingId === 'new' ? 'New size chart' : `Editing: ${name}`}
            </h2>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800">Chart name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anarkali Standard"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800">Garment type</label>
              <select
                value={garmentType}
                onChange={(e) => setGarmentType(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
              >
                <option value="">Not specified</option>
                {GARMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
              >
                <option value="inch">inch</option>
                <option value="cm">cm</option>
              </select>
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-bold text-neutral-800">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="How to measure, fit notes…"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
              />
            </div>
          </div>

          {/* Measurement grid */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Columns3 className="w-3.5 h-3.5" />
                Measurements
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newColumn}
                  onChange={(e) => setNewColumn(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addColumn();
                    }
                  }}
                  placeholder="Add a measurement"
                  className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addColumn}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSize();
                    }
                  }}
                  placeholder="Add a size"
                  className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addSize}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-neutral-200 rounded-xl">
              <table className="w-full text-[11px]">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold text-neutral-500">SIZE</th>
                    {columns.map((column) => (
                      <th key={column} className="px-3 py-2 font-bold text-neutral-500 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          {column.toUpperCase()}
                          <button
                            type="button"
                            onClick={() => removeColumn(column)}
                            className="text-neutral-300 hover:text-rose-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      </th>
                    ))}
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.size} className="border-t border-neutral-100">
                      <td className="px-3 py-2 font-bold text-neutral-800">{row.size}</td>
                      {columns.map((column) => (
                        <td key={column} className="px-3 py-1.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={String(row.measurements[column] ?? '')}
                            onChange={(e) => setCell(row.size, column, e.target.value)}
                            className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 text-[11px] text-center focus:bg-white focus:outline-none"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => setRows((prev) => prev.filter((r) => r.size !== row.size))}
                          className="text-neutral-300 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-neutral-400">
              Blank cells are not saved, so a chart can leave a measurement out.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#0284c7] hover:bg-[#0B3B78] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving…' : 'Save Chart'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
