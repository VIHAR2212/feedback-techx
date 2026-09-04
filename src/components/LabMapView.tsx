'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useLabs } from '@/context/LabsContext';
import {
  expeditionLabs,
  getSubmittedFeedbackForUser,
  saveSubmittedFeedbackForUser,
  CheckpointNode,
} from '@/lib/expeditionData';
import ProductObservationModal from './ProductObservationModal';
import { CheckpointIcon } from './RusticIcons';
import { motion, AnimatePresence } from 'framer-motion';

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const defaultLabMapImages: Record<string, string> = {
  '1': '/assets/images/journal-spread-lab1.jpg',
  '2': '/assets/images/journal-spread-lab2.jpg',
  '3': '/assets/images/journal-spread-lab3.jpg',
  a: '/assets/images/journal-spread-lab1.jpg',
  b: '/assets/images/journal-spread-lab2.jpg',
  c: '/assets/images/journal-spread-lab3.jpg',
  portolan: '/assets/images/journal-spread-lab1.jpg',
  libertalia: '/assets/images/journal-spread-lab2.jpg',
  'kings-bay': '/assets/images/journal-spread-lab3.jpg',
};

type ExpeditionTheme = 'jungle' | 'ice' | 'volcanic';

const THEME_STYLES: Record<
  ExpeditionTheme,
  {
    unsurveyedStroke: string;
    glowColor: string;
    haloStroke: string;
    activeStroke: string;
    coreGlow: string;
  }
> = {
  jungle: {
    unsurveyedStroke: '#140903',
    glowColor: '#16a34a',
    haloStroke: 'rgba(34, 197, 94, 0.28)',
    activeStroke: '#16a34a',
    coreGlow: '#86efac',
  },
  ice: {
    unsurveyedStroke: '#140903',
    glowColor: '#0284c7',
    haloStroke: 'rgba(35, 150, 220, 0.28)',
    activeStroke: '#1598d0',
    coreGlow: '#7dd3fc',
  },
  volcanic: {
    unsurveyedStroke: '#140903',
    glowColor: '#ea580c',
    haloStroke: 'rgba(234, 88, 12, 0.28)',
    activeStroke: '#ea580c',
    coreGlow: '#fdba74',
  },
};

interface LabMapViewProps {
  labId: string;
  userEmail?: string;
}

export default function LabMapView({ labId, userEmail: propUserEmail }: LabMapViewProps) {
  const router = useRouter();
  const { user } = useUser();
  const userEmail = propUserEmail || user?.email || 'explorer@field.recon';
  const labAliases: Record<string, string> = { '1': '1', a: '1', '2': '2', c: '2', '3': '3', d: '3' };
  const labKey = labAliases[labId] || labId || '1';

  // Real-time reactive labs state from database (syncs with Admin page edits)
  const { labs } = useLabs();
  const labConfig = labs[labKey] || labs[labId] || expeditionLabs[labKey] || expeditionLabs[labId] || expeditionLabs['1'];
  const mapBgImage = labConfig?.mapImage || defaultLabMapImages[labId] || defaultLabMapImages[labKey] || '/assets/images/journal-spread-lab1.jpg';
  // Typed as string: DB-backed configs may carry variant spellings
  // ('ice', 'volcanic') that the normalizer below maps onto themes.
  const themeType: string = labConfig?.themeType || (labKey === '2' ? 'frost' : labKey === '3' ? 'volcano' : 'jungle');
  
  const normalizedTheme: ExpeditionTheme =
    themeType === 'frost' || themeType === 'ice'
      ? 'ice'
      : themeType === 'volcano' || themeType === 'volcanic'
        ? 'volcanic'
        : 'jungle';

  const themeStyle = THEME_STYLES[normalizedTheme];

  const products: CheckpointNode[] = useMemo(() => labConfig?.checkpoints || [], [labConfig]);

  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<CheckpointNode>(
    products[0] || {
      id: 'default',
      name: 'Survey Point',
      description: 'Initial checkpoint',
      icon: '🧭',
      x: 50,
      y: 50,
    }
  );
  const [activeModalProduct, setActiveModalProduct] = useState<CheckpointNode | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Dynamic Map Container Size & Node Coordinates
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    if (userEmail) {
      const submitted = getSubmittedFeedbackForUser(userEmail);
      setSubmittedIds(submitted);
    }
  }, [userEmail]);

  // Keep selectedProduct in sync when products change or initial load
  useEffect(() => {
    if (products.length > 0) {
      const found = products.find((p) => p.id === selectedProduct?.id);
      if (found) {
        setSelectedProduct(found);
      } else {
        setSelectedProduct(products[0]);
      }
    }
  }, [products, selectedProduct?.id]);

  // Track exact container dimensions to guarantee pixel-perfect SVG alignment
  const updateDimensions = useCallback(() => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setContainerSize({ width: rect.width, height: rect.height });
    }
  }, []);

  useEffect(() => {
    const frameId = requestAnimationFrame(updateDimensions);
    const timer1 = setTimeout(updateDimensions, 60);
    const timer2 = setTimeout(updateDimensions, 300);

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    window.addEventListener('resize', updateDimensions);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timer1);
      clearTimeout(timer2);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [updateDimensions, viewMode]);

  const handleProductSubmitSuccess = (productId: string, notes?: string) => {
    const updated = saveSubmittedFeedbackForUser(userEmail, productId);
    // Persist the surveyor's typed observations so they survive reloads
    // (keyed per user + checkpoint).
    if (notes) {
      try {
        const key = `checkpointNotes_${userEmail}`;
        const stored = JSON.parse(localStorage.getItem(key) || '{}') as Record<string, string>;
        stored[productId] = notes;
        localStorage.setItem(key, JSON.stringify(stored));
      } catch {
        // Non-fatal — progress above is already saved.
      }
    }
    setSubmittedIds(updated);
    setActiveModalProduct(null);
  };

  const completedCount = products.filter((p) => submittedIds.includes(p.id)).length;
  const totalCount = products.length;

  // Exact mathematically aligned pixel positions for each node
  const nodePixelPositions = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return [];
    return products.map((p) => ({
      id: p.id,
      x: (p.x / 100) * containerSize.width,
      y: (p.y / 100) * containerSize.height,
    }));
  }, [products, containerSize]);

  // Deterministic seed generation from segment ID
  const hashSegmentId = useCallback((id: string): number => {
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) {
      h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
    }
    return (h % 90000) + 1000;
  }, []);

  // Smooth natural Catmull-Rom tangent cubic spline through exact node centers
  const routePaths = useMemo(() => {
    if (nodePixelPositions.length < 2) {
      return {
        plannedPath: '',
        completedPath: '',
        segments: [],
        points: nodePixelPositions,
      };
    }

    const n = nodePixelPositions.length;
    const tension = 0.68;

    // Helper: evaluate cubic Bezier at parameter t in [0, 1]
    const evalBezier = (
      p1: { x: number; y: number },
      cp1: { x: number; y: number },
      cp2: { x: number; y: number },
      p2: { x: number; y: number },
      t: number
    ) => {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;
      return {
        x: uuu * p1.x + 3 * uu * t * cp1.x + 3 * u * tt * cp2.x + ttt * p2.x,
        y: uuu * p1.y + 3 * uu * t * cp1.y + 3 * u * tt * cp2.y + ttt * p2.y,
      };
    };

    // Helper: evaluate cubic Bezier first derivative (tangent vector) at parameter t
    const evalBezierDerivative = (
      p1: { x: number; y: number },
      cp1: { x: number; y: number },
      cp2: { x: number; y: number },
      p2: { x: number; y: number },
      t: number
    ) => {
      const u = 1 - t;
      const dx = 3 * u * u * (cp1.x - p1.x) + 6 * u * t * (cp2.x - cp1.x) + 3 * t * t * (p2.x - cp2.x);
      const dy = 3 * u * u * (cp1.y - p1.y) + 6 * u * t * (cp2.y - cp1.y) + 3 * t * t * (p2.y - cp2.y);
      return { dx, dy };
    };

    // Calculate boundary & internal tangent vectors for smooth continuous curvature
    const tangents = nodePixelPositions.map((p, i) => {
      if (i === 0) {
        return {
          x: (nodePixelPositions[1].x - p.x) * tension,
          y: (nodePixelPositions[1].y - p.y) * tension,
        };
      }
      if (i === n - 1) {
        return {
          x: (p.x - nodePixelPositions[n - 2].x) * tension,
          y: (p.y - nodePixelPositions[n - 2].y) * tension,
        };
      }
      return {
        x: ((nodePixelPositions[i + 1].x - nodePixelPositions[i - 1].x) / 2) * tension,
        y: ((nodePixelPositions[i + 1].y - nodePixelPositions[i - 1].y) / 2) * tension,
      };
    });

    let plannedPath = `M ${nodePixelPositions[0].x.toFixed(1)} ${nodePixelPositions[0].y.toFixed(1)}`;
    const completedSegments: string[] = [];
    const segments: Array<{
      id: string;
      d: string;
      midpoint: { x: number; y: number; rx: number; ry: number; angleDeg: number };
      isCompleted: boolean;
      isActive: boolean;
    }> = [];

    for (let i = 0; i < n - 1; i++) {
      const p1 = nodePixelPositions[i];
      const p2 = nodePixelPositions[i + 1];
      const t1 = tangents[i];
      const t2 = tangents[i + 1];

      // Pure tangent-based cubic bezier
      const cp1 = { x: p1.x + t1.x, y: p1.y + t1.y };
      const cp2 = { x: p2.x - t2.x, y: p2.y - t2.y };

      const segD = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} C ${cp1.x.toFixed(1)} ${cp1.y.toFixed(1)}, ${cp2.x.toFixed(1)} ${cp2.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      plannedPath += ` C ${cp1.x.toFixed(1)} ${cp1.y.toFixed(1)}, ${cp2.x.toFixed(1)} ${cp2.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;

      // Approximate segment length
      let approxLen = 0;
      let prevPt: { x: number; y: number } = p1;
      for (let s = 1; s <= 10; s++) {
        const curPt = evalBezier(p1, cp1, cp2, p2, s / 10);
        approxLen += Math.hypot(curPt.x - prevPt.x, curPt.y - prevPt.y);
        prevPt = curPt;
      }
      const segLen = Math.max(approxLen, 30);

      // Midpoint geometry for surveyed glow ellipse
      const midPt = evalBezier(p1, cp1, cp2, p2, 0.5);
      const midDeriv = evalBezierDerivative(p1, cp1, cp2, p2, 0.5);
      const angleDeg = (Math.atan2(midDeriv.dy, midDeriv.dx) * 180) / Math.PI;
      const midpoint = {
        x: Number(midPt.x.toFixed(1)),
        y: Number(midPt.y.toFixed(1)),
        rx: Number(Math.max(segLen * 0.45, 25).toFixed(1)),
        ry: 25,
        angleDeg: Number(angleDeg.toFixed(1)),
      };

      const isCompleted = submittedIds.includes(p1.id) && submittedIds.includes(p2.id);
      const isActive =
        (submittedIds.includes(p1.id) && !submittedIds.includes(p2.id)) ||
        (i === 0 && submittedIds.length === 0);

      if (isCompleted) {
        completedSegments.push(segD);
      }

      segments.push({
        id: `${p1.id}-${p2.id}`,
        d: segD,
        midpoint,
        isCompleted,
        isActive,
      });
    }

    return {
      plannedPath,
      completedPath: completedSegments.join(' '),
      segments,
      points: nodePixelPositions,
    };
  }, [nodePixelPositions, submittedIds]);

  const handleShareLinkedIn = () => {
    const shareText = `I completed ${labConfig?.title || 'Expedition'} and charted all ${totalCount} naval checkpoints in my Field Journal!`;
    window.open(
      `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`,
      '_blank'
    );
  };

  const selectedIndex = products.findIndex((p) => p.id === selectedProduct?.id);

  return (
    <div className="relative w-full h-[100dvh] bg-[#080503] text-[#2c1a0e] flex flex-col justify-start overflow-hidden select-none font-serif pb-14 sm:pb-16 lg:pb-14">
      {/* Background Lighting Vignette */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_rgba(240,210,140,0.06)_0%,_rgba(4,2,1,0.98)_85%)] pointer-events-none z-0" />

      {/* 1. Header Ribbon HUD */}
      <header className="relative z-30 flex items-center justify-between px-3.5 py-1.5 sm:px-6 sm:py-2 bg-[#120a06]/95 backdrop-blur-none sm:backdrop-blur-md border-b border-[#4d321d]/70 shadow-lg shrink-0 text-[#e8d5b5]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/labs')}
            aria-label="Return to Expeditions"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded border border-[#6b4728] bg-[#22150e] flex items-center justify-center text-[#c99f58] hover:text-[#f3dfa2] active:scale-95 transition cursor-pointer shrink-0 shadow-sm"
          >
            <span className="text-xs font-mono font-bold">◀</span>
          </button>

          <div className="min-w-0">
            <span className="block text-[8px] sm:text-[9.5px] font-bold uppercase tracking-[0.25em] text-[#9c7846] font-mono truncate">
              JOURNAL // {labConfig?.name || 'FIELD RECON'}
            </span>
            <h1 className="text-xs sm:text-base font-bold text-[#f2dfbe] truncate font-['Cinzel',_serif] tracking-wider">
              {labConfig?.title || 'Expedition Sector'}
            </h1>
          </div>
        </div>

        {/* View Switcher & Relics Counter */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex p-0.5 rounded bg-[#0d0704] border border-[#52351e]">
            <button
              onClick={() => setViewMode('map')}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9.5px] sm:text-xs font-bold uppercase tracking-wider rounded font-mono transition cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-gradient-to-b from-[#d4af37] to-[#8c6d23] text-[#120b06] shadow'
                  : 'text-[#8c6f4b] hover:text-[#c49b4d]'
              }`}
            >
              Journal
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9.5px] sm:text-xs font-bold uppercase tracking-wider rounded font-mono transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-gradient-to-b from-[#d4af37] to-[#8c6d23] text-[#120b06] shadow'
                  : 'text-[#8c6f4b] hover:text-[#c49b4d]'
              }`}
            >
              List
            </button>
          </div>

          <div className="text-right pl-2 border-l border-[#4d321d]/60 flex items-center gap-1.5">
            <div>
              <span className="block text-[7px] sm:text-[8px] tracking-widest uppercase text-[#8c6b41] font-mono font-bold leading-tight">
                RELICS
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-[#e5a842] leading-tight">
                {completedCount}/{totalCount}
              </span>
            </div>
            <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#241308] border border-[#8c6d23] flex items-center justify-center shadow-inner">
              <span className="text-[8.5px] sm:text-[9px] text-[#ffd700]">✦</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Open Journal Workspace */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-start sm:justify-center p-1 sm:p-2 lg:p-3 overflow-hidden w-full max-w-7xl mx-auto">
        {viewMode === 'map' ? (
          <div className="relative w-full h-full flex flex-col lg:flex-row items-center justify-between max-w-[1040px] aspect-[1024/615] max-h-[79vh] lg:max-h-[82vh] rounded-xl border-2 sm:border-4 border-[#241308] shadow-[0_25px_65px_rgba(0,0,0,0.98)] overflow-hidden">
            {/* Desktop Full Open Book Spread Background */}
            <div
              style={{ backgroundImage: `url('${mapBgImage}')` }}
              className="hidden lg:block absolute inset-0 w-full h-full bg-[length:100%_100%] bg-center bg-no-repeat pointer-events-none z-0"
            />

            {/* ================= MAP SECTION (LEFT SPREAD) ================= */}
            <div className="relative w-full flex-1 min-h-0 lg:w-1/2 lg:h-full z-10 flex items-center justify-center overflow-hidden py-0.5">
              <div
                ref={mapContainerRef}
                style={{
                  backgroundImage: `url('${mapBgImage}')`,
                  backgroundSize: '200% 100%',
                  backgroundPosition: 'left center',
                  backgroundRepeat: 'no-repeat',
                }}
                className="relative h-full aspect-[8/9] max-w-full max-h-full rounded-xl lg:rounded-none border-2 sm:border-4 lg:border-none border-[#241308] shadow-[0_12px_36px_rgba(0,0,0,0.95)] lg:shadow-none overflow-hidden lg:bg-none"
              >
                {/* Hand-drawn Inked Parchment Route with Continuous Soft Atmospheric Glow */}
                {containerSize.width > 0 && containerSize.height > 0 && routePaths.points.length > 0 && (
                  <svg
                    viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  >
                    <defs>
                      <style>{`
                        @keyframes trailBreath {
                          0%, 100% {
                            opacity: 0.40;
                          }
                          50% {
                            opacity: 0.85;
                          }
                        }
                        .trail-glow-active {
                          animation: trailBreath 3s ease-in-out infinite;
                          will-change: opacity;
                        }
                      `}</style>
                    </defs>

                    {/* 1. CONTINUOUS SOFT GLOW HALO LAYER (Hardware-accelerated multi-stroke, 0% CPU overhead) */}
                    <g className="trail-glow-active">
                      {routePaths.segments.map((seg) => {
                        if (seg.isCompleted || seg.isActive) {
                          return (
                            <React.Fragment key={`glow-wrap-${seg.id}`}>
                              {/* Outer diffuse stroke */}
                              <path
                                d={seg.d}
                                fill="none"
                                stroke={themeStyle.haloStroke}
                                strokeWidth="16"
                                strokeDasharray="14 12"
                                strokeLinecap="round"
                                opacity={0.4}
                              />
                              {/* Inner focused aura */}
                              <path
                                d={seg.d}
                                fill="none"
                                stroke={themeStyle.glowColor}
                                strokeWidth="10"
                                strokeDasharray="14 12"
                                strokeLinecap="round"
                                opacity={0.35}
                              />
                            </React.Fragment>
                          );
                        }
                        return (
                          <path
                            key={`glow-unvisited-${seg.id}`}
                            d={seg.d}
                            fill="none"
                            stroke="rgba(210, 165, 65, 0.12)"
                            strokeWidth="12"
                            strokeDasharray="14 12"
                            strokeLinecap="round"
                          />
                        );
                      })}
                    </g>

                    {/* 2. CRISP CORE TRAIL (Solid dark ink dashed path) */}
                    {routePaths.segments.map((seg) => (
                      <path
                        key={`core-${seg.id}`}
                        d={seg.d}
                        fill="none"
                        stroke={
                          seg.isCompleted || seg.isActive
                            ? themeStyle.activeStroke
                            : themeStyle.unsurveyedStroke
                        }
                        strokeWidth="6"
                        strokeDasharray="14 12"
                        strokeLinecap="round"
                        opacity={seg.isCompleted ? 0.95 : seg.isActive ? 0.9 : 0.8}
                      />
                    ))}

                    {/* 3. Concentric Waypoint Rings centered on each measured node */}
                    {routePaths.points.map((pt) => {
                      const isDone = submittedIds.includes(pt.id);
                      return (
                        <g key={`anchor-${pt.id}`}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isDone ? 20 : 16}
                            fill="none"
                            stroke={isDone ? themeStyle.glowColor : themeStyle.unsurveyedStroke}
                            strokeWidth={isDone ? '1.8' : '1'}
                            strokeDasharray={isDone ? 'none' : '3 3'}
                            opacity={isDone ? 0.95 : 0.6}
                          />
                        </g>
                      );
                    })}
                  </svg>
                )}

                {/* Interactive Checkpoint Pins (Precisely centered at product.x%, product.y%) */}
                {products.map((product, idx) => {
                  const isSubmitted = submittedIds.includes(product.id);
                  const isCurrent = selectedProduct?.id === product.id;
                  const labelTag = `WP-${String(idx + 1).padStart(2, '0')}`;

                  const submittedPinStyle =
                    themeType === 'jungle'
                      ? 'bg-gradient-to-b from-[#bbf7d0] via-[#22c55e] to-[#14532d] border-2 border-[#dcfce7] text-[#052e16] shadow-[0_0_14px_rgba(34,197,94,0.85)] ring-1 ring-[#22c55e]'
                      : themeType === 'frost'
                        ? 'bg-gradient-to-b from-[#bae6fd] via-[#0284c7] to-[#0c4a6e] border-2 border-[#e0f2fe] text-[#082f49] shadow-[0_0_14px_rgba(56,189,248,0.85)] ring-1 ring-[#38bdf8]'
                        : themeType === 'volcano'
                          ? 'bg-gradient-to-b from-[#fed7aa] via-[#ea580c] to-[#7c2d12] border-2 border-[#ffedd5] text-[#431407] shadow-[0_0_14px_rgba(249,115,22,0.85)] ring-1 ring-[#ea580c]'
                          : 'bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#854d0e] border-2 border-[#fffbeb] text-[#1c1917] shadow-[0_0_14px_rgba(234,179,8,0.8)] ring-1 ring-[#eab308]';

                  return (
                    <div
                      key={product.id}
                      style={{ left: `${product.x}%`, top: `${product.y}%` }}
                      className="absolute z-20 pointer-events-auto"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(product);
                          setActiveModalProduct(product);
                        }}
                        className="relative flex flex-col items-center -translate-x-1/2 -translate-y-[14px] sm:-translate-y-[16px] focus:outline-none touch-manipulation cursor-pointer group"
                      >
                        {/* Outer Rotating Celestial Ring on Selected Waypoint */}
                        {isCurrent && (
                          <span className="absolute -top-1 w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-dashed border-[#d4af37] animate-[spin_10s_linear_infinite] will-change-transform transform-gpu pointer-events-none" />
                        )}

                        {/* Main Cartographic Compass Medallion */}
                        <div
                          className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-115 ${
                            isSubmitted
                              ? submittedPinStyle
                              : isCurrent
                                ? 'bg-gradient-to-b from-[#fef08a] via-[#d4af37] to-[#78350f] border-2 border-[#fff3cc] text-[#1a0e05] scale-110 shadow-[0_0_16px_rgba(212,175,55,0.9)] ring-2 ring-[#fde047]'
                                : 'bg-gradient-to-b from-[#2b1708] via-[#1a0f05] to-[#0d0702] border-2 border-[#8c6d23] text-[#d4af37] shadow-[0_4px_10px_rgba(0,0,0,0.85)]'
                          }`}
                        >
                          {/* Subtle 4-axis compass notch markers */}
                          <div className="absolute -top-0.5 w-1 h-0.5 bg-[#8c6d23] rounded-full pointer-events-none" />
                          <div className="absolute -bottom-0.5 w-1 h-0.5 bg-[#8c6d23] rounded-full pointer-events-none" />
                          <div className="absolute -left-0.5 w-0.5 h-1 bg-[#8c6d23] rounded-full pointer-events-none" />
                          <div className="absolute -right-0.5 w-0.5 h-1 bg-[#8c6d23] rounded-full pointer-events-none" />

                          {/* Stamped Roman Numeral or Cleared Star */}
                          <span className="font-serif font-black text-[11px] sm:text-xs leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
                            {isSubmitted ? '✦' : ROMAN_NUMERALS[idx] || idx + 1}
                          </span>
                        </div>

                        {/* Needle Tip Pointing to Exact Coordinates */}
                        <div
                          className={`w-0 h-0 border-l-[4px] border-r-[4px] border-l-transparent border-r-transparent border-t-[5px] -mt-0.5 drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] ${
                            isSubmitted
                              ? themeType === 'jungle'
                                ? 'border-t-[#22c55e]'
                                : themeType === 'frost'
                                  ? 'border-t-[#0284c7]'
                                  : themeType === 'volcano'
                                    ? 'border-t-[#ea580c]'
                                    : 'border-t-[#eab308]'
                              : isCurrent
                                ? 'border-t-[#d4af37]'
                                : 'border-t-[#8c6d23]'
                          }`}
                        />

                        {/* Small Waypoint Tag */}
                        <span className="mt-0.5 px-1.5 py-0.2 rounded bg-[#120a06]/95 border border-[#8c6d23]/40 text-[7.5px] sm:text-[8.5px] font-mono font-bold text-[#e8d5b5] shadow-xs whitespace-nowrap pointer-events-none">
                          {labelTag}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ================= MOBILE ONLY: Dossier Scrap ================= */}
            <div className="lg:hidden w-full shrink-0 z-30 pointer-events-auto px-2 pt-0.5 pb-1">
              <div
                style={{
                  backgroundImage: `url('/assets/images/expedition_status_bg.webp')`,
                  aspectRatio: '520 / 260',
                }}
                className="relative w-full max-w-[360px] sm:max-w-[400px] mx-auto bg-[length:100%_100%] bg-no-repeat bg-center drop-shadow-[0_12px_28px_rgba(0,0,0,0.95)] select-none overflow-hidden"
              >
                {/* Printable Parchment Area: comfortably positioned below Drake's ring */}
                <div className="absolute inset-0 pt-[16%] pb-[6%] px-[6%] sm:px-[7%] flex flex-col justify-between text-[#2b1704] overflow-hidden">
                  {/* Badge Row */}
                  <div className="flex items-center justify-between border-b border-[#8b6943]/30 pb-0.5 shrink-0">
                    <div className="flex items-center gap-1.5 min-w-0 pr-1">
                      <CheckpointIcon index={selectedIndex >= 0 ? selectedIndex : 0} size={12} color="#7a5214" />
                      <span className="text-[7.5px] sm:text-[8.5px] font-extrabold uppercase font-mono tracking-wider text-[#7a5214] truncate">
                        WAYPOINT {String((selectedIndex >= 0 ? selectedIndex : 0) + 1).padStart(2, '0')} • SIC PARVIS MAGNA
                      </span>
                    </div>
                    <span
                      className={`text-[7px] sm:text-[7.5px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 shadow-xs ${
                        selectedProduct && submittedIds.includes(selectedProduct.id)
                          ? 'bg-[#8b261d]/15 text-[#8b261d] border border-[#8b261d]/40'
                          : 'bg-[#7a5214]/10 text-[#7a5214] border border-[#7a5214]/30'
                      }`}
                    >
                      {selectedProduct && submittedIds.includes(selectedProduct.id) ? 'LOGGED ✦' : 'PENDING'}
                    </span>
                  </div>

                  {/* Big Prominent Title & Detailed Handwritten Description */}
                  <div className="py-1 my-auto min-h-0 flex-1 flex flex-col justify-center overflow-y-auto">
                    <h3 className="text-xs sm:text-sm font-bold text-[#1c0f05] leading-tight font-['EB_Garamond',_serif] tracking-tight truncate drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                      {selectedProduct?.name || 'Waypoint'}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-[#4a2810] italic leading-snug line-clamp-3 mt-0.5 font-[family-name:var(--font-handwriting)] font-semibold">
                      &quot;{selectedProduct?.description || 'Select coordinate on the map to rate and inspect'}&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= DESKTOP ONLY: Right Page Field Ledger ================= */}
            <div className="hidden lg:flex relative w-1/2 h-full z-10 pt-7 pb-6 pl-12 pr-10 sm:pt-8 sm:pb-7 sm:pl-14 sm:pr-12 flex-col justify-between overflow-y-auto">
              {/* Top Header Section */}
              <div className="flex items-start justify-between border-b-2 border-[#8b6943]/35 pb-2">
                <div>
                  <span className="block text-[9.5px] font-mono font-bold uppercase tracking-[0.25em] text-[#7a481c]">
                    EXPEDITION DOSSIER // {labConfig?.name?.toUpperCase() || 'FIELD RECON'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#241308] font-['EB_Garamond',_serif] tracking-tight leading-tight mt-0.5">
                    Field Reconnaissance & Log
                  </h2>
                </div>
                <span
                  className={`text-[9.5px] font-mono font-bold px-2.5 py-1 rounded border shadow-sm ${
                    selectedProduct && submittedIds.includes(selectedProduct.id)
                      ? 'bg-[#8b261d]/15 text-[#8b261d] border-[#8b261d]/40 -rotate-2'
                      : 'bg-[#7a5214]/10 text-[#7a5214] border-[#7a5214]/30'
                  }`}
                >
                  {selectedProduct && submittedIds.includes(selectedProduct.id) ? '✦ SURVEY CLEARED' : 'UNSURVEYED COORD'}
                </span>
              </div>

              {/* Selected Waypoint Dossier Plaque */}
              <div className="my-auto py-2">
                <div className="p-3.5 sm:p-4 rounded-lg border border-[#8b6943]/35 bg-[#2b180d]/[0.03] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                  {/* Waypoint Coordinates & Status */}
                  <div className="flex items-center justify-between border-b border-[#8b6943]/25 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <CheckpointIcon index={selectedIndex >= 0 ? selectedIndex : 0} size={18} color="#7a481c" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7a481c]">
                        WAYPOINT 0{selectedIndex + 1} • LAT: {selectedProduct?.y}°N · LNG: {selectedProduct?.x}°W
                      </span>
                    </div>
                    <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-[#8c6f4b]">
                      SIC PARVIS MAGNA
                    </span>
                  </div>

                  {/* Waypoint Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-[#241308] font-['EB_Garamond',_serif] leading-tight">
                    {selectedProduct?.name}
                  </h3>

                  {/* Field Notes Handwriting Quote */}
                  <div className="mt-2.5 pl-3 border-l-2 border-[#7a481c]/50">
                    <p className="text-sm text-[#3d200e] font-[family-name:var(--font-handwriting)] font-semibold italic leading-relaxed">
                      &quot;{selectedProduct?.description}&quot;
                    </p>
                  </div>
                </div>

                {/* Celestial Coordinate Index (Waypoint Selector Buttons) */}
                <div className="mt-4 sm:mt-5">
                  <span className="block text-[9.5px] font-mono font-bold uppercase tracking-[0.2em] text-[#652B19] mb-1.5">
                    CELESTIAL COORDINATE INDEX
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {products.map((p, i) => {
                      const isDone = submittedIds.includes(p.id);
                      const isSel = selectedProduct?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedProduct(p);
                            setActiveModalProduct(p);
                          }}
                          className={`py-2 px-1 rounded-md border flex flex-col items-center justify-between gap-1 transition-all cursor-pointer ${
                            isSel
                              ? 'bg-[#d4af37]/35 border-[#7a5214] ring-2 ring-[#d4af37]/80 shadow-md scale-[1.03]'
                              : 'bg-[#2b180d]/[0.03] border-[#8b6943]/30 hover:bg-[#2b180d]/[0.07] hover:border-[#7a5214]/50'
                          }`}
                        >
                          <CheckpointIcon index={i} size={16} color={isSel ? '#241308' : isDone ? '#8b261d' : '#7a5214'} />
                          <span className="text-[9.5px] font-mono font-bold text-[#241308] tracking-tight">
                            {isDone ? '✦ LOGGED' : `WP-0${i + 1}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Info Note / Continue Expedition if Complete */}
              <div className="pt-3 border-t border-[#8b6943]/25 flex flex-col gap-2">
                {completedCount === totalCount && totalCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => router.push('/labs')}
                    style={{
                      clipPath:
                        'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
                    }}
                    className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-b from-[#22c55e] via-[#16a34a] to-[#15803d] text-white font-bold text-xs uppercase tracking-widest shadow-md hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 font-['Cinzel',_serif] cursor-pointer border-t border-[#86efac]/60"
                  >
                    <span>Continue Expedition</span>
                    <span className="text-xs">➔</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#7a481c] py-1">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span className="text-[#c49b4d]">✦</span> Click any waypoint node to view & submit rating
                    </span>
                    <span className="font-bold text-[#241308]">
                      {completedCount}/{totalCount} Completed
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* List Mode Overlay */
          <div className="w-full max-w-lg mx-auto flex flex-col gap-2.5 p-2 pb-24 overflow-y-auto z-40">
            {products.map((product, idx) => {
              const isDone = submittedIds.includes(product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product);
                    setActiveModalProduct(product);
                  }}
                  className="p-3.5 rounded bg-[#160f0a]/90 border border-[#5c4033]/40 flex items-center justify-between cursor-pointer hover:border-[#c49b4d]/60 active:scale-[0.99] transition shadow text-[#e8d5b5]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-xs shrink-0 ${
                        isDone
                          ? 'bg-gradient-to-b from-[#f3e5ab] via-[#d4af37] to-[#7a5214] text-[#1a0e05] border border-[#f3e5ab]'
                          : 'bg-[#2B1B11] text-[#D4AF37] border border-[#8A6839]'
                      }`}
                    >
                      {isDone ? '✦' : ROMAN_NUMERALS[idx] || idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#F5E6CC] truncate font-['Cinzel',_serif]">{product.name}</div>
                      <div className="text-[11px] text-[#8C6F4B] italic truncate font-[family-name:var(--font-handwriting)]">
                        {product.description}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded bg-[#2a1b11] text-[#c49b4d] font-bold shrink-0">
                    {isDone ? 'Reviewed' : 'Inspect'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Observation Feedback Modal */}
      <AnimatePresence>
        {activeModalProduct && (
          <ProductObservationModal
            product={activeModalProduct}
            isSubmitted={submittedIds.includes(activeModalProduct.id)}
            onClose={() => setActiveModalProduct(null)}
            onSuccess={({ rating, comment }) =>
              handleProductSubmitSuccess(
                activeModalProduct.id,
                comment || (rating > 0 ? `Rated ${rating}/5` : undefined)
              )
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}