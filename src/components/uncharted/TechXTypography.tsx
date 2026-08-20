'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TechXLogoTextProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showSubtitle?: boolean;
  showBadge?: boolean;
  animated?: boolean;
  className?: string;
}

export function TechXLogoText({
  size = 'hero',
  showSubtitle = true,
  showBadge = true,
  animated = true,
  className = '',
}: TechXLogoTextProps) {
  const sizeStyles = {
    sm: {
      tech: 'text-3xl sm:text-4xl',
      x: 'text-4xl sm:text-5xl -ml-1',
      badge: 'text-[9px] tracking-[0.25em]',
      sub: 'text-[10px] tracking-[0.3em]',
      gap: 'gap-1',
    },
    md: {
      tech: 'text-5xl sm:text-6xl',
      x: 'text-6xl sm:text-7xl -ml-2',
      badge: 'text-[10px] tracking-[0.3em]',
      sub: 'text-xs tracking-[0.35em]',
      gap: 'gap-2',
    },
    lg: {
      tech: 'text-6xl sm:text-7xl md:text-8xl',
      x: 'text-7xl sm:text-8xl md:text-9xl -ml-3',
      badge: 'text-xs sm:text-sm tracking-[0.35em]',
      sub: 'text-xs sm:text-sm tracking-[0.4em]',
      gap: 'gap-3',
    },
    hero: {
      tech: 'text-6xl sm:text-8xl md:text-9xl lg:text-[10.5rem] leading-none',
      x: 'text-7xl sm:text-9xl md:text-[10.5rem] lg:text-[12rem] leading-none -ml-3 sm:-ml-5',
      badge: 'text-[9px] tracking-[0.25em] sm:text-sm sm:tracking-[0.4em]',
      sub: 'text-[9px] tracking-[0.25em] sm:text-sm sm:tracking-[0.45em]',
      gap: 'gap-3 sm:gap-4',
    },
  }[size];

  const content = (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Ambient background glow - subtle warm radiance */}
      <div className="pointer-events-none absolute -inset-10 rounded-full bg-gradient-to-r from-amber-700/15 via-orange-600/10 to-amber-800/15 blur-3xl opacity-40" />

      {/* Top Overline Badge */}
      {showBadge && (
        <motion.div
          initial={animated ? { opacity: 0, y: -10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative z-10 mb-2 flex items-center gap-3 text-amber-400/70 font-cinzel uppercase"
        >
          <span className="h-[1px] w-6 sm:w-12 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          <span className={`${sizeStyles.badge} font-bold whitespace-nowrap drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]`}>
            ✦ UNCHARTED EXPEDITION ✦
          </span>
          <span className="h-[1px] w-6 sm:w-12 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        </motion.div>
      )}

      {/* Main Brand Typography: TechX */}
      <div className="relative z-10 flex items-baseline justify-center">
        {/* Shimmer light sweep container */}
        <div className="shimmer-text flex items-baseline">
          {/* "Tech" in chiseled antiqued gold */}
          <span
            style={{ fontFamily: "var(--font-base02), var(--font-uncharted), 'Base02', 'Base 02', serif" }}
            className={`font-uncharted font-extrabold ${sizeStyles.tech} text-chiseled-gold inline-block tracking-tight`}
          >
            Tech
          </span>

          {/* "X" in crimson rune stone */}
          <span
            style={{ fontFamily: "var(--font-base02), var(--font-uncharted), 'Base02', 'Base 02', serif" }}
            className={`font-uncharted font-black ${sizeStyles.x} text-crimson-rune inline-block transform hover:scale-105 transition-transform duration-300`}
          >
            X
          </span>
        </div>
      </div>

      {/* Bottom Motto / Tagline */}
      {showSubtitle && (
        <motion.div
          initial={animated ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`relative z-10 mt-3 sm:mt-4 flex items-center justify-center gap-2 sm:gap-4 text-[#dfcfb3]/70 font-cinzel font-bold ${sizeStyles.sub} uppercase`}
        >
          <span className="h-px w-8 sm:w-16 bg-gradient-to-l from-amber-600/40 to-transparent" />
          <span className="whitespace-nowrap drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            Explore • Discover • Conquer
          </span>
          <span className="h-px w-8 sm:w-16 bg-gradient-to-r from-amber-600/40 to-transparent" />
        </motion.div>
      )}
    </div>
  );

  if (!animated) return content;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {content}
    </motion.div>
  );
}

interface ProductShowcaseTextProps {
  animated?: boolean;
  className?: string;
}

export function ProductShowcaseText({
  animated = true,
  className = '',
}: ProductShowcaseTextProps) {
  const content = (
    <div className={`relative flex flex-col items-center justify-center select-none text-center px-4 ${className}`}>
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute -inset-12 rounded-full bg-gradient-to-r from-amber-700/15 via-yellow-700/10 to-amber-800/15 blur-3xl opacity-40" />

      {/* Top filigree indicator */}
      <motion.div
        initial={animated ? { opacity: 0, y: -8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 mb-2 flex items-center gap-3 text-[#dfcfb3]/75 font-cinzel text-[11px] sm:text-xs uppercase tracking-[0.4em]"
      >
        <span className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent to-amber-500/40" />
        <span>❖ CHECKPOINTS A • B • C ❖</span>
        <span className="h-px w-8 sm:w-16 bg-gradient-to-l from-transparent to-amber-500/40" />
      </motion.div>

      {/* Main "Product Showcase" embossed text */}
      <div className="relative z-10 shimmer-text">
        <h2
          style={{ fontFamily: "var(--font-base02), var(--font-uncharted), 'Base02', 'Base 02', serif" }}
          className="font-uncharted font-extrabold text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-uncharted-emboss tracking-wider leading-tight"
        >
          Product Showcase
        </h2>
      </div>

      {/* Gemstone shard icons preview */}
      <motion.div
        initial={animated ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="relative z-10 mt-3 sm:mt-5 flex items-center justify-center gap-4 text-xs font-cinzel text-[#dfcfb3]/70 uppercase tracking-[0.3em]"
      >
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#059669]" />
          <span>Lab A</span>
        </div>
        <span className="text-amber-500/40">•</span>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_6px_#2563eb]" />
          <span>Lab B</span>
        </div>
        <span className="text-amber-500/40">•</span>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_#dc2626]" />
          <span>Lab C</span>
        </div>
      </motion.div>
    </div>
  );

  if (!animated) return content;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {content}
    </motion.div>
  );
}
