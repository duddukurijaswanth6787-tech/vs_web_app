'use client';

import Image, { type ImageProps } from 'next/image';

type RemoteImageProps = Omit<ImageProps, 'src'> & {
  src: string;
};

/**
 * Next.js Image wrapper for API/S3 URLs whose hosts may vary by environment.
 * Uses `unoptimized` so arbitrary absolute URLs remain valid without enumerating every CDN host.
 */
export function RemoteImage({ src, alt, ...props }: RemoteImageProps) {
  return <Image src={src} alt={alt} unoptimized {...props} />;
}
