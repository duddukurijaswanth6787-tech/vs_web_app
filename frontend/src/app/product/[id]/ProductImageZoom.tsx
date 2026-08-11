'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ProductImageZoomProps {
  src: string;
  alt: string;
  unoptimized?: boolean;
}

export function ProductImageZoom({ src, alt, unoptimized }: ProductImageZoomProps) {
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: 'none' });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundPosition: `${x}% ${y}%`,
      backgroundImage: `url(${src})`,
      backgroundSize: '200%',
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none' });
  };

  return (
    <div 
      className="relative w-full h-full cursor-zoom-in overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        unoptimized={unoptimized}
        priority
        className="object-cover"
      />
      <div 
        className="absolute inset-0 pointer-events-none border border-neutral-100/50"
        style={zoomStyle}
      />
    </div>
  );
}
