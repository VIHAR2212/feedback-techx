'use client';

import React, { useEffect, useRef } from 'react';
import { useAudio } from '@/context/AudioContext';

interface Point {
  x: number;
  y: number;
}

interface ActiveCoin {
  id: number;
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
  startTime: number;
  duration: number;
  targetX: number;
  targetY: number;
  hasHitTarget: boolean;
}

interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  life: number;
  decay: number;
}

// Cubic Bézier calculation: continuous subpixel positioning
function evalCubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

// Smooth flight easing: initial release pop -> natural acceleration -> smooth dock landing
function easeFlightProgress(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export default function FlyingCoinsOverlay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coinsRef = useRef<ActiveCoin[]>([]);
  const sparklesRef = useRef<SparkleParticle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const coinImgRef = useRef<HTMLImageElement | null>(null);
  const lastImpactTimeRef = useRef<number>(0);
  const { playCoinSound } = useAudio();

  const ensureCoinImage = () => {
    if (!coinImgRef.current && typeof window !== 'undefined') {
      const img = new window.Image();
      img.src = '/assets/images/avery-pirate-coin.webp';
      coinImgRef.current = img;
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  const renderFrame = (now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      animFrameIdRef.current = null;
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animFrameIdRef.current = null;
      return;
    }

    // Keep canvas dimension in sync with window & device pixel ratio
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    if (canvas.width !== winWidth * dpr || canvas.height !== winHeight * dpr) {
      canvas.width = winWidth * dpr;
      canvas.height = winHeight * dpr;
      canvas.style.width = `${winWidth}px`;
      canvas.style.height = `${winHeight}px`;
    }

    // Clear entire frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);

    const coinImg = coinImgRef.current;
    const isMobile = winWidth < 640;
    const coinSize = isMobile ? 36 : 40;
    const sparkleColors = ['#ffd700', '#fde047', '#fbbf24', '#ffffff', '#f59e0b'];

    // 1. Process and draw active coins
    const activeCoins = coinsRef.current;
    for (let i = activeCoins.length - 1; i >= 0; i--) {
      const coin = activeCoins[i];

      // Staggered delay check
      if (now < coin.startTime) {
        continue;
      }

      const elapsed = now - coin.startTime;
      const rawT = Math.min(1, elapsed / coin.duration);
      const easedT = easeFlightProgress(rawT);
      const pos = evalCubicBezier(coin.p0, coin.p1, coin.p2, coin.p3, easedT);

      // Natural scale profile: pop out -> glide -> absorb into coin slot
      let scale = 1.0;
      if (rawT < 0.14) {
        scale = 0.5 + 0.65 * (rawT / 0.14);
      } else if (rawT < 0.82) {
        scale = 1.15 - 0.2 * ((rawT - 0.14) / 0.68);
      } else {
        scale = 0.95 - 0.65 * ((rawT - 0.82) / 0.18);
      }

      // Fade profile: quick entry fade, smooth exit fade into the bottom bar marker
      let alpha = 1.0;
      if (rawT < 0.08) {
        alpha = rawT / 0.08;
      } else if (rawT > 0.9) {
        alpha = (1.0 - rawT) / 0.1;
      }

      // Smooth continuous spin (1.25 rotations across flight)
      const rotation = rawT * Math.PI * 2.5;

      // Draw the coin
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      if (coinImg && coinImg.complete && coinImg.naturalWidth > 0) {
        // Soft drop shadow without expensive DOM CSS filters
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 3;
        ctx.drawImage(coinImg, -coinSize / 2, -coinSize / 2, coinSize, coinSize);
      } else {
        // High-contrast gold backup disk if image loading is delayed
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, coinSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Trigger impact event and sparkles upon arriving at bottom dock marker
      if (!coin.hasHitTarget && rawT >= 0.95) {
        coin.hasHitTarget = true;

        // Spawn 8 lightweight golden sparkles directly on canvas
        for (let s = 0; s < 8; s++) {
          const angle = (s / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
          const speed = 1.6 + Math.random() * 2.2;
          sparklesRef.current.push({
            x: coin.targetX,
            y: coin.targetY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.7,
            color: sparkleColors[s % sparkleColors.length],
            radius: 1.6 + Math.random() * 1.4,
            life: 1.0,
            decay: 0.038,
          });
        }

        // Dispatch impact event to bottom dock (throttled to avoid layout thrashing)
        if (now - lastImpactTimeRef.current > 160) {
          lastImpactTimeRef.current = now;
          window.dispatchEvent(new Event('coinImpacted'));
        }
      }

      // Remove completed coin
      if (rawT >= 1.0) {
        activeCoins.splice(i, 1);
      }
    }

    // 2. Process and draw impact sparkles
    const sparkles = sparklesRef.current;
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const sp = sparkles[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vy += 0.06; // subtle gravity
      sp.life -= sp.decay;

      if (sp.life <= 0) {
        sparkles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, sp.life);
      ctx.fillStyle = sp.color;
      ctx.shadowColor = sp.color;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, Math.max(0.4, sp.radius * sp.life), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // 3. Keep rendering if items remain, otherwise pause loop for 0% CPU consumption
    if (activeCoins.length > 0 || sparkles.length > 0) {
      animFrameIdRef.current = requestAnimationFrame(renderFrame);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animFrameIdRef.current = null;
    }
  };

  const triggerCoinFlight = (e: Event) => {
    const custom = e as CustomEvent<{
      count?: number;
      startX?: number;
      startY?: number;
    }>;
    const count = Math.max(1, Math.min(5, custom.detail?.count ?? 4));

    // Ensure coin asset is loaded on demand
    ensureCoinImage();

    // Play coin sound
    playCoinSound();

    // 1. Exact start coordinates (rating coin tapped in modal)
    const startX =
      custom.detail?.startX ??
      (typeof window !== 'undefined' ? window.innerWidth / 2 : 200);
    const startY =
      custom.detail?.startY ??
      (typeof window !== 'undefined' ? window.innerHeight / 2 : 300);

    // 2. Exact destination (Avery pirate coin marker on bottom progress dock)
    let targetX = typeof window !== 'undefined' ? window.innerWidth / 2 : 200;
    let targetY = typeof window !== 'undefined' ? window.innerHeight - 36 : 600;

    const markerEl = document.getElementById('expedition-coin-marker');
    if (markerEl) {
      const rect = markerEl.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
    }

    // 3. Elegant outward parabolic Bézier trajectory
    const dx = targetX - startX;
    const dy = targetY - startY;

    // Bow outward dynamically based on screen quadrant
    const centerOffset = startX < (typeof window !== 'undefined' ? window.innerWidth / 2 : 200) ? -40 : 40;
    const arcSign = Math.abs(dx) > 30 ? (dx > 0 ? 1 : -1) : (centerOffset > 0 ? 1 : -1);
    const arcMagnitude = Math.min(65, Math.max(28, Math.abs(dx) * 0.35));

    const p0 = { x: startX, y: startY };
    const p1 = {
      x: startX + arcSign * arcMagnitude,
      y: startY - Math.min(65, Math.max(35, dy * 0.12)),
    };
    const p2 = {
      x: targetX + arcSign * (arcMagnitude * 0.4),
      y: startY + dy * 0.65,
    };
    const p3 = { x: targetX, y: targetY };

    const now = performance.now();
    const baseDuration = 640;
    const staggerDelay = 65;

    for (let i = 0; i < count; i++) {
      // Micro-jitter to prevent coin sprites from masking each other completely
      const jitterX = (i - (count - 1) / 2) * 3;
      const jitterY = (i - (count - 1) / 2) * 1.5;

      coinsRef.current.push({
        id: now + i + Math.random(),
        p0: { x: p0.x + jitterX, y: p0.y + jitterY },
        p1: { x: p1.x + jitterX, y: p1.y },
        p2: { x: p2.x + jitterX * 0.5, y: p2.y },
        p3,
        startTime: now + i * staggerDelay,
        duration: baseDuration,
        targetX,
        targetY,
        hasHitTarget: false,
      });
    }

    // Kick off animation loop if not currently active
    if (!animFrameIdRef.current) {
      animFrameIdRef.current = requestAnimationFrame(renderFrame);
    }
  };

  useEffect(() => {
    window.addEventListener('flyExpeditionCoins', triggerCoinFlight);
    return () => {
      window.removeEventListener('flyExpeditionCoins', triggerCoinFlight);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    />
  );
}



