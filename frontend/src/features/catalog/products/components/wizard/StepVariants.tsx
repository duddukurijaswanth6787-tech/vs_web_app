'use client';

import React, { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { ProductFormValues } from '../../product.types';
import { Plus, Trash2 } from 'lucide-react';

export const StepVariants = () => {
  const { control } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants' as never,
  });

  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);

  const addVariant = () => {
    append({
      sku: `SKU-${Date.now()}`,
      name: `${color} - ${size}`,
      price,
      stock,
      color,
      size,
    });
    setColor('');
    setSize('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Product Variants</h2>
      
      {/* Variant Input Form */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-neutral-50 rounded-xl">
        <input placeholder="Color" value={color} onChange={e => setColor(e.target.value)} className="border p-2 rounded" />
        <input placeholder="Size" value={size} onChange={e => setSize(e.target.value)} className="border p-2 rounded" />
        <input type="number" placeholder="Price" value={price} onChange={e => setPrice(Number(e.target.value))} className="border p-2 rounded" />
        <input type="number" placeholder="Stock" value={stock} onChange={e => setStock(Number(e.target.value))} className="border p-2 rounded" />
        <button type="button" onClick={addVariant} className="col-span-4 bg-[#800020] text-white py-2 rounded-lg flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Variant
        </button>
      </div>

      {/* Added Variants List */}
      <div className="space-y-2">
        {fields.map((field: Record<string, unknown>, index) => (
          <div key={field.id as string} className="flex items-center justify-between p-3 border rounded-lg">
            <span>{String(field.color ?? '')} / {String(field.size ?? '')} - ₹{String(field.price ?? '')} (Stock: {String(field.stock ?? '')})</span>
            <button type="button" onClick={() => remove(index)} className="text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
