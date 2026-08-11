'use client';

import React, { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}

export default function FormField({ label, required, error, helperText, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-neutral-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-neutral-400">{helperText}</p>}
    </div>
  );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 bg-white disabled:bg-neutral-50 disabled:text-neutral-400 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 bg-white disabled:bg-neutral-50 disabled:text-neutral-400 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 bg-white disabled:bg-neutral-50 disabled:text-neutral-400 resize-y ${className}`}
      {...props}
    />
  );
}

export function Button({ className = '', variant = 'primary', children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const variants = {
    primary: 'bg-neutral-950 text-white hover:bg-neutral-800 border-neutral-950',
    secondary: 'bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-200',
    ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100 border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-700 border-red-600',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
