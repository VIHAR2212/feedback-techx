'use client';

import React from 'react';

export interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Antique Compass Icon (Linework & Brass Astrolabe Style)
 */
export function AntiqueCompassIcon({ size = 20, color = '#652B19', className = '', style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <circle cx="12" cy="12" r="10" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="8" strokeDasharray="1.5 2" strokeWidth="1" />
      <line x1="12" y1="2" x2="12" y2="4.5" strokeWidth="2" />
      <line x1="12" y1="19.5" x2="12" y2="22" strokeWidth="2" />
      <line x1="2" y1="12" x2="4.5" y2="12" strokeWidth="2" />
      <line x1="19.5" y1="12" x2="22" y2="12" strokeWidth="2" />
      <polygon points="12,5 14.5,12 12,19 9.5,12" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.4" />
      <polygon points="12,5 14.5,12 12,12" fill={color} stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="#C5A880" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

/**
 * Caravel / Sailing Ship Nautical Icon
 */
export function NauticalShipIcon({ size = 20, color = '#652B19', className = '', style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      {/* Ship Hull */}
      <path d="M2 17c3 2 17 2 20 0l-2 4H4l-2-4z" fill={color} fillOpacity="0.2" />
      {/* Main Mast */}
      <line x1="12" y1="4" x2="12" y2="17" strokeWidth="1.8" />
      {/* Main Sail */}
      <path d="M12 4c4 1 5 4 5 7H12" fill={color} fillOpacity="0.25" />
      <path d="M12 11c3 1 4 3 4 5H12" fill={color} fillOpacity="0.25" />
      {/* Fore Sail */}
      <path d="M12 5C9 6 8 8 8 11h4" fill={color} fillOpacity="0.18" />
      {/* Flag / Pennant */}
      <path d="M12 4l3-2-3-1v3z" fill={color} />
      {/* Ocean Waves */}
      <path d="M1 21c2 1 4 1 6 0s4-1 6 0 4 1 6 0 3-.7 4-1" strokeWidth="1.3" />
    </svg>
  );
}

/**
 * Nautical Iron Anchor Icon
 */
export function AnchorIcon({ size = 20, color = '#652B19', className = '', style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <circle cx="12" cy="5" r="2.5" strokeWidth="1.7" />
      <line x1="12" y1="7.5" x2="12" y2="21" strokeWidth="1.8" />
      <line x1="7" y1="10" x2="17" y2="10" strokeWidth="1.8" />
      <path d="M5 14c0 4.5 3.5 7 7 7s7-2.5 7-7" strokeWidth="1.8" />
      <polyline points="3 13 5 14 7 13" strokeWidth="1.6" />
      <polyline points="21 13 19 14 17 13" strokeWidth="1.6" />
    </svg>
  );
}

/**
 * Charted Map / Scroll Icon
 */
export function MapScrollIcon({ size = 20, color = '#652B19', className = '', style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6" fill={color} fillOpacity="0.15" />
      <line x1="9" y1="3" x2="9" y2="18" strokeDasharray="2 2" />
      <line x1="15" y1="6" x2="15" y2="21" strokeDasharray="2 2" />
      {/* Route X Mark */}
      <line x1="5.5" y1="10.5" x2="7.5" y2="12.5" strokeWidth="1.8" />
      <line x1="7.5" y1="10.5" x2="5.5" y2="12.5" strokeWidth="1.8" />
      {/* Dashed trail */}
      <path d="M8 12c2 1 3-1 5 1s2 2 4 1" strokeDasharray="1.5 1.5" strokeWidth="1.2" />
    </svg>
  );
}

/**
 * Uncharted Island Peak / Volcano Icon
 */
export function IslandMountainIcon({ size = 20, color = '#652B19', className = '', style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <path d="M2 20h20" strokeWidth="1.5" />
      <path d="M4 20L11 6l4 8 2-3 5 9H4z" fill={color} fillOpacity="0.2" />
      <path d="M11 6l2.5 5-2 1.5L9 10l2-4z" fill={color} fillOpacity="0.4" />
      <path d="M1 22c3 1 6-1 9 1s6-1 9 1 3 0 4-1" strokeWidth="1.2" strokeDasharray="2 2" />
      <circle cx="18" cy="6" r="2" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
    </svg>
  );
}

/**
 * Skeleton Key / Magellan Cross Key Icon
 */
export function TreasureKeyIcon({ size = 20, color = '#652B19', className = '', style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <circle cx="7.5" cy="15.5" r="4.5" strokeWidth="1.8" fill={color} fillOpacity="0.15" />
      <circle cx="7.5" cy="15.5" r="1.8" strokeWidth="1.2" />
      <line x1="10.8" y1="12.2" x2="20" y2="3" strokeWidth="1.8" />
      <line x1="16.5" y1="6.5" x2="19" y2="9" strokeWidth="1.8" />
      <line x1="18.5" y1="4.5" x2="21" y2="7" strokeWidth="1.8" />
    </svg>
  );
}

/**
 * Brass Spyglass / Telescope Icon
 */
export function SpyglassIcon({ size = 20, color = '#652B19', className = '', style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <path d="M19 5l-4 4 1.5 1.5 4-4L19 5z" fill={color} fillOpacity="0.3" />
      <path d="M15 9l-5 5 1.5 1.5 5-5L15 9z" fill={color} fillOpacity="0.2" />
      <path d="M10 14l-6 6 1.5 1.5 6-6L10 14z" fill={color} fillOpacity="0.1" />
      <line x1="2" y1="22" x2="4" y2="20" strokeWidth="2" />
      <circle cx="20.5" cy="3.5" r="1.5" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Cartographer Sextant / Calipers Icon
 */
export function CartographySextantIcon({ size = 20, color = '#652B19', className = '', style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <path d="M12 3L4 21h16L12 3z" strokeWidth="1.6" />
      <path d="M7 16a8 8 0 0 0 10 0" strokeWidth="1.4" />
      <circle cx="12" cy="7" r="1.5" fill={color} />
      <line x1="12" y1="8.5" x2="12" y2="16" strokeWidth="1.4" />
      <line x1="9" y1="18.5" x2="9" y2="21" strokeWidth="1.2" />
      <line x1="12" y1="18.5" x2="12" y2="21" strokeWidth="1.2" />
      <line x1="15" y1="18.5" x2="15" y2="21" strokeWidth="1.2" />
    </svg>
  );
}

/**
 * Universal Checkpoint Icon Resolver (No mobile emojis)
 */
export function CheckpointIcon({
  index = 0,
  size = 22,
  color = '#5c3e21',
  className = '',
}: {
  index?: number;
  size?: number;
  color?: string;
  className?: string;
}) {
  const iconList = [
    NauticalShipIcon,
    AntiqueCompassIcon,
    AnchorIcon,
    MapScrollIcon,
    IslandMountainIcon,
    TreasureKeyIcon,
    SpyglassIcon,
    CartographySextantIcon,
  ];

  const SelectedIcon = iconList[index % iconList.length];
  return <SelectedIcon size={size} color={color} className={className} />;
}

/**
 * Antique Pirate Treasure Chest Icon
 */
export function TreasureChestIcon({ size = 20, color = '#652B19', className = '', style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      {/* Chest Base */}
      <rect x="3" y="9" width="18" height="12" rx="1.5" fill={color} fillOpacity="0.2" strokeWidth="1.6" />
      {/* Chest Domed Lid */}
      <path d="M3 9c0-3.5 3.5-6 9-6s9 2.5 9 6" fill={color} fillOpacity="0.3" strokeWidth="1.6" />
      {/* Horizontal banding */}
      <line x1="3" y1="9" x2="21" y2="9" strokeWidth="1.8" />
      <line x1="3" y1="14" x2="21" y2="14" strokeWidth="1.2" strokeDasharray="1.5 2" />
      {/* Vertical iron reinforcement ribs */}
      <line x1="7" y1="4.5" x2="7" y2="21" strokeWidth="1.4" />
      <line x1="17" y1="4.5" x2="17" y2="21" strokeWidth="1.4" />
      {/* Keyhole Plaque */}
      <rect x="10.5" y="10" width="3" height="4" rx="0.5" fill="#ffd700" stroke={color} strokeWidth="1.2" />
      <circle cx="12" cy="11.5" r="0.6" fill={color} />
      <line x1="12" y1="12" x2="12" y2="13.2" stroke={color} strokeWidth="1" />
    </svg>
  );
}

/**
 * Antique Padlock Icon
 */
export function PadlockIcon({ size = 20, color = '#652B19', className = '', style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      {/* Lock Shackle */}
      <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="1.8" />
      {/* Lock Body */}
      <rect x="4" y="11" width="16" height="11" rx="2" fill={color} fillOpacity="0.25" strokeWidth="1.7" />
      {/* Keyhole */}
      <circle cx="12" cy="15.5" r="1.5" fill={color} />
      <path d="M12 17v2" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Relic Spanish Doubloon / Gold Coin Icon
 */
export function RelicCoinIcon({ size = 20, color = '#652B19', className = '', style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <circle cx="12" cy="12" r="9" strokeWidth="1.8" fill={color} fillOpacity="0.2" />
      <circle cx="12" cy="12" r="6.5" strokeDasharray="2 2" strokeWidth="1.2" />
      <path d="M12 7.5v9M9.5 9.5h5a1.5 1.5 0 0 1 0 3h-5a1.5 1.5 0 0 0 0 3h5" strokeWidth="1.5" />
    </svg>
  );
}

