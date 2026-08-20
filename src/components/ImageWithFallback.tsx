'use client';

import { useState } from 'react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackTitle?: string;
  fallbackIcon?: string;
  aspectRatio?: string;
}

export default function ImageWithFallback({
  src,
  alt,
  fallbackTitle,
  fallbackIcon = '✦',
  aspectRatio,
  className = '',
  style = {},
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#201a15] bg-[radial-gradient(circle,#2b221a_0%,#15110d_100%)] border-2 border-dashed border-[#8b7355] rounded-lg text-uc-gold p-4 text-center font-mono shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] w-full box-border ${className}`}
        style={{
          aspectRatio: aspectRatio || '16 / 9',
          ...style,
        }}
      >
        <span className="text-3xl mb-2 select-none">{fallbackIcon}</span>
        <span className="text-sm font-bold tracking-wider text-[#e6c875]">
          {fallbackTitle || alt || 'ASSET PENDING'}
        </span>
        <span className="text-[11px] text-[#8b7355] mt-1">
          [{src ? src.split('/').pop() : 'NO PATH'}]
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={`w-full h-full object-cover block ${className}`}
      style={style}
      {...props}
    />
  );
}
