'use client';

import React from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { isLocalOrPlaceholder } from '@/lib/media-url';

interface ImageOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
}

export function ImageOverlayModal({ isOpen, onClose, src, alt }: ImageOverlayModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <button 
        type="button" 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      <div className="max-w-3xl max-h-[90vh] aspect-[3/4] relative w-full">
        <Image 
          src={src} 
          alt={alt} 
          fill
          sizes="(max-width: 1024px) 100vw, 768px"
          unoptimized={isLocalOrPlaceholder(src)}
          className="object-contain rounded-2xl" 
        />
      </div>
    </div>
  );
}
