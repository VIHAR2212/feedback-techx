'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import {
  expeditionLabs,
  getSubmittedFeedbackForUser,
  saveSubmittedFeedbackForUser,
  clearSubmittedFeedbackForUser,
  CheckpointNode,
} from '@/lib/expeditionData';
import ProductObservationModal from './ProductObservationModal';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckpointIcon } from './RusticIcons';

interface LabMapViewProps {
  labId: string;
}

export default function LabMapView({ labId }: LabMapViewProps) {
  const router = useRouter();
  const { user } = useUser();
  const userEmail = user?.email || 'explorer@field.recon';

  const labConfig = expeditionLabs[labId] || expeditionLabs['1'] || expeditionLabs['a'];
  const products = labConfig.checkpoints;

  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<CheckpointNode>(products[0]);
  const [activeModalProduct, setActiveModalProduct] = useState<CheckpointNode | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Dynamic Node Position Detection
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [nodePositions, setNodePositions] = useState<{ id: string; x: number; y: number }[]>([]);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    if (userEmail) {
      const submitted = getSubmittedFeedbackForUser(userEmail);
      setSubmittedIds(submitted);
    }
  }, [userEmail]);

  const updateNodePositions = useCallback(() => {
    if (!mapContainerRef.current) return;
    const mapRect = mapContainerRef.current.getBoundingClientRect();
    if (mapRect.width === 0 || mapRect.height === 0) return;

    setContainerSize({ width: mapRect.width, height: mapRect.height });

    const detected = products.map((product) => {
      const el = nodeRefs.current[product.id];
      if (el) {
        const nodeRect = el.getBoundingClientRect();
        return {
          id: product.id,
          x: nodeRect.left + nodeRect.width / 2 - mapRect.left,
          y: nodeRect.top + nodeRect.height / 2 - mapRect.top,
        };
      }
      return {
        id: product.id,
        x: (product.x / 100) * mapRect.width,
        y: (product.y / 100) * mapRect.height,
      };
    });

    setNodePositions(detected);
  }, [products]);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      updateNodePositions();
    });
    const timer1 = setTimeout(updateNodePositions, 50);
    const timer2 = setTimeout(updateNodePositions, 300);

    const resizeObserver = new ResizeObserver(() => {
      updateNodePositions();
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    window.addEventListener('resize', updateNodePositions);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timer1);
      clearTimeout(timer2);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateNodePositions);
    };
  }, [updateNodePositions, viewMode]);

  const handleProductSubmitSuccess = (productId: string) => {
    const updated = saveSubmittedFeedbackForUser(userEmail, productId);
    setSubmittedIds(updated);
    setActiveModalProduct(null);

    const allDone = products.every((p) => updated.includes(p.id));
    if (allDone) {
      setTimeout(() => setShowBadgeModal(true), 700);
    }
  };

  const handleSimulateCompletion = (productId: string) => {
    if (submittedIds.includes(productId)) {
      const filtered = submittedIds.filter((id) => id !== productId);
      localStorage.setItem(`feedback_submitted_${userEmail}`, JSON.stringify(filtered));
      setSubmittedIds(filtered);
    } else {
      handleProductSubmitSuccess(productId);
    }
  };

  const handleResetProgress = () => {
    clearSubmittedFeedbackForUser(userEmail);
    setSubmittedIds([]);
    setShowBadgeModal(false);
  };

  const completedCount = products.filter((p) => submittedIds.includes(p.id)).length;
  const totalCount = products.length;

  const routePaths = useMemo(() => {
    if (nodePositions.length < 2) {
      return {
        plannedPath: '',
        completedPath: '',
        plannedMidpoints: [] as { x: number; y: number }[],
        completedMidpoints: [] as { x: number; y: number }[],
        points: nodePositions,
      };
    }

    const sectorSeed = labId === '2' || labId === 'b' ? 1 : labId === '3' || labId === 'c' ? 2 : 0;

    // Helper to generate smooth winding nautical S-curves between waypoints (curved, organic, zero sharp corners)
    const generateCurvedVoyagePath = (pointsList: { x: number; y: number }[]) => {
      if (pointsList.length < 2) return { pathD: '', midpoints: [] as { x: number; y: number }[] };

      let d = `M ${pointsList[0].x.toFixed(1)} ${pointsList[0].y.toFixed(1)}`;
      const midpoints: { x: number; y: number }[] = [];

      for (let i = 0; i < pointsList.length - 1; i++) {
        const p1 = pointsList[i];
        const p2 = pointsList[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);

        if (dist === 0) continue;

        const nx = -dy / dist;
        const ny = dx / dist;

        // Smooth wave amplitude (alternating direction per leg with sector-specific harmonic seed)
        const sign = (i + sectorSeed) % 2 === 0 ? 1 : -1;
        const amp = Math.min(28, Math.max(16, dist * 0.20)) * sign;

        // Inflection midpoint between p1 and p2
        const midX = p1.x + dx * 0.5;
        const midY = p1.y + dy * 0.5;
        midpoints.push({ x: midX, y: midY });

        // First smooth S-curve lobe (p1 -> mid)
        const cp1x = p1.x + dx * 0.16 + nx * amp * 1.15;
        const cp1y = p1.y + dy * 0.16 + ny * amp * 1.15;
        const cp2x = p1.x + dx * 0.34 + nx * amp * 1.15;
        const cp2y = p1.y + dy * 0.34 + ny * amp * 1.15;

        // Second smooth S-curve lobe (mid -> p2)
        const cp3x = p1.x + dx * 0.66 - nx * amp * 1.15;
        const cp3y = p1.y + dy * 0.66 - ny * amp * 1.15;
        const cp4x = p1.x + dx * 0.84 - nx * amp * 1.15;
        const cp4y = p1.y + dy * 0.84 - ny * amp * 1.15;

        d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${midX.toFixed(1)} ${midY.toFixed(1)}`;
        d += ` C ${cp3x.toFixed(1)} ${cp3y.toFixed(1)}, ${cp4x.toFixed(1)} ${cp4y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }

      return { pathD: d, midpoints };
    };

    // 1. Planned Full Route in smooth curved nautical S-bends
    const { pathD: plannedD, midpoints: plannedMidpoints } = generateCurvedVoyagePath(nodePositions);

    // 2. Completed / Surveyed Illuminated Golden Trail
    const completedPositions = nodePositions.filter((p) => submittedIds.includes(p.id));
    const { pathD: completedD, midpoints: completedMidpoints } =
      completedPositions.length >= 2
        ? generateCurvedVoyagePath(completedPositions)
        : { pathD: '', midpoints: [] };

    return {
      plannedPath: plannedD,
      completedPath: completedD,
      plannedMidpoints,
      completedMidpoints,
      points: nodePositions,
    };
  }, [nodePositions, submittedIds]);

  const handleShareLinkedIn = () => {
    const shareText = `I completed ${labConfig.title} and charted all 5 naval checkpoints in my Field Journal!`;
    window.open(
      `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`,
      '_blank'
    );
  };

  const selectedIndex = products.findIndex((p) => p.id === selectedProduct.id);

  return (
    <div className="relative w-full h-[100dvh] bg-[#080503] text-[#2c1a0e] flex flex-col justify-between overflow-hidden select-none font-serif">
      {/* Background Lighting Vignette */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_rgba(240,210,140,0.06)_0%,_rgba(4,2,1,0.98)_85%)] pointer-events-none z-0" />

      {/* 1. Header Ribbon HUD */}
      <header className="relative z-30 flex items-center justify-between px-3.5 py-2 sm:px-6 sm:py-2.5 bg-[#120a06]/95 backdrop-blur-md border-b border-[#4d321d]/70 shadow-lg shrink-0 text-[#e8d5b5]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/labs')}
            aria-label="Return to Expeditions"
            className="w-8 h-8 rounded border border-[#6b4728] bg-[#22150e] flex items-center justify-center text-[#c99f58] hover:text-[#f3dfa2] active:scale-95 transition cursor-pointer shrink-0 shadow-sm"
          >
            <span className="text-xs font-mono font-bold">◀</span>
          </button>

          <div className="min-w-0">
            <span className="block text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-[0.25em] text-[#9c7846] font-mono truncate">
              JOURNAL // {labConfig.name}
            </span>
            <h1 className="text-xs sm:text-base font-bold text-[#f2dfbe] truncate font-['Cinzel',_serif] tracking-wider">
              {labConfig.title}
            </h1>
          </div>
        </div>

        {/* View Switcher & Relics */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex p-0.5 rounded bg-[#0d0704] border border-[#52351e]">
            <button
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded font-mono transition cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-gradient-to-b from-[#d4af37] to-[#8c6d23] text-[#120b06] shadow'
                  : 'text-[#8c6f4b] hover:text-[#c49b4d]'
              }`}
            >
              Journal
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded font-mono transition cursor-pointer ${
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
            <div className="w-5 h-5 rounded-full bg-[#241308] border border-[#8c6d23] flex items-center justify-center shadow-inner">
              <span className="text-[9px] text-[#ffd700]">✦</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Open Journal Workspace */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-2 sm:p-3 lg:p-4 overflow-hidden w-full max-w-7xl mx-auto">
        {viewMode === 'map' ? (
          <div className="relative w-full h-full flex flex-col lg:flex-row items-center justify-between max-w-[1040px] aspect-[1024/615] max-h-[86vh] rounded-xl border-4 border-[#241308] shadow-[0_25px_65px_rgba(0,0,0,0.98)] overflow-hidden">
            {/* Desktop Full Open Book Spread Background */}
            <div
              style={{ backgroundImage: `url('${labConfig.mapImage || '/assets/images/journal-spread-lab1.jpg'}')` }}
              className="hidden lg:block absolute inset-0 w-full h-full bg-[length:100%_100%] bg-center bg-no-repeat pointer-events-none z-0"
            />

            {/* ================= MAP SECTION (LEFT SPREAD) ================= */}
            <div className="relative w-full flex-1 min-h-0 lg:w-1/2 lg:h-full z-10 flex items-center justify-center overflow-hidden">
              <div
                ref={mapContainerRef}
                style={{
                  backgroundImage: `url('${labConfig.mapImage || '/assets/images/journal-spread-lab1.jpg'}')`,
                  backgroundSize: '200% 100%',
                  backgroundPosition: 'left center',
                  backgroundRepeat: 'no-repeat',
                }}
                className="relative h-full aspect-[8/9] max-w-full max-h-full rounded-xl lg:rounded-none border-2 sm:border-4 lg:border-none border-[#241308] shadow-[0_12px_36px_rgba(0,0,0,0.95)] lg:shadow-none overflow-hidden lg:bg-none"
              >
                {/* Luminous Inked Golden Route (Dynamic SVG based on exact detected node locations) */}
                {containerSize.width > 0 && containerSize.height > 0 && routePaths.plannedPath && (
                  <svg
                    viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  >
                    <defs>
                      <filter id="gold-ink-bleed" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <filter id="inkShadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6" />
                      </filter>
                    </defs>

                    {/* 1. Deep Iron-Gall / Thematic Ink Dashed Zig-Zag Path */}
                    <path
                      d={routePaths.plannedPath}
                      fill="none"
                      stroke={labConfig.inkColor || '#140803'}
                      strokeWidth="3.2"
                      strokeDasharray="6 6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.92}
                      filter="url(#inkShadow)"
                    />

                    {/* 2. Completed / Surveyed Illuminated Thematic Trail */}
                    {routePaths.completedPath && (
                      <>
                        <path
                          d={routePaths.completedPath}
                          fill="none"
                          stroke={labConfig.glowColor || '#ffd700'}
                          strokeWidth="5.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity={0.65}
                          filter="url(#gold-ink-bleed)"
                        />
                        <path
                          d={routePaths.completedPath}
                          fill="none"
                          stroke={labConfig.coreGlow || '#fff4cc'}
                          strokeWidth="2.4"
                          strokeDasharray="6 5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-all duration-700 ease-out"
                        />
                      </>
                    )}

                    {/* 4. Concentric Waypoint Rings centered on each measured node */}
                    {routePaths.points.map((pt) => {
                      const isDone = submittedIds.includes(pt.id);
                      return (
                        <g key={`anchor-${pt.id}`}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isDone ? 22 : 18}
                            fill="none"
                            stroke={isDone ? (labConfig.glowColor || '#ffd700') : '#8c6d23'}
                            strokeWidth={isDone ? '1.5' : '1'}
                            strokeDasharray={isDone ? 'none' : '3 3'}
                            opacity={isDone ? 0.95 : 0.45}
                          />
                          {isDone && (
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={26}
                              fill="none"
                              stroke={labConfig.coreGlow || '#f5e19f'}
                              strokeWidth="0.8"
                              strokeDasharray="2 4"
                              opacity={0.6}
                            />
                          )}
                        </g>
                      );
                    })}

                    {/* 5. Midpoint Nautical Rhumb Stars */}
                    {routePaths.plannedMidpoints.map((mid, idx) => (
                      <g key={`star-${idx}`} transform={`translate(${mid.x}, ${mid.y})`}>
                        {/* 4-point compass diamond */}
                        <path
                          d="M 0 -6 L 1.8 -1.8 L 6 0 L 1.8 1.8 L 0 6 L -1.8 1.8 L -6 0 L -1.8 -1.8 Z"
                          fill="#fff6d1"
                          stroke="#6b4516"
                          strokeWidth="0.8"
                          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))"
                        />
                      </g>
                    ))}
                  </svg>
                )}

                {/* Interactive Checkpoint Pins (Rich Cartographic Map Design) */}
                {products.map((product, idx) => {
                  const isSubmitted = submittedIds.includes(product.id);
                  const isCurrent = selectedProduct?.id === product.id;

                  const submittedPinStyle =
                    labConfig.themeType === 'jungle'
                      ? 'bg-gradient-to-b from-[#bbf7d0] via-[#22c55e] to-[#14532d] border-2 border-[#dcfce7] text-[#052e16] shadow-[0_0_14px_rgba(34,197,94,0.85)] ring-1 ring-[#22c55e]'
                      : labConfig.themeType === 'frost'
                        ? 'bg-gradient-to-b from-[#bae6fd] via-[#0284c7] to-[#0c4a6e] border-2 border-[#e0f2fe] text-[#082f49] shadow-[0_0_14px_rgba(56,189,248,0.85)] ring-1 ring-[#38bdf8]'
                        : labConfig.themeType === 'volcano'
                          ? 'bg-gradient-to-b from-[#fed7aa] via-[#ea580c] to-[#7c2d12] border-2 border-[#ffedd5] text-[#431407] shadow-[0_0_14px_rgba(249,115,22,0.85)] ring-1 ring-[#ea580c]'
                          : 'bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#854d0e] border-2 border-[#fffbeb] text-[#1c1917] shadow-[0_0_14px_rgba(234,179,8,0.8)] ring-1 ring-[#eab308]';

                  return (
                    <button
                      key={product.id}
                      ref={(el) => {
                        nodeRefs.current[product.id] = el;
                      }}
                      onClick={() => setSelectedProduct(product)}
                      style={{ left: `${product.x}%`, top: `${product.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 focus:outline-none touch-manipulation cursor-pointer group"
                    >
                      {/* Outer Rotating Celestial Ring on Selected Waypoint */}
                      {isCurrent && (
                        <span className="absolute -top-1 w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-dashed border-[#d4af37] animate-[spin_10s_linear_infinite] pointer-events-none" />
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
                          {isSubmitted ? '✦' : ['I', 'II', 'III', 'IV', 'V'][idx] || idx + 1}
                        </span>
                      </div>

                      {/* Needle Tip Pointing to Exact Coordinates */}
                      <div
                        className={`w-0 h-0 border-l-[4px] border-r-[4px] border-l-transparent border-r-transparent border-t-[5px] -mt-0.5 drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] ${
                          isSubmitted
                            ? labConfig.themeType === 'jungle'
                              ? 'border-t-[#22c55e]'
                              : labConfig.themeType === 'frost'
                                ? 'border-t-[#0284c7]'
                                : labConfig.themeType === 'volcano'
                                  ? 'border-t-[#ea580c]'
                                  : 'border-t-[#eab308]'
                            : isCurrent
                              ? 'border-t-[#d4af37]'
                              : 'border-t-[#8c6d23]'
                        }`}
                      />

                      {/* Small Waypoint Tag */}
                      <span className="mt-0.5 px-1 py-0.2 rounded bg-[#120a06]/95 border border-[#8c6d23]/40 text-[7.5px] sm:text-[8.5px] font-mono font-bold text-[#e8d5b5] shadow-xs pointer-events-none">
                        WP-0{idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ================= MOBILE ONLY: Dossier Scrap ================= */}
            <div className="lg:hidden w-full shrink-0 z-30 pointer-events-auto px-3 pb-2">
              <div
                style={{
                  backgroundImage: `url('/assets/images/expedition_status_bg.png')`,
                  aspectRatio: '520 / 310',
                }}
                className="relative w-full max-w-[460px] mx-auto bg-[length:100%_100%] bg-no-repeat bg-center drop-shadow-[0_14px_32px_rgba(0,0,0,0.95)] select-none"
              >
                {/* Antique Close Button */}
                <button
                  onClick={() => setViewMode('list')}
                  className="absolute top-[8%] right-[5.5%] w-7 h-7 rounded-full flex items-center justify-center focus:outline-none touch-manipulation cursor-pointer z-40 transition-all duration-150 active:scale-95 group shadow-[0_2px_5px_rgba(0,0,0,0.5)]"
                >
                  <div className="absolute inset-0 rounded-full bg-[#2F1F11] border-2 border-[#5c3e21] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8),_0_2px_4px_rgba(0,0,0,0.6)] group-hover:bg-[#432A18]" />
                  <span className="relative text-xs font-bold font-serif text-[#a17c4f] drop-shadow-[0_1px_0_rgba(0,0,0,0.3)]">
                    ✕
                  </span>
                </button>

                {/* Printable Parchment Area (Clean safe zone lifting button well above bottom leather edge) */}
                <div className="absolute inset-0 pt-[16%] pb-[13%] px-[10%] flex flex-col justify-between text-[#2b1704]">
                  {/* Badge Row */}
                  <div className="flex items-center justify-between border-b border-[#8b6943]/35 pb-1 pr-6">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CheckpointIcon index={selectedIndex >= 0 ? selectedIndex : 0} size={15} color="#7a5214" />
                      <span className="text-[9px] font-extrabold uppercase font-mono tracking-widest text-[#7a5214] truncate">
                        WAYPOINT 0{selectedIndex + 1} • SIC PARVIS MAGNA
                      </span>
                    </div>
                    <span
                      className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded shrink-0 shadow-xs ${
                        submittedIds.includes(selectedProduct.id)
                          ? 'bg-[#8b261d]/15 text-[#8b261d] border border-[#8b261d]/40'
                          : 'bg-[#7a5214]/10 text-[#7a5214] border border-[#7a5214]/30'
                      }`}
                    >
                      {submittedIds.includes(selectedProduct.id) ? 'LOGGED ✦' : 'PENDING'}
                    </span>
                  </div>

                  {/* Big Prominent Title & Handwritten Description */}
                  <div className="py-1 my-auto">
                    <h3 className="text-base sm:text-lg font-bold text-[#1c0f05] leading-tight font-['EB_Garamond',_serif] tracking-tight line-clamp-1 drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                      {selectedProduct.name}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-[#4a2810] italic leading-snug line-clamp-2 mt-1 font-[family-name:var(--font-handwriting)] font-semibold">
                      &quot;{selectedProduct.description}&quot;
                    </p>
                  </div>

                  {/* CTA Button Lifted Up Above Leather Bottom Rim */}
                  <div className="pt-1">
                    <button
                      onClick={() => setActiveModalProduct(selectedProduct)}
                      style={{
                        clipPath:
                          'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
                      }}
                      className="w-full py-2 sm:py-2.5 px-3 bg-gradient-to-b from-[#d4af37] via-[#b38920] to-[#7a5214] text-[#140802] font-black text-[10.5px] sm:text-xs uppercase tracking-widest shadow-md transition hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 font-['Cinzel',_serif] touch-manipulation cursor-pointer border-t border-[#fff3cc]/60"
                    >
                      <span>{submittedIds.includes(selectedProduct.id) ? 'Review Findings' : 'Inspect Checkpoint'}</span>
                      <span className="text-xs">➔</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Developer Quick Controls */}
              <div className="flex items-center justify-between max-w-[460px] mx-auto px-4 pt-1.5 pb-1">
                <button
                  type="button"
                  onClick={() => handleSimulateCompletion(selectedProduct.id)}
                  className="text-[8.5px] font-mono font-bold text-[#d4af37]/90 hover:text-[#d4af37] hover:underline cursor-pointer"
                >
                  [ SIMULATE: {submittedIds.includes(selectedProduct.id) ? 'UNMARK' : 'COMPLETE'} ]
                </button>
                <button
                  type="button"
                  onClick={handleResetProgress}
                  className="text-[8.5px] font-mono text-[#a88a58]/80 hover:text-[#a88a58] hover:underline cursor-pointer"
                >
                  [ RESET ALL ]
                </button>
              </div>
            </div>

            {/* ================= DESKTOP ONLY: Right Page Field Ledger ================= */}
            <div className="hidden lg:flex relative w-1/2 h-full z-10 pt-7 pb-6 pl-12 pr-8 sm:pt-8 sm:pb-7 sm:pl-14 sm:pr-10 flex-col justify-between overflow-y-auto">
              {/* Top Header Section */}
              <div className="flex items-start justify-between border-b-2 border-[#8b6943]/35 pb-2">
                <div>
                  <span className="block text-[9.5px] font-mono font-bold uppercase tracking-[0.25em] text-[#7a481c]">
                    EXPEDITION DOSSIER // {labConfig.name.toUpperCase()}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#241308] font-['EB_Garamond',_serif] tracking-tight leading-tight mt-0.5">
                    Field Reconnaissance & Log
                  </h2>
                </div>
                <span
                  className={`text-[9.5px] font-mono font-bold px-2.5 py-1 rounded border shadow-sm ${
                    submittedIds.includes(selectedProduct.id)
                      ? 'bg-[#8b261d]/15 text-[#8b261d] border-[#8b261d]/40 -rotate-2'
                      : 'bg-[#7a5214]/10 text-[#7a5214] border-[#7a5214]/30'
                  }`}
                >
                  {submittedIds.includes(selectedProduct.id) ? '✦ SURVEY CLEARED' : 'UNSURVEYED COORD'}
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
                        WAYPOINT 0{selectedIndex + 1} • LAT: {selectedProduct.y}°N · LNG: {selectedProduct.x}°W
                      </span>
                    </div>
                    <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-[#8c6f4b]">
                      SIC PARVIS MAGNA
                    </span>
                  </div>

                  {/* Waypoint Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-[#241308] font-['EB_Garamond',_serif] leading-tight">
                    {selectedProduct.name}
                  </h3>

                  {/* Field Notes Handwriting Quote */}
                  <div className="mt-2.5 pl-3 border-l-2 border-[#7a481c]/50">
                    <p className="text-sm text-[#3d200e] font-[family-name:var(--font-handwriting)] font-semibold italic leading-relaxed">
                      &quot;{selectedProduct.description}&quot;
                    </p>
                  </div>
                </div>

                {/* Celestial Coordinate Index (5 Waypoint Selector Buttons) */}
                <div className="mt-3 sm:mt-4">
                  <span className="block text-[9.5px] font-mono font-bold uppercase tracking-[0.2em] text-[#652B19] mb-1.5">
                    CELESTIAL COORDINATE INDEX
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {products.map((p, i) => {
                      const isDone = submittedIds.includes(p.id);
                      const isSel = selectedProduct.id === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedProduct(p)}
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

              {/* Action Button & Dev Bar */}
              <div className="pt-2 border-t border-[#8b6943]/25 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalProduct(selectedProduct)}
                  style={{
                    clipPath:
                      'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
                  }}
                  className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-b from-[#d4af37] via-[#b38920] to-[#7a5214] text-[#140802] font-bold text-xs uppercase tracking-widest shadow-md hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 font-['Cinzel',_serif] cursor-pointer border-t border-[#fff3cc]/50"
                >
                  <span>{submittedIds.includes(selectedProduct.id) ? 'Review Submitted Notes' : 'Seal & Record Observations'}</span>
                  <span className="text-xs">➔</span>
                </button>

                <div className="flex items-center justify-between px-1 text-[8.5px] font-mono">
                  <button
                    type="button"
                    onClick={() => handleSimulateCompletion(selectedProduct.id)}
                    className="font-bold text-[#7a481c] hover:text-[#241308] hover:underline cursor-pointer"
                  >
                    [ SIMULATE: {submittedIds.includes(selectedProduct.id) ? 'UNMARK' : 'COMPLETE NODE'} ]
                  </button>

                  <button
                    type="button"
                    onClick={handleResetProgress}
                    className="text-[#8c6f4b] hover:text-[#241308] hover:underline cursor-pointer"
                  >
                    [ CLEAR LOG ENTRIES ]
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* List Mode Overlay */
          <div className="w-full max-w-lg mx-auto flex flex-col gap-2.5 p-2 overflow-y-auto z-40">
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
                      {isDone ? '✦' : ['I', 'II', 'III', 'IV', 'V'][idx] || idx + 1}
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
            onSuccess={() => handleProductSubmitSuccess(activeModalProduct.id)}
          />
        )}
      </AnimatePresence>

      {/* Shareable Discovery Badge Modal */}
      <AnimatePresence>
        {showBadgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none font-serif">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#160e0a] border-2 border-[#c49b4d] rounded-xl p-6 shadow-[0_0_40px_rgba(212,175,55,0.4)] flex flex-col items-center text-center overflow-hidden text-[#e8d5b5]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.15)_0%,_transparent_70%)] pointer-events-none" />

              <span className="text-[10px] font-mono uppercase font-bold tracking-[0.3em] text-[#a88a58] mb-1">
                Chapter Completed
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#f5e6cc] font-['Cinzel',_serif] drop-shadow mb-3">
                {labConfig.title} Discovered!
              </h2>

              <div className="relative w-28 h-28 rounded-full bg-[#2a170d] border-2 border-[#d4af37] flex items-center justify-center my-2 shadow-inner">
                <div className="absolute inset-0 rounded-full bg-amber-400/10 animate-ping pointer-events-none" />
                <img
                  src="/assets/images/avery-pirate-coin.png"
                  alt="Discovery Medal"
                  className="w-16 h-16 object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.8)]"
                />
              </div>

              <p className="text-xs text-[#c5a880] italic leading-relaxed my-3 max-w-xs font-serif">
                &quot;All 5 celestial coordinates aligned and charted in the journal. Discovery Medal unlocked.&quot;
              </p>

              <div className="w-full flex flex-col gap-2.5 mt-2">
                <button
                  onClick={handleShareLinkedIn}
                  className="w-full py-2.5 px-4 bg-[#0a66c2] hover:bg-[#084e96] text-white font-mono font-bold text-xs uppercase tracking-wider rounded shadow active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Share on LinkedIn</span>
                  <span>↗</span>
                </button>

                <button
                  onClick={() => {
                    setShowBadgeModal(false);
                    router.push('/labs');
                  }}
                  style={{
                    clipPath:
                      'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-b from-[#d4af37] via-[#b38920] to-[#7a5214] text-[#1a0e05] font-mono font-bold text-xs uppercase tracking-widest shadow active:scale-[0.98] transition hover:brightness-110 cursor-pointer"
                >
                  Continue Expedition ➔
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}