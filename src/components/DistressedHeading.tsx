'use client';

import React, { useId } from 'react';

export interface DistressedHeadingProps {
  title: string;
  subtitle?: string;
  seed?: number;
  size?: 'hero' | 'card' | 'section';
  align?: 'left' | 'center' | 'right';
  className?: string;
  titleColor?: string;
  subtitleColor?: string;
}

/**
 * DistressedHeading
 * Reusable Uncharted display heading with procedural SVG edge roughening & worn ink subtitle.
 * Uses consistent, tuned SVG turbulence, displacement, and mask parameters while varying noise seeds.
 */
export default function DistressedHeading({
  title,
  subtitle,
  seed = 42,
  size = 'card',
  align = 'left',
  className = '',
  titleColor = '#1A120B',
  subtitleColor = '#652B19',
}: DistressedHeadingProps) {
  const uniqueId = useId().replace(/:/g, '');
  const filterId = `distress-${uniqueId}`;

  // Font sizing styles based on semantic intent with generous line-height to accommodate scaleY transform
  const titleSizes = {
    hero: { fontSize: '2.6rem', lineHeight: '1.15', letterSpacing: '-0.01em' },
    card: { fontSize: '2rem', lineHeight: '1.2', letterSpacing: '-0.01em' },
    section: { fontSize: '1.6rem', lineHeight: '1.2', letterSpacing: '-0.01em' },
  };

  const subtitleSizes = {
    hero: { fontSize: '1.15rem', lineHeight: '1.2', letterSpacing: '0.04em' },
    card: { fontSize: '0.95rem', lineHeight: '1.2', letterSpacing: '0.04em' },
    section: { fontSize: '0.85rem', lineHeight: '1.2', letterSpacing: '0.04em' },
  };

  const alignClass = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }[align];

  return (
    <div className={`relative flex flex-col ${alignClass} select-none ${className}`}>
      {/* Shared exact-tuned SVG Distress Filter */}
      <svg
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
            {/* 1. Fine High-Frequency Noise for Subtle Edge Micro-Roughness */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency={0.95}
              numOctaves={3}
              seed={seed}
              result="edgeNoise"
            />
            {/* Minimal displacement scale (2.5-3px) to preserve crisp glyph geometry */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="edgeNoise"
              scale={2.5}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displacedText"
            />

            {/* 2. Micro Speckle Mask (Subtle edge weathering only) */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency={1.42}
              numOctaves={2}
              seed={seed + 10}
              result="speckleNoise"
            />
            <feColorMatrix
              in="speckleNoise"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 35 -26"
              result="punchMask"
            />

            {/* Subtractive composite for subtle edge chips */}
            <feComposite
              in="displacedText"
              in2="punchMask"
              operator="out"
              result="finalDistressedText"
            />
          </filter>
        </defs>
      </svg>

      {/* Main Bold Distressed Display Heading */}
      <div style={{ display: 'block', padding: '0.2rem 0' }}>
        <h2
          className="uncharted-title"
          style={{
            ...titleSizes[size],
            fontWeight: 900,
            color: titleColor,
            filter: `url(#${filterId})`,
            margin: 0,
            padding: '2px 0',
            display: 'inline-block',
          }}
        >
          {title}
        </h2>
      </div>

      {/* Smaller Worn-Red-Ink Subtitle with clear separation */}
      {subtitle && (
        <div style={{ display: 'block', marginTop: size === 'hero' ? '0.75rem' : '0.4rem' }}>
          <span
            className="uncharted-sub-title"
            style={{
              ...subtitleSizes[size],
              fontWeight: 800,
              color: subtitleColor,
              filter: `url(#${filterId})`,
              display: 'inline-block',
            }}
          >
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}
