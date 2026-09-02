'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

interface DenseTrainCoin {
  id: string;
  pts: { x: number; y: number }[];
  delayMs: number;
  durationMs: number;
}

interface Sparkle {
  id: string;
  x: number;
  y: number;
  color: string;
  angle: number;
  distance: number;
}

export default function FlyingCoinsOverlay() {
  const [activeCoins, setActiveCoins] = useState<DenseTrainCoin[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const spawnSparkles = useCallback((x: number, y: number) => {
    const colors = ['#ffd700', '#fde047', '#fbbf24', '#ffffff', '#eab308'];
    const newSparkles: Sparkle[] = Array.from({ length: 12 }).map((_, i) => ({
      id: `${Date.now()}-${i}-${Math.random()}`,
      x,
      y,
      color: colors[i % colors.length],
      angle: (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.2,
      distance: 24 + Math.random() * 26,
    }));

    setSparkles((prev) => [...prev, ...newSparkles]);

    const timer = setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => !newSparkles.includes(s)));
    }, 450);
    timersRef.current.push(timer);
  }, []);

  const triggerCoinFlight = useCallback(
    (e: Event) => {
      const custom = e as CustomEvent<{
        count?: number;
        startX?: number;
        startY?: number;
      }>;
      const count = Math.max(1, Math.min(5, custom.detail?.count ?? 4));

      // 1. Exact start point (Selected N-th rating coin in the rating bar)
      const startX =
        custom.detail?.startX ??
        (typeof window !== 'undefined' ? window.innerWidth / 2 : 200);
      const startY =
        custom.detail?.startY ??
        (typeof window !== 'undefined' ? window.innerHeight / 2 : 300);

      // 2. Exact destination (Avery Coin marker on bottom dock)
      let targetX = typeof window !== 'undefined' ? window.innerWidth / 2 : 200;
      let targetY = typeof window !== 'undefined' ? window.innerHeight - 36 : 600;

      const markerEl = document.getElementById('expedition-coin-marker');
      if (markerEl) {
        const rect = markerEl.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
      }

      // 3. High-Order Cubic Bezier Rail Curve
      const dx = targetX - startX;
      const dy = targetY - startY;
      const sideArc = dx >= 0 ? 45 : -45;

      const p0 = { x: startX, y: startY };
      const p1 = { x: startX + dx * 0.15 + sideArc, y: startY - 45 };
      const p2 = { x: startX + dx * 0.7 + sideArc * 0.5, y: startY + dy * 0.6 };
      const p3 = { x: targetX, y: targetY };

      // B(t) = (1-t)^3*P0 + 3(1-t)^2*t*P1 + 3(1-t)*t^2*P2 + t^3*P3
      const evalCubicBezier = (t: number) => {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;

        const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
        const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;
        return { x, y };
      };

      // 11-step mathematically continuous trajectory
      const steps = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
      const trajectoryPts = steps.map((t) => evalCubicBezier(t));

      const newCoins: DenseTrainCoin[] = [];
      const baseDuration = 680;
      const staggerDelay = 65; // Ultra-fluid train flow

      for (let i = 0; i < count; i++) {
        const delayMs = i * staggerDelay;

        newCoins.push({
          id: `dense-train-coin-${Date.now()}-${i}-${Math.random()}`,
          pts: trajectoryPts,
          delayMs,
          durationMs: baseDuration,
        });

        // Arrival impact at the bottom gauge
        const impactTimer = setTimeout(() => {
          window.dispatchEvent(new Event('coinImpacted'));
          spawnSparkles(targetX, targetY);
        }, delayMs + baseDuration - 25);
        timersRef.current.push(impactTimer);
      }

      setActiveCoins((prev) => [...prev, ...newCoins]);

      // Clean up after entire stream completes
      const cleanupTimer = setTimeout(() => {
        setActiveCoins((prev) =>
          prev.filter((c) => !newCoins.some((nc) => nc.id === c.id))
        );
      }, (count - 1) * staggerDelay + baseDuration + 200);
      timersRef.current.push(cleanupTimer);
    },
    [spawnSparkles]
  );

  useEffect(() => {
    window.addEventListener('flyExpeditionCoins', triggerCoinFlight);
    return () => {
      window.removeEventListener('flyExpeditionCoins', triggerCoinFlight);
      timersRef.current.forEach(clearTimeout);
    };
  }, [triggerCoinFlight]);

  if (activeCoins.length === 0 && sparkles.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      aria-hidden="true"
    >
      {/* 60FPS Pure Hardware-Accelerated Train Keyframes (No Mid-Air Glow Filters) */}
      <style jsx>{`
        @keyframes clean60FpsTrainFly {
          0% {
            transform: translate3d(var(--x0), var(--y0), 0) scale(0.3) rotate(0deg);
            opacity: 0;
          }
          6% {
            /* Clean Mechanical Pop & Distortion */
            transform: translate3d(var(--x0), var(--y0), 0) scale(1.35) rotate(-18deg) skewX(-12deg);
            opacity: 1;
          }
          12% {
            /* Snap into Train Track */
            transform: translate3d(var(--x1), var(--y1), 0) scale(1.12) rotate(10deg) skewX(5deg);
            opacity: 1;
          }
          20% {
            transform: translate3d(var(--x2), var(--y2), 0) scale(1.04) rotate(55deg) skewX(0deg);
            opacity: 1;
          }
          30% {
            transform: translate3d(var(--x3), var(--y3), 0) scale(1.0) rotate(120deg);
            opacity: 1;
          }
          40% {
            transform: translate3d(var(--x4), var(--y4), 0) scale(0.96) rotate(195deg);
            opacity: 1;
          }
          50% {
            transform: translate3d(var(--x5), var(--y5), 0) scale(0.92) rotate(275deg);
            opacity: 1;
          }
          60% {
            transform: translate3d(var(--x6), var(--y6), 0) scale(0.88) rotate(360deg);
            opacity: 1;
          }
          70% {
            transform: translate3d(var(--x7), var(--y7), 0) scale(0.84) rotate(450deg);
            opacity: 1;
          }
          80% {
            transform: translate3d(var(--x8), var(--y8), 0) scale(0.8) rotate(540deg);
            opacity: 1;
          }
          90% {
            transform: translate3d(var(--x9), var(--y9), 0) scale(0.74) rotate(630deg);
            opacity: 1;
          }
          97% {
            transform: translate3d(var(--x10), var(--y10), 0) scale(0.62) rotate(700deg);
            opacity: 1;
          }
          100% {
            /* Smooth Absorption into the bottom gauge coin */
            transform: translate3d(var(--x10), var(--y10), 0) scale(0) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes cleanSparkleBurst {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--dx), var(--dy), 0) scale(0);
            opacity: 0;
          }
        }

        .clean-train-coin {
          animation: clean60FpsTrainFly var(--duration) cubic-bezier(0.16, 1, 0.3, 1)
            var(--delay) forwards;
          will-change: transform, opacity;
          transform: translate3d(var(--x0), var(--y0), 0);
          backface-visibility: hidden;
        }

        .impact-sparkle-orb {
          animation: cleanSparkleBurst 0.45s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
          will-change: transform, opacity;
          backface-visibility: hidden;
        }
      `}</style>

      {/* Train of Transparent Circular Avery Pirate Coins (No Square Background Artifacts) */}
      {activeCoins.map((coin) => {
        const styleVars: Record<string, string> = {
          '--delay': `${coin.delayMs}ms`,
          '--duration': `${coin.durationMs}ms`,
        };
        coin.pts.forEach((pt, idx) => {
          styleVars[`--x${idx}`] = `${pt.x - 18}px`;
          styleVars[`--y${idx}`] = `${pt.y - 18}px`;
        });

        return (
          <div
            key={coin.id}
            className="absolute top-0 left-0 clean-train-coin pointer-events-none select-none"
            style={styleVars as React.CSSProperties}
          >
            {/* Pure Circular Pirate Coin with transparent background */}
            <img
              src="/assets/images/avery-pirate-coin.webp"
              alt="Flying Coin"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.85)] pointer-events-none select-none"
              draggable={false}
            />
          </div>
        );
      })}

      {/* Golden Sparkles triggered ONLY upon reaching bottom progress coin */}
      {sparkles.map((sp) => {
        const dx = Math.cos(sp.angle) * sp.distance;
        const dy = Math.sin(sp.angle) * sp.distance;
        return (
          <div
            key={sp.id}
            className="absolute top-0 left-0 impact-sparkle-orb"
            style={
              {
                left: `${sp.x}px`,
                top: `${sp.y}px`,
                '--dx': `${dx}px`,
                '--dy': `${dy}px`,
              } as React.CSSProperties
            }
          >
            <div
              style={{ backgroundColor: sp.color }}
              className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_#ffd700]"
            />
          </div>
        );
      })}
    </div>
  );
}


