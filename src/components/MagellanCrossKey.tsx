'use client';

import React from 'react';

interface MagellanCrossKeyProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export default function MagellanCrossKey({
  size = 28,
  className = '',
  glow = true,
}: MagellanCrossKeyProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        filter: glow
          ? 'drop-shadow(0 0 6px rgba(230, 197, 100, 0.45)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))'
          : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
      }}
    >
      <defs>
        {/* Antique Gold Metallic Sheen */}
        <linearGradient id="gold-metal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2B2" />
          <stop offset="25%" stopColor="#E5C158" />
          <stop offset="50%" stopColor="#B8860B" />
          <stop offset="75%" stopColor="#7A5305" />
          <stop offset="100%" stopColor="#4A3102" />
        </linearGradient>

        {/* Dark Recessed Inlay / Filigree Shade */}
        <linearGradient id="filigree-dark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#382103" />
          <stop offset="100%" stopColor="#1E1000" />
        </linearGradient>

        {/* Central Relic Jewel/Core */}
        <radialGradient id="ruby-core" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="40%" stopColor="#9E1A1A" />
          <stop offset="100%" stopColor="#380505" />
        </radialGradient>

        {/* Highlight Bevel */}
        <linearGradient id="bevel-highlight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFF8DC" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#6E4B05" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* 1. Main Cruciform Silhouette & Mechanical Key Stem */}
      <path
        d="
          M 46 8 
          L 54 8 
          L 54 16 C 58 12, 64 16, 60 22 C 64 26, 58 30, 54 26 
          L 54 38 
          L 66 38 C 72 34, 76 40, 70 44 C 76 48, 70 54, 66 50 
          L 54 50 
          L 54 70 
          L 62 70 L 62 74 L 54 74 
          L 54 78 
          L 65 78 L 65 83 L 57 83 L 57 87 L 63 87 L 63 92 L 50 95 L 46 95 
          L 46 50 
          L 34 50 C 30 54, 24 48, 30 44 C 24 40, 28 34, 34 38 
          L 46 38 
          L 46 26 C 42 30, 36 26, 40 22 C 36 16, 42 12, 46 16 
          Z
        "
        fill="url(#gold-metal)"
        stroke="#2E1C03"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 2. Top Trefoil Finial Accent */}
      <circle cx="50" cy="12" r="3" fill="url(#bevel-highlight)" />
      <circle cx="50" cy="12" r="1.5" fill="#3B2202" />

      {/* 3. Left & Right Arm Finials */}
      <circle cx="31" cy="44" r="2.2" fill="#3B2202" />
      <circle cx="69" cy="44" r="2.2" fill="#3B2202" />

      {/* 4. Stem Filigree Engravings */}
      <path
        d="M 49 53 L 49 67 M 51 53 L 51 67"
        stroke="url(#filigree-dark)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="50" cy="58" r="1.2" fill="#FFEAA7" />
      <circle cx="50" cy="63" r="1.2" fill="#FFEAA7" />

      {/* 5. Key Bit Notches (The Locking Bitting) */}
      <rect x="54" y="78" width="9" height="3" fill="#2E1C03" opacity="0.6" />
      <rect x="54" y="87" width="7" height="3" fill="#2E1C03" opacity="0.6" />

      {/* 6. Central Ornate Boss & Relic Seal */}
      <circle cx="50" cy="44" r="7.5" fill="#2E1C03" />
      <circle cx="50" cy="44" r="6" fill="url(#gold-metal)" stroke="#FFE89E" strokeWidth="0.8" />
      <circle cx="50" cy="44" r="3.5" fill="url(#ruby-core)" />
      <circle cx="48.5" cy="42.5" r="1" fill="#FFFFFF" opacity="0.75" />
    </svg>
  );
}
