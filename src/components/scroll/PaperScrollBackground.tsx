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
  const topReveal = useTransform(scrollYProgress, [0, 0.4], ['50%', '0%']);
  const bottomReveal = useTransform(scrollYProgress, [0, 0.4], ['50%', '100%']);
  const paperOpacity = useTransform(scrollYProgress, [0, 0.05, 0.5, 0.95, 1], [0, 1, 1, 1, 0]);
  const paperScale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.9, 1, 1, 0.95]);
  
  // Texture movement for parallax depth
  const textureOffsetY = useTransform(scrollYProgress, [0, 1], [0, 30]);
  const textureOffsetYNeg = useTransform(scrollYProgress, [0, 1], [0, -15]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex: 1 }}
    >
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
        {/* Top half of scroll - reveals downward from center */}
        <motion.div 
          className="absolute left-0 right-0"
          style={{ 
            top: topReveal,
            height: '50%',
            background: `
              linear-gradient(180deg, 
                #d4c4a8 0%, 
                #e8dcc8 15%, 
                #f0e4cc 30%, 
                #e8dcc8 50%,
                #f5edd8 70%,
                #e8dcc8 85%,
                #d4c4a8 100%
              )
            `,
            boxShadow: 'inset 0 -20px 40px rgba(139, 90, 43, 0.15)',
          }}
        >
          {/* Parchment texture overlay */}
          <motion.div 
            className="absolute inset-0 opacity-[0.2]"
            style={{ 
              y: textureOffsetY,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Aged spots */}
          <div 
            className="absolute top-[10%] left-[15%] w-32 h-32 rounded-full opacity-[0.08]"
            style={{ 
              background: 'radial-gradient(circle, #8b7355 0%, transparent 70%)',
              filter: 'blur(20px)'
            }} 
          />
          <div 
            className="absolute bottom-[20%] right-[25%] w-40 h-40 rounded-full opacity-[0.06]"
            style={{ 
              background: 'radial-gradient(circle, #a08060 0%, transparent 70%)',
              filter: 'blur(25px)'
            }} 
          />
          
          {/* Top edge shadow/gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent via-black/20 to-black/50" />
          
          {/* Scroll top roller/cylinder */}
          <motion.div 
            className="absolute -top-6 left-0 right-0 h-12 rounded-t-full shadow-xl"
            style={{ 
              background: 'linear-gradient(180deg, #c4a57b 0%, #d4b896 30%, #e8dcc8 50%, #d4b896 70%, #c4a57b 100%)',
              scaleY: useTransform(scrollYProgress, [0, 0.2], [1, 0]),
              originY: 0,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
            }}
          >
            {/* Roller lines */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(139, 90, 43, 0.4) 8px, rgba(139, 90, 43, 0.4) 9px)',
              }}
            />
          </motion.div>
        </motion.div>

        {/* Bottom half of scroll - reveals upward from center */}
        <motion.div 
          className="absolute left-0 right-0"
          style={{ 
            bottom: bottomReveal,
            height: '50%',
            background: `
              linear-gradient(180deg, 
                #d4c4a8 0%, 
                #e8dcc8 15%, 
                #f0e4cc 30%, 
                #e8dcc8 50%,
                #f5edd8 70%,
                #e8dcc8 85%,
                #d4c4a8 100%
              )
            `,
            boxShadow: 'inset 0 20px 40px rgba(139, 90, 43, 0.15)',
          }}
        >
          {/* Parchment texture overlay */}
          <motion.div 
            className="absolute inset-0 opacity-[0.18]"
            style={{ 
              y: textureOffsetYNeg,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Aged spots */}
          <div 
            className="absolute top-[25%] left-[20%] w-36 h-36 rounded-full opacity-[0.07]"
            style={{ 
              background: 'radial-gradient(circle, #9a8060 0%, transparent 70%)',
              filter: 'blur(22px)'
            }} 
          />
          <div 
            className="absolute bottom-[15%] right-[18%] w-28 h-28 rounded-full opacity-[0.09]"
            style={{ 
              background: 'radial-gradient(circle, #8b7355 0%, transparent 70%)',
              filter: 'blur(18px)'
            }} 
          />
          
          {/* Bottom edge shadow/gradient */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 via-black/20 to-transparent" />
          
          {/* Scroll bottom roller/cylinder */}
          <motion.div 
            className="absolute -bottom-6 left-0 right-0 h-12 rounded-b-full shadow-xl"
            style={{ 
              background: 'linear-gradient(0deg, #c4a57b 0%, #d4b896 30%, #e8dcc8 50%, #d4b896 70%, #c4a57b 100%)',
              scaleY: useTransform(scrollYProgress, [0, 0.2], [1, 0]),
              originY: 1,
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5), inset 0 -2px 4px rgba(255,255,255,0.3)',
            }}
          >
            {/* Roller lines */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(139, 90, 43, 0.4) 8px, rgba(139, 90, 43, 0.4) 9px)',
              }}
            />
          </motion.div>
        </motion.div>

        {/* Center seam where scroll joins */}
        <motion.div 
          className="absolute left-0 right-0 h-20"
          style={{ 
            top: '50%',
            y: '-50%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(139, 90, 43, 0.12) 45%, rgba(139, 90, 43, 0.18) 50%, rgba(139, 90, 43, 0.12) 55%, transparent 100%)',
            opacity: useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]),
          }}
        >
          {/* Center line detail */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-[#8b7355]/30 -translate-y-1/2" />
          
          {/* Decorative stitch marks along center */}
          <div 
            className="absolute top-1/2 left-[10%] w-1 h-3 -translate-y-1/2 rounded-full opacity-20"
            style={{ backgroundColor: '#8b7355' }}
          />
          <div 
            className="absolute top-1/2 left-[30%] w-1 h-3 -translate-y-1/2 rounded-full opacity-20"
            style={{ backgroundColor: '#8b7355' }}
          />
          <div 
            className="absolute top-1/2 right-[30%] w-1 h-3 -translate-y-1/2 rounded-full opacity-20"
            style={{ backgroundColor: '#8b7355' }}
          />
          <div 
            className="absolute top-1/2 right-[10%] w-1 h-3 -translate-y-1/2 rounded-full opacity-20"
            style={{ backgroundColor: '#8b7355' }}
          />
        </motion.div>

        {/* Vignette overlay for depth */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(26, 26, 26, 0.2) 60%, rgba(26, 26, 26, 0.5) 85%, rgba(26, 26, 26, 0.8) 100%)',
          }}
        />
        
        {/* Subtle grain texture */}
        <div 
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Torn/worn edges effect */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          <defs>
            <filter id="edge-wear">
              <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
            </filter>
          </defs>
          <rect 
            x="0" y="0" width="100%" height="100%" 
            fill="none"
            stroke="#8b7355"
            strokeWidth="8"
            filter="url(#edge-wear)"
            opacity="0.15"
          />
        </svg>
      </motion.div>
    </div>
  );
}
