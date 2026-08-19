'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useScroll, useTransform, useMotionValue, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { DEPARTMENT_OPTIONS } from '@/lib/mock-data';
import { isExpeditionComplete } from '@/lib/expedition-storage';
import { TechXLogoText, ProductShowcaseText } from '@/components/uncharted/TechXTypography';

const TOTAL_FRAMES = 120;
const FRAME_PREFIX = '/frames/frame_';
const FRAME_SUFFIX = '_delay-0.016s.jpg';
// Scroll distance the frame sequence plays out over, in viewport heights.
const SCROLL_HEIGHT_VH = 400;

function frameSrc(i: number) {
  // Internal frame index is 0-based (0..TOTAL_FRAMES-1); filenames on disk
  // are 1-based (ezgif-frame-001.jpg .. ezgif-frame-120.jpg).
  return `${FRAME_PREFIX}${String(i + 1).padStart(3, '0')}${FRAME_SUFFIX}`;
}

export default function LandingReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const rafRef = useRef<number>(0);

  const [loaded, setLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [showCard, setShowCard] = useState(false);

  const router = useRouter();
  const { user, login, isLoading: userLoading } = useUser();

  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [email, setEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);

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

  // Ratchet that resets when the user is back at the very top of the
  // page. Within a single scroll-down pass it only moves forward (so the
  // logo doesn't flicker back in if you nudge up slightly mid-scroll),
  // but scrolling all the way back up to the start brings it back.
  const maxProgress = useMotionValue(0);
  useEffect(() => {
    const unsub = scrollYProgress.on('change', (v) => {
      if (v <= 0.01) {
        maxProgress.set(v);
      } else if (v > maxProgress.get()) {
        maxProgress.set(v);
      }
    });
    return () => unsub();
  }, [scrollYProgress, maxProgress]);

  // Logo: fully visible at the top, fades out once and for all as the
  // frame sequence gets going.
  const logoOpacity = useTransform(maxProgress, [0, 0.08, 0.18], [1, 1, 0]);
  const logoScale = useTransform(maxProgress, [0, 0.18], [1, 0.85]);

  // Short info blurbs + the Product Showcase logo, spread across the long
  // middle stretch of the scroll so the frame background is never on its
  // own for hundreds of vh. Each one fades in, holds, then fades out
  // before the next takes over.
  const blurb1Opacity = useTransform(scrollYProgress, [0.2, 0.28, 0.34, 0.38], [0, 1, 1, 0]);
  const blurb1Y = useTransform(scrollYProgress, [0.2, 0.28], [24, 0]);

  const midOpacity = useTransform(scrollYProgress, [0.4, 0.48, 0.54, 0.58], [0, 1, 1, 0]);
  const midY = useTransform(scrollYProgress, [0.4, 0.48], [24, 0]);

  const blurb2Opacity = useTransform(scrollYProgress, [0.6, 0.68, 0.74, 0.78], [0, 1, 1, 0]);
  const blurb2Y = useTransform(scrollYProgress, [0.6, 0.68], [24, 0]);

  const blurb3Opacity = useTransform(scrollYProgress, [0.8, 0.86, 0.9], [0, 1, 1]);
  const blurb3Y = useTransform(scrollYProgress, [0.8, 0.86], [24, 0]);

  const cardOpacity = useTransform(scrollYProgress, [0.92, 1], [0, 1]);
  const cardY = useTransform(scrollYProgress, [0.92, 1], [40, 0]);
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  // Preload every frame.
  useEffect(() => {
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    let count = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new window.Image();
      img.src = frameSrc(i);
      img.onload = img.onerror = () => {
        count++;
        setLoadProgress(Math.round((count / TOTAL_FRAMES) * 100));
        if (count === TOTAL_FRAMES) setLoaded(true);
      };
      images[i] = img;
    }
    framesRef.current = images;
  }, []);

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const img = framesRef.current[index];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }, []);

  // Drive the canvas frame from scroll progress.
  useEffect(() => {
    if (!loaded) return;
    drawFrame(0);

    const unsub = scrollYProgress.on('change', (v) => {
      const clamped = Math.max(0, Math.min(1, v));
      const idx = Math.min(Math.floor(clamped * TOTAL_FRAMES), TOTAL_FRAMES - 1);
      if (idx !== currentFrameRef.current) {
        currentFrameRef.current = idx;
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => drawFrame(idx));
      }
    });

    return () => unsub();
  }, [loaded, scrollYProgress, drawFrame]);

  // Toggle whether the signup card can capture pointer input, once the
  // scroll has nearly bottomed out.
  useEffect(() => {
    const unsub = scrollYProgress.on('change', (v) => setShowCard(v > 0.9));
    return () => unsub();
  }, [scrollYProgress]);

  // Canvas resize.
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (loaded) drawFrame(currentFrameRef.current);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [loaded, drawFrame]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !department) {
      alert('Please fill in all details, including department.');
      return;
    }
    setSubmitting(true);
    login({ name, department, email });
    const complete = isExpeditionComplete(email);
    setTimeout(() => {
      router.push(complete ? '/finish' : '/expedition');
    }, 250);
  };

  return (
    <section ref={containerRef} className="relative bg-black" style={{ height: `${SCROLL_HEIGHT_VH}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Frame sequence, scrubbed by scroll */}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {/* Loading overlay — sits inside the same scroll container so the
            ref useScroll binds to is stable from the very first render. */}
        <div
          className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-black/95 text-white transition-opacity duration-500 ${
            loaded ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          {/* Rotating compass astrolabe background ring */}
          <div className="relative flex flex-col items-center justify-center">
            <div className="absolute -inset-10 rounded-full border border-dashed border-amber-500/20 compass-spin pointer-events-none" />
            <TechXLogoText size="sm" showSubtitle={false} showBadge={false} animated={false} />
          </div>

          <div className="h-1.5 w-64 overflow-hidden rounded-full bg-white/10 border border-amber-500/30 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 transition-[width] duration-150 shadow-[0_0_10px_#f59e0b]"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          <p className="text-xs font-cinzel uppercase tracking-[0.35em] text-amber-200/70">
            Charting Expedition… {loadProgress}%
          </p>
        </div>

        {/* Centered logo, visible at the very top of the page */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4"
          style={{ opacity: logoOpacity, scale: logoScale }}
        >
          <TechXLogoText size="hero" animated={true} />
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center text-amber-200/80 font-cinzel"
          style={{ opacity: scrollHintOpacity }}
        >
          <div className="flex flex-col items-center gap-2">
            <p className="text-[11px] uppercase tracking-[0.35em] drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
              Scroll to venture forth
            </p>
            <span className="inline-block h-4 w-px bg-gradient-to-b from-amber-400 to-transparent animate-pulse" />
          </div>
        </motion.div>

        {/* Info blurb 1 — introduces TechX */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 text-center"
          style={{ opacity: blurb1Opacity, y: blurb1Y }}
        >
          <div className="max-w-xl expedition-card-glass rounded-2xl p-6 sm:p-8 border border-amber-500/30">
            <p className="text-[11px] font-cinzel font-semibold uppercase tracking-[0.4em] text-[#dfcfb3]/70">
              ❖ Welcome Explorer ❖
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-uncharted font-bold text-[#dfcfb3] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Welcome to TechX
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-stone-300 font-sans">
              A hands-on showcase of student-built innovations spread across three expedition checkpoints. Explore, evaluate discoveries, and forge your expedition certificate.
            </p>
          </div>
        </motion.div>

        {/* Mid-scroll filler — Product Showcase typography, keeps the background
            from looking empty during the long stretch after the logo is
            gone and before the signup card appears. */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 text-center px-4"
          style={{ opacity: midOpacity, y: midY }}
        >
          <ProductShowcaseText animated={true} />
        </motion.div>

        {/* Info blurb 2 — what to expect at the checkpoints */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 text-center"
          style={{ opacity: blurb2Opacity, y: blurb2Y }}
        >
          <div className="max-w-xl expedition-card-glass rounded-2xl p-6 sm:p-8 border border-white/20">
            <p className="text-[11px] font-cinzel font-semibold uppercase tracking-[0.4em] text-[#dfcfb3]/70">
              ❖ Three Checkpoints ❖
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-uncharted font-bold text-[#dfcfb3] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Discover • Rate • Collect
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-stone-300 font-sans">
              Explore each lab checkpoint, bestow gemstone ratings, and unearth certificate shards along the path. Clues and hidden treasure caches await along the trail.
            </p>
          </div>
        </motion.div>

        {/* Info blurb 3 — call to action into the signup card */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 text-center"
          style={{ opacity: blurb3Opacity, y: blurb3Y }}
        >
          <div className="max-w-xl expedition-card-glass rounded-2xl p-6 sm:p-8 border border-white/20">
            <p className="text-[11px] font-cinzel font-semibold uppercase tracking-[0.4em] text-[#dfcfb3]/70">
              ❖ Are You Prepared? ❖
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-uncharted font-bold text-[#dfcfb3] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Your Expedition Awaits
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-stone-300 font-sans">
              Scroll onward to claim your explorer credentials and enter the uncharted grounds.
            </p>
          </div>
        </motion.div>

        {/* Signup card, revealed at the end of the scroll sequence */}
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 p-4 sm:p-6"
          style={{
            opacity: cardOpacity,
            y: cardY,
            pointerEvents: showCard ? 'auto' : 'none',
          }}
        >
          <AnimatePresence>
            {showCard && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-[520px] select-none"
                style={{
                  filter: 'drop-shadow(0 20px 35px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 40px rgba(217, 119, 6, 0.2))',
                }}
              >
                {/* Parchment background scroll container — natural transparent ragged edges */}
                <div
                  className="relative w-full bg-cover bg-center px-10 py-12 sm:px-14 sm:py-16"
                  style={{
                    backgroundImage: "url('/textures/parchment-scroll.png')",
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  {/* Scroll Top Seal / Badge */}
                  <div className="flex flex-col items-center text-center">
                    <p className="text-[10px] sm:text-xs font-cinzel font-bold uppercase tracking-[0.35em] text-[#78350f]">
                      ✦ Expedition Entry Scroll ✦
                    </p>
                    <h1 className="mt-2 font-uncharted text-2xl sm:text-3xl font-extrabold tracking-wide text-[#261608] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
                      Begin Your Expedition
                    </h1>
                    <p className="mt-1.5 font-marcellus text-xs sm:text-sm italic text-[#573c21]">
                      Inscribe your explorer credentials to enter the uncharted grounds.
                    </p>

                    {/* Decorative ink line */}
                    <div className="mt-3 flex items-center justify-center gap-2 w-full">
                      <span className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-[#8c6239]/60" />
                      <span className="text-[#8c6239] text-xs">❖</span>
                      <span className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-[#8c6239]/60" />
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3.5 sm:gap-4">
                    <label className="flex flex-col gap-1.5 text-xs font-cinzel font-bold text-[#451a03]">
                      <span className="tracking-wider flex items-center gap-1.5">
                        <span>Explorer Name</span>
                      </span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full rounded-md border-2 border-[#8c6239]/60 bg-[#fbf5e6]/85 px-3.5 py-2 sm:py-2.5 text-sm font-medium text-[#291508] shadow-[inset_0_2px_4px_rgba(69,26,3,0.15)] placeholder:text-[#9c7d5c] focus:border-[#5c3710] focus:bg-[#fffdf7] focus:outline-none focus:ring-2 focus:ring-[#d97706]/40 transition-all font-sans"
                        placeholder="e.g. Nathan Drake"
                      />
                    </label>

                    <label className="flex flex-col gap-1.5 text-xs font-cinzel font-bold text-[#451a03]">
                      <span className="tracking-wider flex items-center gap-1.5">
                        <span>Department Guild</span>
                      </span>
                      <div className="relative">
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          required
                          className="w-full appearance-none rounded-md border-2 border-[#8c6239]/60 bg-[#fbf5e6]/85 px-3.5 py-2 sm:py-2.5 text-sm font-medium text-[#291508] shadow-[inset_0_2px_4px_rgba(69,26,3,0.15)] focus:border-[#5c3710] focus:bg-[#fffdf7] focus:outline-none focus:ring-2 focus:ring-[#d97706]/40 transition-all font-sans cursor-pointer"
                        >
                          <option value="" disabled className="text-black bg-[#fbf5e6]">
                            Select department guild…
                          </option>
                          {DEPARTMENT_OPTIONS.map((d) => (
                            <option key={d} value={d} className="text-black bg-[#fbf5e6]">
                              {d}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#78350f]">
                          <span className="text-xs">▼</span>
                        </div>
                      </div>
                    </label>

                    <label className="flex flex-col gap-1.5 text-xs font-cinzel font-bold text-[#451a03]">
                      <span className="tracking-wider flex items-center gap-1.5">
                        <span>Expedition Email</span>
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full rounded-md border-2 border-[#8c6239]/60 bg-[#fbf5e6]/85 px-3.5 py-2 sm:py-2.5 text-sm font-medium text-[#291508] shadow-[inset_0_2px_4px_rgba(69,26,3,0.15)] placeholder:text-[#9c7d5c] focus:border-[#5c3710] focus:bg-[#fffdf7] focus:outline-none focus:ring-2 focus:ring-[#d97706]/40 transition-all font-sans"
                        placeholder="explorer@expedition.org"
                      />
                    </label>

                    {/* Old Style Embossed Gilded Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="group relative mt-3 flex items-center justify-center overflow-hidden rounded-lg border-2 border-[#fbbf24]/90 bg-gradient-to-b from-[#b45309] via-[#92400e] to-[#692906] px-6 py-3 sm:py-3.5 text-sm font-bold uppercase tracking-[0.25em] text-[#fffbeb] shadow-[0_6px_20px_rgba(120,53,15,0.5),inset_0_1px_1px_rgba(255,255,255,0.5),0_2px_0_#451a03] transition-all duration-300 hover:scale-[1.02] hover:border-amber-300 hover:shadow-[0_8px_25px_rgba(217,119,6,0.6)] active:scale-[0.99] disabled:opacity-60 font-uncharted cursor-pointer"
                    >
                      <span className="relative z-10 flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {submitting ? 'Inscribing Ledger…' : '❖ Begin Expedition ❖'}
                      </span>
                      {/* Animated metallic sheen shine */}
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
