import React from 'react';
import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../../product.types';

export const StepMedia = () => {
  // Media handling is complex (requires access to media hooks).
  // This component acts as a placeholder for the MediaPicker and logic.
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Product Media</h2>
      <p className="text-sm text-neutral-500">
        Media management will be integrated here, allowing drag-and-drop and role assignment for product images.
      </p>
      {/* MediaPickerModal and list will be moved here */}
      <div className="border-2 border-dashed p-10 text-center">
        Upload Zone Placeholder
      </div>
    </div>
  );
};
