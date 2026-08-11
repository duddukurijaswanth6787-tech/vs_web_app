import React from 'react';
import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../../product.types';

export const StepBasic = () => {
  const { register, formState: { errors } } = useFormContext<ProductFormValues>();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Basic Information</h2>
      <div>
        <label>Product Name</label>
        <input {...register('name')} className="border p-2 w-full" />
        {errors.name && <span className="text-red-500">{errors.name.message}</span>}
      </div>
    </div>
  );
};
