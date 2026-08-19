'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
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

    const emailValid = email.includes('@') && email.includes('.');
    const hasName = name.trim().length > 0;
    const hasDepartment = department.trim().length > 0;

    if (!hasName) setNameError(true);
    if (!hasDepartment) setDepartmentError(true);
    if (!email || !emailValid) setEmailError(true);

    if (!hasName || !hasDepartment || !email || !emailValid) return;

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

        {/* Signup card, revealed at the end of the scroll sequence — stone
            tablet design, ported from the static prototype. */}
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
                className="relative w-full max-w-3xl select-none"
              >
                {/* Map + compass, pinned to the top-left corner of the tablet */}
                <div className="pointer-events-none absolute -left-8 top-12 z-20 hidden -rotate-6 flex-col items-start sm:-left-20 sm:top-24 sm:flex">
                  <Image src="/tablet/map.png" alt="" width={192} height={192} className="w-24 drop-shadow-[0_5px_10px_rgba(0,0,0,0.6)] sm:w-48" />
                  <Image
                    src="/tablet/compass.png"
                    alt=""
                    width={112}
                    height={112}
                    className="z-30 ml-4 mt-[-2rem] w-16 drop-shadow-xl sm:ml-8 sm:mt-[-4rem] sm:w-28"
                  />
                </div>

                {/* Photo + coins, pinned to the bottom-right corner */}
                <Image
                  src="/tablet/photo.png"
                  alt=""
                  width={160}
                  height={160}
                  className="pointer-events-none absolute -right-6 bottom-10 z-20 hidden w-24 rotate-[15deg] drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)] sm:-right-4 sm:bottom-24 sm:block sm:w-40"
                />
                <Image
                  src="/tablet/coins.png"
                  alt=""
                  width={128}
                  height={128}
                  className="pointer-events-none absolute bottom-4 right-2 z-30 hidden w-20 drop-shadow-md sm:bottom-10 sm:right-0 sm:block sm:w-32"
                />

                {/* Stone tablet card */}
                <div
                  className="relative z-10 flex w-full flex-col items-center justify-start bg-cover bg-center bg-no-repeat px-6 pb-12 pt-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] sm:px-16 sm:pb-16 sm:pt-16"
                  style={{ backgroundImage: "url('/tablet/stone-tablet.png')" }}
                >
                  <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center">
                    <Image
                      src="/tablet/techx-feedback-header.png"
                      alt="Welcome to TechX Feedback"
                      width={1400}
                      height={751}
                      priority
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
                          className="relative h-14 w-48 bg-contain bg-center bg-no-repeat transition-transform duration-300 hover:scale-105 active:scale-95 disabled:opacity-60 sm:h-20 sm:w-64"
                          style={{ backgroundImage: "url('/tablet/portal-button.png')" }}
                        >
                          <span className="sr-only">
                            {submitting ? 'Entering…' : 'Enter Portal'}
                          </span>
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
