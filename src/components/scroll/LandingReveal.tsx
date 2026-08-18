'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { DEPARTMENT_OPTIONS } from '@/lib/mock-data';
import { isExpeditionComplete } from '@/lib/expedition-storage';

const TOTAL_FRAMES = 120;
const FRAME_PREFIX = '/frames/frame_';
const FRAME_SUFFIX = '_delay-0.033s.jpg';
// Scroll distance the frame sequence plays out over, in viewport heights.
const SCROLL_HEIGHT_VH = 400;

function frameSrc(i: number) {
  return `${FRAME_PREFIX}${String(i).padStart(3, '0')}${FRAME_SUFFIX}`;
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

  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Logo: fully visible at the top, fades out as the frame sequence gets
  // going so it doesn't fight with the animation, and the signup card
  // shows only once scroll has effectively finished.
  const logoOpacity = useTransform(scrollYProgress, [0, 0.08, 0.18], [1, 1, 0]);
  const logoScale = useTransform(scrollYProgress, [0, 0.18], [1, 0.85]);
  const cardOpacity = useTransform(scrollYProgress, [0.92, 1], [0, 1]);
  const cardY = useTransform(scrollYProgress, [0.92, 1], [40, 0]);
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  // Redirect signed-in users straight past the reveal.
  useEffect(() => {
    if (!userLoading && user) {
      router.push(isExpeditionComplete(user.email) ? '/finish' : '/expedition');
    }
  }, [user, userLoading, router]);

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
          className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black text-white transition-opacity duration-500 ${
            loaded ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          <Image
            src="/branding/techx-logo.png"
            alt="TechX"
            width={260}
            height={150}
            priority
            className="opacity-90"
          />
          <div className="h-1 w-56 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-white/70 transition-[width] duration-150"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Loading {loadProgress}%</p>
        </div>

        {/* Centered logo, visible at the very top of the page */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          style={{ opacity: logoOpacity, scale: logoScale }}
        >
          <Image
            src="/branding/techx-logo.png"
            alt="TechX"
            width={520}
            height={300}
            priority
            className="w-[60vw] max-w-xl drop-shadow-2xl"
          />
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center text-white/70"
          style={{ opacity: scrollHintOpacity }}
        >
          <p className="text-xs uppercase tracking-[0.3em]">Scroll to begin</p>
        </motion.div>

        {/* Signup card, revealed at the end of the scroll sequence */}
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4"
          style={{
            opacity: cardOpacity,
            y: cardY,
            pointerEvents: showCard ? 'auto' : 'none',
          }}
        >
          <AnimatePresence>
            {showCard && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md rounded-md border-2 border-white/80 bg-black/90 p-6 text-white"
              >
                <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">
                  Uncharted Expedition
                </p>
                <h1 className="mt-1 text-center text-2xl font-semibold">Begin your expedition</h1>
                <p className="mt-2 text-center text-xs text-white/60">
                  Enter your details to receive your expedition credentials.
                </p>
                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-white/60">Name</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="rounded border border-white/30 bg-black/40 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                      placeholder="Explorer name"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-white/60">Department</span>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      className="rounded border border-white/30 bg-black/40 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                    >
                      <option value="" disabled className="text-black">
                        Select department
                      </option>
                      {DEPARTMENT_OPTIONS.map((d) => (
                        <option key={d} value={d} className="text-black">
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-white/60">Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="rounded border border-white/30 bg-black/40 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                      placeholder="you@expedition.org"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 rounded border-2 border-white bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? 'Preparing…' : 'Begin Expedition'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
