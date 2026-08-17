'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface FramePlayerProps {
  totalFrames?: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function FramePlayer({ totalFrames = 120, containerRef }: FramePlayerProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [framesLoaded, setFramesLoaded] = useState(false);
  const loadedFrames = useRef<Set<number>>(new Set());
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // Map scroll progress to frame number
  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, totalFrames - 1]);

  useEffect(() => {
    const unsubscribe = frameIndex.on('change', (latest) => {
      setCurrentFrame(Math.round(latest));
    });
    return () => unsubscribe();
  }, [frameIndex]);

  // Preload frames
  useEffect(() => {
    // Load first few frames immediately
    for (let i = 0; i < Math.min(10, totalFrames); i++) {
      const img = new Image();
      img.src = `/frames/frame_${String(i).padStart(3, '0')}_delay-0.033s.jpg`;
      img.onload = () => {
        loadedFrames.current.add(i);
        if (loadedFrames.current.size >= totalFrames) {
          setFramesLoaded(true);
        }
      };
    }

    // Load remaining frames progressively
    let loadIndex = 10;
    const loadInterval = setInterval(() => {
      if (loadIndex < totalFrames) {
        const batchSize = 5;
        for (let i = loadIndex; i < Math.min(loadIndex + batchSize, totalFrames); i++) {
          const img = new Image();
          img.src = `/frames/frame_${String(i).padStart(3, '0')}_delay-0.033s.jpg`;
          img.onload = () => {
            loadedFrames.current.add(i);
            if (loadedFrames.current.size >= totalFrames) {
              setFramesLoaded(true);
              clearInterval(loadInterval);
            }
          };
        }
        loadIndex += batchSize;
      } else {
        clearInterval(loadInterval);
      }
    }, 100);

    return () => clearInterval(loadInterval);
  }, [totalFrames]);

  const frameSrc = `/frames/frame_${String(currentFrame).padStart(3, '0')}_delay-0.033s.jpg`;

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10"
      style={{ 
        opacity: useTransform(scrollYProgress, [0, 0.1, 0.7, 0.8], [0, 1, 1, 0]),
        scale: useTransform(scrollYProgress, [0, 0.15, 0.7, 0.8], [1.1, 1, 1, 0.95]),
      }}
    >
      {/* Frame display with paper-style framing */}
      <div className="relative w-full h-full max-w-4xl max-h-[70vh] mx-auto p-4 md:p-8">
        
        {/* Outer decorative frame */}
        <div className="absolute inset-0 border-2 border-amber-700/40 rounded-lg shadow-2xl shadow-black/50">
          {/* Corner ornaments */}
          <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-amber-600 rounded-tl" />
          <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-amber-600 rounded-tr" />
          <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-amber-600 rounded-bl" />
          <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-amber-600 rounded-br" />
        </div>

        {/* Inner content area */}
        <div className="relative w-full h-full bg-[#0f0f0f] rounded overflow-hidden shadow-inner">
          
          {/* The actual frame image */}
          <img
            src={frameSrc}
            alt={`Animation frame ${currentFrame}`}
            className="w-full h-full object-contain"
            loading="eager"
          />

          {/* Loading indicator */}
          {!framesLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-amber-500 text-sm font-cinzel tracking-wider">
                LOADING FRAMES... {Math.round((loadedFrames.current.size / totalFrames) * 100)}%
              </div>
            </div>
          )}

          {/* Subtle scan line effect for vintage feel */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
            }}
          />
        </div>

        {/* Frame counter (subtle) */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-amber-700/50 text-xs font-mono">
          {String(currentFrame + 1).padStart(3, '0')} / {String(totalFrames).padStart(3, '0')}
        </div>
      </div>
    </motion.div>
  );
}
