'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function PaperScrollBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // Paper unroll animation - vertical reveal from center
  const topReveal = useTransform(scrollYProgress, [0, 0.3], ['0%', '50%']);
  const bottomReveal = useTransform(scrollYProgress, [0, 0.3], ['100%', '50%']);
  const paperOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  const paperScale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.95, 1, 1, 0.98]);
  
  // Texture movement for parallax depth (as number for style)
  const textureOffsetY = useTransform(scrollYProgress, [0, 1], [0, 20]);
  const textureOffsetYNeg = useTransform(scrollYProgress, [0, 1], [0, -10]);

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base dark background */}
      <div className="absolute inset-0 bg-[#1a1a1a]" />
      
      {/* Paper Scroll Container - Unrolls from center vertically */}
      <motion.div 
        className="absolute inset-0"
        style={{ 
          opacity: paperOpacity,
          scale: paperScale,
        }}
      >
        {/* Top half of scroll - reveals downward */}
        <motion.div 
          className="absolute left-0 right-0 bg-paper-texture"
          style={{ 
            top: topReveal,
            height: '50%',
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          }}
        >
          {/* Parchment texture overlay */}
          <motion.div 
            className="absolute inset-0 parchment-pattern opacity-[0.15]"
            style={{ y: textureOffsetY }}
          />
          
          {/* Top edge shadow/gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-black/30 to-black/60" />
          
          {/* Scroll top roller/cylinder */}
          <motion.div 
            className="absolute -top-4 left-0 right-0 h-8 bg-gradient-to-b from-amber-900/80 via-amber-800/60 to-transparent rounded-t-full shadow-lg shadow-amber-900/50"
            style={{ 
              scaleY: useTransform(scrollYProgress, [0, 0.15], [1, 0.05]),
              originY: 0,
            }}
          />
        </motion.div>

        {/* Bottom half of scroll - reveals upward */}
        <motion.div 
          className="absolute left-0 right-0 bg-paper-texture"
          style={{ 
            bottom: bottomReveal,
            height: '50%',
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          }}
        >
          {/* Parchment texture overlay */}
          <motion.div 
            className="absolute inset-0 parchment-pattern opacity-[0.12]"
            style={{ y: textureOffsetYNeg }}
          />
          
          {/* Bottom edge shadow/gradient */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
          
          {/* Scroll bottom roller/cylinder */}
          <motion.div 
            className="absolute -bottom-4 left-0 right-0 h-8 bg-gradient-to-t from-amber-900/80 via-amber-800/60 to-transparent rounded-b-full shadow-lg shadow-amber-900/50"
            style={{ 
              scaleY: useTransform(scrollYProgress, [0, 0.15], [1, 0.05]),
              originY: 1,
            }}
          />
        </motion.div>

        {/* Center seam where scroll joins */}
        <motion.div 
          className="absolute left-0 right-0 h-16 bg-gradient-to-b from-amber-940/40 via-amber-900/30 to-amber-950/40"
          style={{ 
            top: '50%',
            y: '-50%',
            opacity: useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
          }}
        >
          {/* Center line detail */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-amber-700/40 -translate-y-1/2" />
        </motion.div>

        {/* Vignette overlay */}
        <div className="absolute inset-0 bg-radial-vignette opacity-40" />
        
        {/* Grain texture */}
        <div className="absolute inset-0 grain-overlay opacity-20" />
        
        {/* Subtle aged spots/stains on paper */}
        <div className="absolute inset-0 aged-spots opacity-[0.08]" />
      </motion.div>
    </div>
  );
}
