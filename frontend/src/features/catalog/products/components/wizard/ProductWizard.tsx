import React, { useState, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormValues } from '../../product.types';

interface WizardStep {
  label: string;
  component: React.ComponentType;
}

interface ProductWizardProps {
  steps: WizardStep[];
  initialData?: any;
  onSave: (data: ProductFormValues) => void;
}

export const ProductWizard = ({ steps, initialData, onSave }: ProductWizardProps) => {
  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: initialData || {
      name: '',
      basePrice: 0,
      status: 'DRAFT',
    },
  });

  const [activeStep, setActiveStep] = useState(0);

  // Auto-save to localStorage
  useEffect(() => {
    const subscription = methods.watch((value) => {
      localStorage.setItem('product_draft', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [methods.watch]);

  const ActiveStepComponent = steps[activeStep].component;

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSave)} className="space-y-6">
        {/* Wizard Navigation */}
        <div className="flex justify-between items-center bg-white p-4 rounded-lg border">
          <button 
            type="button" 
            disabled={activeStep === 0} 
            onClick={() => setActiveStep(s => s - 1)}
            className="px-4 py-2 border rounded"
          >Previous</button>
          
          <span className="font-bold">Step {activeStep + 1} / {steps.length}: {steps[activeStep].label}</span>
          
          <button 
            type="button" 
            disabled={activeStep === steps.length - 1}
            onClick={() => setActiveStep(s => s + 1)}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >Next</button>
        </div>
        
        {/* Step Content */}
        <div className="bg-white p-6 rounded-lg border">
          <ActiveStepComponent />
        </div>
        
        {activeStep === steps.length - 1 && (
          <button type="submit" className="w-full px-6 py-3 bg-green-600 text-white rounded-lg">Save Product</button>
        )}
      </form>
    </FormProvider>
  );
};
