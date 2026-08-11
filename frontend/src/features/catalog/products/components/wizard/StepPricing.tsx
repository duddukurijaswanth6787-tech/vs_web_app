import React from 'react';
import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../../product.types';

export const StepPricing = () => {
  const { register, formState: { errors } } = useFormContext<ProductFormValues>();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Pricing</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Base Price (MRP)</label>
          <input type="number" {...register('basePrice')} className="border p-2 w-full" />
          {errors.basePrice && <span className="text-red-500">{errors.basePrice.message}</span>}
        </div>
        <div>
          <label>Sale Price</label>
          <input type="number" {...register('salePrice')} className="border p-2 w-full" />
        </div>
        <div>
          <label>Cost Price</label>
          <input type="number" {...register('costPrice')} className="border p-2 w-full" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" {...register('taxInclusive')} />
          <label>Tax Inclusive</label>
        </div>
      </div>
    </div>
  );
};
