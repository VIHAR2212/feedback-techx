'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { DEPARTMENT_OPTIONS } from '@/lib/mock-data';
import { getSubmittedFeedbackForUser } from '@/lib/expeditionData';
import { TechXLogoText, ProductShowcaseText } from '@/components/uncharted/TechXTypography';

const TOTAL_FRAMES = 120;
const FRAME_PREFIX = '/frames/frame_';
// WebP frames (downscaled by scripts/optimize-frames.mjs) are the primary
// source; the original JPGs stay on disk as an onerror fallback.
const FRAME_SUFFIX = '_delay-0.016s.webp';
const FRAME_FALLBACK_SUFFIX = '_delay-0.016s.jpg';
// Scroll distance the frame sequence plays out over, in viewport heights.
const SCROLL_HEIGHT_VH = 400;

function frameSrc(i: number, suffix: string = FRAME_SUFFIX) {
  // Internal frame index is 0-based (0..TOTAL_FRAMES-1); filenames on disk
  // are 1-based (frame_000.webp .. frame_119.webp).
  return `${FRAME_PREFIX}${String(i).padStart(3, '0')}${suffix}`;
}

export default function LandingReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const rafRef = useRef<number>(0);

  const [ready, setReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(1);
  const [showCard, setShowCard] = useState(false);
  const [loadingScreenGone, setLoadingScreenGone] = useState(false);

  const desktopVideoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);

  // Viewport-aware video playback & complete teardown upon ready
  useEffect(() => {
    if (ready) {
      if (desktopVideoRef.current) {
        desktopVideoRef.current.pause();
      }
      if (mobileVideoRef.current) {
        mobileVideoRef.current.pause();
      }
      const t = setTimeout(() => setLoadingScreenGone(true), 800);
      return () => clearTimeout(t);
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const targetVideo = isMobile ? mobileVideoRef.current : desktopVideoRef.current;
    if (targetVideo) {
      targetVideo.muted = true;
      targetVideo.defaultMuted = true;
      targetVideo.play().catch(() => {});
    }
  }, [ready]);

  const router = useRouter();
  const { user, login } = useUser();

  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [email, setEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [departmentError, setDepartmentError] = useState(false);
  const [emailError, setEmailError] = useState(false);

  useEffect(() => {
    if (user) {
      if (!name) setName(user.name);
      if (!department) setDepartment(user.department);
      if (!email) setEmail(user.email);
    }
  }, [user]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Fast, silky smooth spring interpolation tuned to eliminate mobile micro-jitter
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 34,
    mass: 0.1,
    restDelta: 0.001,
  });

  // Ratchet that resets when the user is back at the very top of the page.
  const maxProgress = useMotionValue(0);
  useEffect(() => {
    const unsub = smoothProgress.on('change', (v) => {
      if (v <= 0.01) {
        maxProgress.set(v);
      } else if (v > maxProgress.get()) {
        maxProgress.set(v);
      }
    });
    return () => unsub();
  }, [smoothProgress, maxProgress]);

  // Logo: fully visible at the top, fades out quickly as scrolling starts
  const logoOpacity = useTransform(maxProgress, [0, 0.08, 0.16], [1, 1, 0]);
  const logoScale = useTransform(maxProgress, [0, 0.16], [1, 0.88]);

  // Information blurbs + Product Showcase on tightened, fluid intervals
  const blurb1Opacity = useTransform(smoothProgress, [0.18, 0.25, 0.32, 0.38], [0, 1, 1, 0]);
  const blurb1Y = useTransform(smoothProgress, [0.18, 0.25], [20, 0]);

  const midOpacity = useTransform(smoothProgress, [0.40, 0.47, 0.53, 0.58], [0, 1, 1, 0]);
  const midY = useTransform(smoothProgress, [0.40, 0.47], [20, 0]);

  const blurb2Opacity = useTransform(smoothProgress, [0.60, 0.67, 0.73, 0.78], [0, 1, 1, 0]);
  const blurb2Y = useTransform(smoothProgress, [0.60, 0.67], [20, 0]);

  const blurb3Opacity = useTransform(smoothProgress, [0.80, 0.86, 0.90], [0, 1, 1]);
  const blurb3Y = useTransform(smoothProgress, [0.80, 0.86], [20, 0]);

  const cardOpacity = useTransform(smoothProgress, [0.90, 0.98], [0, 1]);
  const cardY = useTransform(smoothProgress, [0.90, 0.98], [30, 0]);
  const scrollHintOpacity = useTransform(smoothProgress, [0, 0.05], [1, 0]);

  // Low-network & low-tier device resilient preloader with 4s minimum HUD loading screen
  useEffect(() => {
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    let loadedCount = 0;
    let cursor = 0;
    let timerDone = false;
    let isTransitioning = false;

    // Detect network speed & hardware constraints
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
    const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
    const isSlowNetwork =
      conn?.saveData ||
      conn?.effectiveType === '2g' ||
      conn?.effectiveType === 'slow-2g' ||
      conn?.effectiveType === '3g';
    const isLowCoreDevice = typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 4) <= 4;

    // Adaptive concurrency: throttle down on slow networks / low cores to avoid freezing the main thread
    const PRELOAD_CONCURRENCY = isSlowNetwork || isLowCoreDevice ? 4 : 8;
    const TARGET_INITIAL_FRAMES = isSlowNetwork ? 5 : 15;

    const startTime = Date.now();
    const MIN_DURATION = 4000; // 4.0s minimum countdown

    const checkReady = () => {
      if (isTransitioning) return;
      // Ready if 4s timer elapsed AND at least initial frames are loaded (or fallback minimum 1 frame on slow network)
      const hasEnoughFrames = loadedCount >= TARGET_INITIAL_FRAMES || (timerDone && loadedCount >= 1);
      if (timerDone && hasEnoughFrames) {
        isTransitioning = true;
        setLoadProgress(100);
        setTimeout(() => setReady(true), 200);
      }
    };

    // Smooth HUD status ticker across 4 seconds starting immediately from > 0
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(Math.max(1, Math.floor((elapsed / MIN_DURATION) * 100)), 99);
      setLoadProgress((prev) => Math.max(prev, progress));

      if (elapsed >= MIN_DURATION) {
        clearInterval(interval);
        timerDone = true;
        checkReady();
      }
    }, 30);

    // Hard failsafe timer (5.5s): never leave low-network or low-end users stuck on loader
    const failsafe = setTimeout(() => {
      timerDone = true;
      if (!isTransitioning && loadedCount >= 1) {
        isTransitioning = true;
        setLoadProgress(100);
        setReady(true);
      }
    }, 5500);

    const resolve = () => {
      loadedCount++;
      checkReady();
      pump();
    };

    const loadImage = (i: number) => {
      const img = new window.Image();
      img.decoding = 'async';
      img.fetchPriority = i < TARGET_INITIAL_FRAMES ? 'high' : 'low';
      img.onload = () => {
        // Pre-decode into GPU memory in background so drawImage never blocks the main thread
        if ('decode' in img) {
          img.decode().then(() => resolve()).catch(() => resolve());
        } else {
          resolve();
        }
      };
      img.onerror = () => {
        if (img.src.endsWith(FRAME_SUFFIX)) {
          img.src = frameSrc(i, FRAME_FALLBACK_SUFFIX);
        } else {
          resolve();
        }
      };
      img.src = frameSrc(i);
      images[i] = img;
    };

    const pump = () => {
      while (cursor < TOTAL_FRAMES && cursor - loadedCount < PRELOAD_CONCURRENCY) {
        loadImage(cursor);
        cursor++;
      }
    };

    pump();
    framesRef.current = images;

    return () => {
      clearInterval(interval);
      clearTimeout(failsafe);
    };
  }, []);

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Find requested frame or closest loaded frame fallback to prevent blank flashes during fast scrub
    let img = framesRef.current[index];
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const prev = framesRef.current[index - offset];
        if (prev && prev.complete && prev.naturalWidth > 0) {
          img = prev;
          break;
        }
        const next = framesRef.current[index + offset];
        if (next && next.complete && next.naturalWidth > 0) {
          img = next;
          break;
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;

    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }, []);

  // Drive the canvas frame smoothly on scroll change (0% CPU when stationary)
  useEffect(() => {
    if (!ready) return;
    drawFrame(currentFrameRef.current);

    let rafId: number | null = null;
    let lastDrawn = currentFrameRef.current;

    const unsub = smoothProgress.on('change', (v) => {
      const clamped = Math.max(0, Math.min(1, v));
      const idx = Math.min(Math.floor(clamped * TOTAL_FRAMES), TOTAL_FRAMES - 1);

      if (idx !== lastDrawn) {
        lastDrawn = idx;
        currentFrameRef.current = idx;
        if (rafId === null) {
          rafId = requestAnimationFrame(() => {
            drawFrame(idx);
            rafId = null;
          });
        }
      }
    });

    return () => {
      unsub();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [ready, smoothProgress, drawFrame]);

  // Toggle whether the signup card can capture pointer input
  useEffect(() => {
    const unsub = smoothProgress.on('change', (v) => setShowCard(v > 0.88));
    return () => unsub();
  }, [smoothProgress]);

  // Canvas resize with DPR clamp & address-bar debounce to prevent black frame flashes on mobile
  useEffect(() => {
    let prevWidth = 0;
    let prevHeight = 0;

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const w = window.innerWidth;
      const h = window.innerHeight;

      // Ignore small vertical resizes caused by mobile address bar collapsing/expanding
      if (prevWidth === w && Math.abs(prevHeight - h) < 160) {
        return;
      }

      prevWidth = w;
      prevHeight = h;

      // Limit canvas resolution to max 1.5x DPR on high-density displays for silky mobile GPU performance
      const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.5);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      if (ready) drawFrame(currentFrameRef.current);
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [ready, drawFrame]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const emailValid = email.includes('@') && email.includes('.');
    const hasName = name.trim().length > 0;
    const hasDepartment = department.trim().length > 0;

    if (!hasName) setNameError(true);
    if (!hasDepartment) setDepartmentError(true);
    if (!email || !emailValid) setEmailError(true);

    if (!hasName || !hasDepartment || !email || !emailValid) return;

    setSubmitting(true);
    login({ name, department, email });
    const submitted = getSubmittedFeedbackForUser(email);
    const complete = submitted.length >= 25 || (typeof window !== 'undefined' && localStorage.getItem(`completion_${email}`) === 'true');
    setTimeout(() => {
      router.push(complete ? '/finish' : '/labs');
    }, 250);
  };

  return (
    <section ref={containerRef} className="relative bg-black" style={{ height: `${SCROLL_HEIGHT_VH}vh` }}>
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-black transform-gpu">
        {/* Frame sequence, scrubbed by scroll (hidden until ready to avoid any flash) */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 transform-gpu ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Fullscreen Responsive Video Loading Screen Overlay (completely unmounted after fade-out to free GPU/RAM) */}
        {!loadingScreenGone && (
          <div
            className={`fixed inset-0 z-50 bg-[#0a0705] flex items-center justify-center overflow-hidden transition-opacity duration-700 ${
              ready ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
          >
            {/* Animated Atmospheric Backdrop while video decodes */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/20 via-black to-black pointer-events-none" />

            {/* Desktop Video (> 768px) */}
            <video
              ref={desktopVideoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              disablePictureInPicture
              disableRemotePlayback
              className="hidden md:block absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            >
              <source src="/assets/images/loadingdesktop.mp4" type="video/mp4" />
            </video>

            {/* Mobile Video (<= 768px) */}
            <video
              ref={mobileVideoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              disablePictureInPicture
              disableRemotePlayback
              className="block md:hidden absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            >
              <source src="/assets/images/loadingmobile.mp4" type="video/mp4" />
            </video>

            {/* Ambient scanlines & vignette overlay for immediate cinematic feel */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.4)_51%)] bg-[length:100%_4px] pointer-events-none opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80 pointer-events-none" />

            {/* Tactical HUD Header / Status Loading Bar Overlay centered directly without outer box */}
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none select-none p-4">
              <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 font-mono text-[11px] sm:text-[13px] font-bold text-white tracking-widest drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                <span>LOADING FIELD DOSSIER // STATUS: {loadProgress}%</span>
                
                {/* Bracketed solid segment progress bar */}
                <div className="relative inline-flex items-center border border-white/90 px-0.5 py-[2px] w-32 sm:w-44 h-4 bg-black/50">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-amber-200 to-white transition-[width] duration-75 ease-linear shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Centered logo, visible at the very top of the page */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4"
          style={{ opacity: logoOpacity, scale: logoScale, willChange: 'transform, opacity', transform: 'translateZ(0)' }}
        >
          <TechXLogoText size="hero" animated={true} />
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center text-white/90 font-cinzel"
          style={{ opacity: scrollHintOpacity, willChange: 'opacity', transform: 'translateZ(0)' }}
        >
          <div className="flex flex-col items-center gap-2">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              Scroll to venture forth
            </p>
            <span className="inline-block h-4 w-px bg-gradient-to-b from-white to-transparent animate-pulse" />
          </div>
        </motion.div>

        {/* Info blurb 1 — introduces TechX */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-6 text-center"
          style={{ opacity: blurb1Opacity, y: blurb1Y, willChange: 'transform, opacity', transform: 'translateZ(0)' }}
        >
          <div
            className="relative w-full max-w-[540px] sm:max-w-[620px] bg-cover bg-center px-8 py-7 sm:px-14 sm:py-10 text-center drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)] select-none"
            style={{
              backgroundImage: "url('/textures/parchment-banner.webp')",
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <p className="text-[10px] sm:text-xs font-cinzel font-bold uppercase tracking-[0.3em] text-[#63320c] drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
              ✦ Welcome Explorer ✦
            </p>
            <h2
              style={{ fontFamily: "var(--font-base02), var(--font-uncharted), 'Base02', 'Base 02', serif" }}
              className="mt-1 font-uncharted text-xl sm:text-2xl md:text-3xl font-black text-[#1a0902] drop-shadow-[0_1px_0_rgba(255,255,255,0.5)] tracking-wide leading-tight"
            >
              Welcome to TechX
            </h2>
            <p className="mt-2 text-xs sm:text-sm md:text-base leading-relaxed text-[#381c0c] font-sans font-semibold drop-shadow-[0_1px_0_rgba(255,255,255,0.25)]">
              A hands-on showcase of student-built innovations spread across three expedition checkpoints. Explore, evaluate discoveries, and forge your expedition certificate.
            </p>
          </div>
        </motion.div>

        {/* Mid-scroll filler — Product Showcase typography, keeps the background
            from looking empty during the long stretch after the logo is
            gone and before the signup card appears. */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 text-center px-4"
          style={{ opacity: midOpacity, y: midY, willChange: 'transform, opacity', transform: 'translateZ(0)' }}
        >
          <ProductShowcaseText animated={true} />
        </motion.div>

        {/* Info blurb 2 — what to expect at the checkpoints */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-6 text-center"
          style={{ opacity: blurb2Opacity, y: blurb2Y, willChange: 'transform, opacity', transform: 'translateZ(0)' }}
        >
          <div
            className="relative w-full max-w-[540px] sm:max-w-[620px] bg-cover bg-center px-8 py-7 sm:px-14 sm:py-10 text-center drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)] select-none"
            style={{
              backgroundImage: "url('/textures/parchment-banner.webp')",
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <p className="text-[10px] sm:text-xs font-cinzel font-bold uppercase tracking-[0.3em] text-[#63320c] drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
              ✦ Three Checkpoints ✦
            </p>
            <h2
              style={{ fontFamily: "var(--font-base02), var(--font-uncharted), 'Base02', 'Base 02', serif" }}
              className="mt-1 font-uncharted text-xl sm:text-2xl md:text-3xl font-black text-[#1a0902] drop-shadow-[0_1px_0_rgba(255,255,255,0.5)] tracking-wide leading-tight"
            >
              Discover • Rate • Collect
            </h2>
            <p className="mt-2 text-xs sm:text-sm md:text-base leading-relaxed text-[#381c0c] font-sans font-semibold drop-shadow-[0_1px_0_rgba(255,255,255,0.25)]">
              Explore each lab checkpoint, bestow gemstone ratings, and unearth certificate shards along the path. Clues and hidden treasure caches await along the trail.
            </p>
          </div>
        </motion.div>

        {/* Info blurb 3 — call to action into the signup card */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-6 text-center"
          style={{ opacity: blurb3Opacity, y: blurb3Y, willChange: 'transform, opacity', transform: 'translateZ(0)' }}
        >
          <div
            className="relative w-full max-w-[540px] sm:max-w-[620px] bg-cover bg-center px-8 py-7 sm:px-14 sm:py-10 text-center drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)] select-none"
            style={{
              backgroundImage: "url('/textures/parchment-banner.webp')",
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <p className="text-[10px] sm:text-xs font-cinzel font-bold uppercase tracking-[0.3em] text-[#63320c] drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
              ✦ Are You Prepared? ✦
            </p>
            <h2
              style={{ fontFamily: "var(--font-base02), var(--font-uncharted), 'Base02', 'Base 02', serif" }}
              className="mt-1 font-uncharted text-xl sm:text-2xl md:text-3xl font-black text-[#1a0902] drop-shadow-[0_1px_0_rgba(255,255,255,0.5)] tracking-wide leading-tight"
            >
              Your Expedition Awaits
            </h2>
            <p className="mt-2 text-xs sm:text-sm md:text-base leading-relaxed text-[#381c0c] font-sans font-semibold drop-shadow-[0_1px_0_rgba(255,255,255,0.25)]">
              Scroll onward to claim your explorer credentials and enter the uncharted grounds.
            </p>
          </div>
        </motion.div>

        {/* Signup card, revealed at the end of the scroll sequence — stone
            tablet design, ported from the static prototype. */}
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 p-4 sm:p-6"
          style={{
            opacity: cardOpacity,
            y: cardY,
            pointerEvents: showCard ? 'auto' : 'none',
            willChange: 'transform, opacity',
            transform: 'translateZ(0)'
          }}
        >
          <AnimatePresence>
            {showCard && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-3xl select-none"
              >
                {/* Map + compass, pinned to the top-left corner of the tablet */}
                <div className="pointer-events-none absolute -left-8 top-12 z-20 hidden -rotate-6 flex-col items-start sm:-left-20 sm:top-24 sm:flex">
                  <Image
                    src="/tablet/map.webp"
                    alt=""
                    width={192}
                    height={192}
                    style={{ height: 'auto' }}
                    className="w-24 drop-shadow-[0_5px_10px_rgba(0,0,0,0.6)] sm:w-48"
                  />
                  <Image
                    src="/tablet/compass.webp"
                    alt=""
                    width={112}
                    height={112}
                    style={{ height: 'auto' }}
                    className="z-30 ml-4 mt-[-2rem] w-16 drop-shadow-xl sm:ml-8 sm:mt-[-4rem] sm:w-28"
                  />
                </div>

                {/* Photo + coins, pinned to the bottom-right corner */}
                <Image
                  src="/tablet/photo.webp"
                  alt=""
                  width={160}
                  height={160}
                  style={{ height: 'auto' }}
                  className="pointer-events-none absolute -right-6 bottom-10 z-20 hidden w-24 rotate-[15deg] drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)] sm:-right-4 sm:bottom-24 sm:block sm:w-40"
                />
                <Image
                  src="/tablet/coins.webp"
                  alt=""
                  width={128}
                  height={128}
                  style={{ height: 'auto' }}
                  className="pointer-events-none absolute bottom-4 right-2 z-30 hidden w-20 drop-shadow-md sm:bottom-10 sm:right-0 sm:block sm:w-32"
                />

                {/* Stone tablet card */}
                <div className="relative z-10 flex w-full flex-col items-center justify-start px-6 pb-12 pt-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] sm:px-16 sm:pb-16 sm:pt-16">
                  <Image
                    src="/tablet/stone-tablet.webp"
                    alt=""
                    fill
                    sizes="(max-width: 768px) 90vw, 700px"
                    className="-z-10 object-fill"
                    priority
                  />
                  <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center">
                    <Image
                      src="/tablet/techx-feedback-header.webp"
                      alt="Welcome to TechX Feedback"
                      width={900}
                      height={483}
                      priority
                      style={{ height: 'auto' }}
                      className="w-full max-w-[85%] drop-shadow-md sm:max-w-[90%] md:max-w-[95%] lg:max-w-full"
                    />
                    <p className="tablet-subtitle -mt-2 text-center text-base sm:mt-0 sm:text-xl">
                      Please enter your details to continue
                    </p>

                    <form
                      onSubmit={handleSubmit}
                      noValidate
                      className="-ml-2 mt-2 flex w-[85%] flex-col gap-3.5 sm:ml-0 sm:mt-8 sm:w-full sm:gap-6"
                    >
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name..."
                        required
                        className={`tablet-input h-12 w-full px-5 text-base font-bold sm:h-16 sm:px-7 sm:text-2xl ${
                          nameError ? 'error-shake' : ''
                        }`}
                        onAnimationEnd={() => setNameError(false)}
                      />

                      <div className="relative">
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          required
                          className={`tablet-input h-12 w-full appearance-none px-5 text-base font-bold sm:h-16 sm:px-7 sm:text-xl ${
                            departmentError ? 'error-shake' : ''
                          }`}
                          onAnimationEnd={() => setDepartmentError(false)}
                        >
                          <option value="" disabled hidden>
                            Select Department...
                          </option>
                          {DEPARTMENT_OPTIONS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email..."
                          required
                          className={`tablet-input h-12 w-full px-5 text-base font-bold sm:h-16 sm:px-7 sm:text-2xl ${
                            emailError ? 'error-shake' : ''
                          }`}
                          onAnimationEnd={() => setEmailError(false)}
                        />
                        {emailError && (
                          <p className="tablet-subtitle mt-2 ml-2 text-sm sm:text-lg">
                            Please include &apos;@&apos; and &apos;.&apos; in your email address.
                          </p>
                        )}
                      </div>

                      <div className="mt-2 flex w-full justify-center">
                        <button
                          type="submit"
                          disabled={submitting}
                          className={`relative h-14 w-48 bg-contain bg-center bg-no-repeat transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-75 sm:h-20 sm:w-64 flex items-center justify-center cursor-pointer ${
                            submitting ? 'brightness-125 animate-pulse' : ''
                          }`}
                          style={{ backgroundImage: "url('/tablet/portal-button.webp')" }}
                        >
                          <span className="sr-only">
                            {submitting ? 'Entering…' : 'Enter Portal'}
                          </span>
                          {submitting && (
                            <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/70 border border-amber-400/80 shadow-lg">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                              <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-300 uppercase tracking-widest">
                                Venturing...
                              </span>
                            </div>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
