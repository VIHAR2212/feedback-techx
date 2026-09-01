'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fallbackTitle?: string;
  fallbackIcon?: string;
  aspectRatio?: string;
  className?: string;
  priority?: boolean;
}

export default function ImageWithFallback({
  src,
  alt,
  fallbackTitle,
  fallbackIcon = '✦',
  aspectRatio = '16 / 9',
  className = '',
  priority = false,
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#201a15] border-2 border-dashed border-[#8b7355] rounded-lg text-[#e6c875] p-4 text-center ${className}`}
        style={{ aspectRatio }}
      >
        <span className="text-3xl mb-2">
          {fallbackIcon}
        </span>

        <span className="text-sm font-bold">
          {fallbackTitle || alt || 'ASSET PENDING'}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={75}
        sizes="
          (max-width: 640px) 100vw,
          (max-width: 1024px) 80vw,
          600px
        "
        className="object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}
