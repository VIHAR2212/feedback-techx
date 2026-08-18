'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useScroll, useSpring, useTransform, motion, AnimatePresence } from 'framer-motion';
import PaperScrollBackground from './PaperScrollBackground';
import FramePlayer from './FramePlayer';

// Frame sequence configuration
const TOTAL_FRAMES = 30;
const FRAME_PREFIX = '/frames/frame_';
const FRAME_SUFFIX = '_delay-0.033s.jpg';

// Text Section Interface
interface TextSection {
  start: number;
  end: number;
  align: 'left' | 'center' | 'right';
  content: React.ReactNode;
}

// ============================================
// SECTION COMPONENTS (with parchment styling)
// ============================================

const HeroSection = () => (
  <div className="flex flex-col items-center justify-center text-center px-6 py-20">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="max-w-4xl"
    >
      {/* Compass Icon */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="text-7xl mb-8 drop-shadow-lg"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(139, 115, 85, 0.5))' }}
      >
        🧭
      </motion.div>
      
      <h1 
        className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
        style={{ 
          fontFamily: 'Cinzel, serif',
          color: '#3d2914',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        Uncharted
        <br />
        <span style={{ color: '#8b4513' }}>Expedition</span>
      </h1>
      
      <p 
        className="text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed"
        style={{ 
          fontFamily: 'Crimson Pro, serif',
          color: '#5c4033'
        }}
      >
        Embark on an epic journey through uncharted territories. 
        Your feedback shapes the future of discovery.
      </p>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="flex flex-col items-center gap-2"
        style={{ color: '#8b4513' }}
      >
        <span className="text-sm tracking-widest uppercase font-medium">Unroll Scroll to Begin</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M19 12l-7 7-7-7"/>
        </svg>
      </motion.div>
    </motion.div>
  </div>
);

const StorySection = () => (
  <div className="flex flex-col justify-center px-8 md:px-16 lg:px-24 py-16">
    <div className="max-w-xl">
      <motion.span
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-block text-sm tracking-widest uppercase mb-4 font-semibold"
        style={{ fontFamily: 'Cinzel, serif', color: '#8b4513' }}
      >
        The Legend Begins
      </motion.span>
      
      <h2 
        className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
        style={{ 
          fontFamily: 'Cinzel, serif',
          color: '#3d2914',
          textShadow: '1px 1px 2px rgba(0,0,0,0.05)'
        }}
      >
        Three Ancient{' '}
        <span style={{ color: '#8b4513' }}>Checkpoints</span>{' '}
        Await
      </h2>
      
      <p 
        className="leading-relaxed mb-6 text-lg"
        style={{ 
          fontFamily: 'Crimson Pro, serif',
          color: '#5c4033'
        }}
      >
        Deep within the digital wilderness lie three sacred laboratories—each holding 
        secrets waiting to be discovered. Only the bravest explorers dare to venture 
        through all three.
      </p>

      {/* Checkpoint Preview */}
      <div className="space-y-3">
        {[
          { name: 'Mountain Pass', icon: '🏔️', gradient: 'from-[#d4c4a8] to-[#c4a57b]' },
          { name: 'Lost Temple', icon: '🏛️', gradient: 'from-[#e8dcc8] to-[#d4b896]' },
          { name: 'Coastal Ruins', icon: '🏖️', gradient: 'from-[#c4b49a] to-[#b89b6a]' },
        ].map((checkpoint, i) => (
          <motion.div
            key={checkpoint.name}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className={`flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r ${checkpoint.gradient} shadow-md`}
            style={{
              border: '1px solid rgba(139, 69, 19, 0.2)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <span className="text-3xl">{checkpoint.icon}</span>
            <span className="font-semibold" style={{ color: '#3d2914', fontFamily: 'Cinzel, serif' }}>
              {checkpoint.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

const GemstoneSection = () => (
  <div className="flex flex-col items-end justify-center px-8 md:px-16 lg:px-24 py-16">
    <div className="max-w-xl text-right">
      <motion.span
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-block text-sm tracking-widest uppercase mb-4 font-semibold"
        style={{ fontFamily: 'Cinzel, serif', color: '#8b4513' }}
      >
        Rate With Precision
      </motion.span>
      
      <h2 
        className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
        style={{ 
          fontFamily: 'Cinzel, serif',
          color: '#3d2914',
          textShadow: '1px 1px 2px rgba(0,0,0,0.05)'
        }}
      >
        The{' '}
        <span style={{ color: '#8b4513' }}>Gemstone</span>{' '}
        System
      </h2>
      
      <p 
        className="leading-relaxed mb-8 text-lg"
        style={{ 
          fontFamily: 'Crimson Pro, serif',
          color: '#5c4033'
        }}
      >
        Each rating is a precious gem. From rough stones to flawless diamonds, 
        your feedback carries the weight of ancient wisdom.
      </p>

      {/* Gemstone Tiers */}
      <div className="flex justify-end gap-3 flex-wrap">
        {[
          { name: 'Rough Stone', emoji: '🪨', bg: 'linear-gradient(135deg, #78716c, #57534e)' },
          { name: 'Emerald', emoji: '💚', bg: 'linear-gradient(135deg, #059669, #047857)' },
          { name: 'Ruby', emoji: '❤️‍🔥', bg: 'linear-gradient(135deg, #dc2626, #b91c1c)' },
          { name: 'Sapphire', emoji: '💎', bg: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
          { name: 'Diamond', emoji: '✨', bg: 'linear-gradient(135deg, #e5e7eb, #d1d5db)' },
        ].map((gem, i) => (
          <motion.div
            key={gem.name}
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1, type: "spring" }}
            whileHover={{ scale: 1.15, rotate: 10 }}
            className="group relative"
          >
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-content shadow-lg cursor-pointer"
              style={{ 
                background: gem.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
              }}
            >
              <span className="text-xl">{gem.emoji}</span>
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              <span className="text-xs font-semibold" style={{ color: '#8b4513' }}>{gem.name}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

const RewardsSection = () => (
  <div className="flex flex-col justify-center px-8 md:px-16 lg:px-24 py-16">
    <div className="max-w-xl">
      <motion.span
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-block text-sm tracking-widest uppercase mb-4 font-semibold"
        style={{ fontFamily: 'Cinzel, serif', color: '#166534' }}
      >
        Treasures Await
      </motion.span>
      
      <h2 
        className="text-3xl md:text-4xl lg:text-5x font-bold mb-6"
        style={{ 
          fontFamily: 'Cinzel, serif',
          color: '#3d2914',
          textShadow: '1px 1px 2px rgba(0,0,0,0.05)'
        }}
      >
        Collect{' '}
        <span style={{ color: '#8b4513' }}>Certificate Shards</span>
      </h2>
      
      <p 
        className="leading-relaxed mb-8 text-lg"
        style={{ 
          fontFamily: 'Crimson Pro, serif',
          color: '#5c4033'
        }}
      >
        Complete each checkpoint to earn a piece of the ancient certificate. 
        Gather all three shards to unlock the final treasure—a testament to your journey.
      </p>

      {/* Shard Visualization */}
      <div className="flex gap-4">
        {[1, 2, 3].map((shard, i) => (
          <motion.div
            key={shard}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.2 }}
            className="relative"
          >
            <div className="w-20 h-28 relative drop-shadow-lg">
              {/* Shard Shape */}
              <svg viewBox="0 0 80 112" className="w-full h-full">
                <defs>
                  <linearGradient id={`shardGrad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d4a574" />
                    <stop offset="50%" stopColor="#c49464" />
                    <stop offset="100%" stopColor="#d4a574" />
                  </linearGradient>
                  <filter id={`shadow${i}`}>
                    <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3"/>
                  </filter>
                </defs>
                <path
                  d="M40 0 L70 25 L65 90 L40 112 L15 90 L10 25 Z"
                  fill={`url(#shardGrad${i})`}
                  stroke="#8b6914"
                  strokeWidth="2"
                  filter={`url(#shadow${i})`}
                />
                <text
                  x="40"
                  y="60"
                  textAnchor="middle"
                  fill="#3d2914"
                  fontSize="24"
                  fontWeight="bold"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  {['I', 'II', 'III'][i]}
                </text>
              </svg>
              
              {/* Glow Effect */}
              <div 
                className="absolute inset-0 blur-xl opacity-30 -z-10"
                style={{ background: '#d4a574' }}
              />
            </div>
            
            <p className="text-center mt-2 text-xs font-medium" style={{ color: '#5c4033' }}>
              {['Mountain', 'Temple', 'Coast'][i]} Shard
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

const FeaturesSection = () => (
  <div className="flex flex-col items-center justify-center text-center px-6 py-16">
    <div className="max-w-3xl">
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-block text-sm tracking-widest uppercase mb-4 font-semibold"
        style={{ fontFamily: 'Cinzel, serif', color: '#0369a1' }}
      >
        Why Join The Expedition
      </motion.span>
      
      <h2 
        className="text-3xl md:text-4xl lg:text-5xl font-bold mb-12"
        style={{ 
          fontFamily: 'Cinzel, serif',
          color: '#3d2914',
          textShadow: '1px 1px 2px rgba(0,0,0,0.05)'
        }}
      >
        More Than Just{' '}
        <span style={{ color: '#8b4513' }}>Feedback</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: '🗺️',
            title: 'Explore',
            desc: 'Navigate through carefully crafted experiences',
          },
          {
            icon: '⭐',
            title: 'Rate',
            desc: 'Share your thoughts with precision and care',
          },
          {
            icon: '🏆',
            title: 'Earn',
            desc: 'Collect rewards and climb the leaderboard',
          },
        ].map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            whileHover={{ y: -8 }}
            className="p-6 rounded-xl shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #f5e6d3, #e8dcc8)',
              border: '1px solid rgba(139, 69, 19, 0.2)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 16px rgba(0,0,0,0.1)'
            }}
          >
            <span className="text-4xl block mb-4">{feature.icon}</span>
            <h3 
              className="text-lg font-semibold mb-2"
              style={{ fontFamily: 'Cinzel, serif', color: '#3d2914' }}
            >
              {feature.title}
            </h3>
            <p 
              className="text-sm"
              style={{ fontFamily: 'Crimson Pro, serif', color: '#5c4033' }}
            >
              {feature.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

interface RegistrationFormProps {
  onStartExpedition: () => void;
}

const RegistrationForm = ({ onStartExpedition }: RegistrationFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate registration
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Store user data
    localStorage.setItem('expedition_user', JSON.stringify({
      ...formData,
      registeredAt: new Date().toISOString(),
      completedProducts: [],
      unlockedLabs: ['a'],
      shards: [],
    }));
    
    setIsSubmitting(false);
    onStartExpedition();
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <span 
            className="text-sm tracking-widest uppercase font-semibold"
            style={{ fontFamily: 'Cinzel, serif', color: '#8b4513' }}
          >
            Begin Your Journey
          </span>
          <h2 
            className="text-3xl md:text-4xl font-bold mt-4 mb-3"
            style={{ 
              fontFamily: 'Cinzel, serif',
              color: '#3d2914',
              textShadow: '1px 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            Register as{' '}
            <span style={{ color: '#8b4513' }}>Explorer</span>
          </h2>
          <p 
            className="text-base"
            style={{ fontFamily: 'Crimson Pro, serif', color: '#5c4033' }}
          >
            Enter your details to receive your expedition pass
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3d2914', fontFamily: 'Cinzel, serif' }}
            >
              Explorer Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
              style={{
                background: 'rgba(245, 230, 211, 0.8)',
                borderColor: '#c4a57b',
                color: '#3d2914',
                fontFamily: 'Crimson Pro, serif',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#8b4513';
                e.target.style.boxShadow = '0 0 0 3px rgba(139, 69, 19, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#c4a57b';
                e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
              }}
            />
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3d2914', fontFamily: 'Cinzel, serif' }}
            >
              Expedition Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
              style={{
                background: 'rgba(245, 230, 211, 0.8)',
                borderColor: '#c4a57b',
                color: '#3d2914',
                fontFamily: 'Crimson Pro, serif',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#8b4513';
                e.target.style.boxShadow = '0 0 0 3px rgba(139, 69, 19, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#c4a57b';
                e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
              }}
            />
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3d2914', fontFamily: 'Cinzel, serif' }}
            >
              Department
            </label>
            <select
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer"
              style={{
                background: 'rgba(245, 230, 211, 0.95)',
                borderColor: '#c4a57b',
                color: '#3d2914',
                fontFamily: 'Crimson Pro, serif',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#8b4513';
                e.target.style.boxShadow = '0 0 0 3px rgba(139, 69, 19, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#c4a57b';
                e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
              }}
            >
              <option value="">Select department</option>
              <option value="engineering">Engineering</option>
              <option value="design">Design</option>
              <option value="product">Product</option>
              <option value="marketing">Marketing</option>
              <option value="operations">Operations</option>
              <option value="other">Other</option>
            </select>
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 px-6 rounded-lg font-semibold text-lg shadow-lg disabled:opacity-70 transition-all relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #8b4513, #a0522d, #8b4513)',
              color: '#f5e6d3',
              fontFamily: 'Cinzel, serif',
              boxShadow: '0 4px 16px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block w-5 h-5 border-2 border-[#f5e6d3] border-t-transparent rounded-full"
                />
                Preparing Expedition...
              </span>
            ) : (
              <>
                Start Expedition 🗺️
                <div 
                  className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  style={{ transition: 'left 0.5s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.left = '100%'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.left = '-100%'; }}
                />
              </>
            )}
          </motion.button>
        </form>

        <p 
          className="text-center text-xs mt-6"
          style={{ color: '#8b7355', fontFamily: 'Crimson Pro, serif' }}
        >
          By registering, you join the league of elite explorers
        </p>
      </motion.div>
    </div>
  );
};

// ============================================
// MAIN SCROLLYTELLING COMPONENT WITH FRAMES
// ============================================

export default function ExpeditionScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<TextSection | null>(null);
  const [progressPct, setProgressPct] = useState(0);
  const [showForm, setShowForm] = useState(false);
  
  // Frame loading refs
  const framesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);

  // Framer Motion scroll tracking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth spring-based progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20,
    mass: 0.6,
  });

  // Text sections configuration
  const textSections: TextSection[] = [
    { start: 0, end: 0.15, align: 'center', content: <HeroSection /> },
    { start: 0.16, end: 0.32, align: 'left', content: <StorySection /> },
    { start: 0.33, end: 0.49, align: 'right', content: <GemstoneSection /> },
    { start: 0.50, end: 0.66, align: 'left', content: <RewardsSection /> },
    { start: 0.67, end: 0.83, align: 'center', content: <FeaturesSection /> },
    { start: 0.84, end: 1.0, align: 'center', content: <RegistrationForm onStartExpedition={() => setShowForm(true)} /> },
  ];

  // Track active section based on scroll
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      const section = textSections.find((s) => v >= s.start && v <= s.end) ?? null;
      setActiveSection(section);
      setProgressPct(Math.round(v * 100));
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  // Handle expedition start (redirect)
  useEffect(() => {
    if (showForm) {
      window.location.href = '/expedition';
    }
  }, [showForm]);

  // Load all frames
  useEffect(() => {
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    let count = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const num = String(i).padStart(3, '0');
      img.src = `${FRAME_PREFIX}${num}${FRAME_SUFFIX}`;

      img.onload = () => {
        count++;
        if (count === TOTAL_FRAMES) {
          setIsLoading(false);
        }
      };

      img.onerror = () => {
        console.warn(`Failed to load frame ${i}`);
        count++;
        if (count === TOTAL_FRAMES) {
          setIsLoading(false);
        }
      };

      images[i] = img;
    }

    framesRef.current = images;
  }, []);

  // Draw frame on canvas
  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = framesRef.current[index];
    if (!img || !img.complete) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Cover fit: scale image to fill canvas completely, centered
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;  // Center horizontally
    const dy = (ch - dh) / 2;  // Center vertically

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }, []);

  // Render frames based on scroll progress
  useEffect(() => {
    if (isLoading) return;

    // Draw initial frame
    drawFrame(0);

    // Subscribe to smooth scroll progress changes
    const unsub = smoothProgress.on('change', (v) => {
      const clamped = Math.max(0, Math.min(1, v));
      
      // Convert 0-1 progress to frame index (0-29)
      const idx = Math.min(Math.floor(clamped * TOTAL_FRAMES), TOTAL_FRAMES - 1);
      
      // Only redraw on frame change (optimization)
      if (idx !== currentFrameRef.current) {
        currentFrameRef.current = idx;
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(() => drawFrame(idx));
      }
    });

    return () => unsub();
  }, [isLoading, smoothProgress, drawFrame]);

  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      if (!isLoading && framesRef.current.length > 0) {
        drawFrame(currentFrameRef.current);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLoading, drawFrame]);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="loading-screen" style={{ background: '#1a1a1a' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="text-7xl mb-6"
          >
            🧭
          </motion.div>
          <h2 
            className="text-2xl font-bold mb-4"
            style={{ 
              fontFamily: 'Cinzel, serif',
              background: 'linear-gradient(135deg, #d97706, #f59e0b, #fbbf24)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Preparing Expedition Maps...
          </h2>
          <div className="w-48 h-1 bg-gray-700 rounded-full overflow-hidden mx-auto">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-golden via-saffron to-amber-light"
              style={{
                background: 'linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)'
              }}
            />
          </div>
          <p className="text-stone-500 mt-4 text-sm">Unfolding ancient scrolls...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ 
        height: '600vh', 
        background: '#1a1a1a'
      }}
    >
      {/* 🎬 PAPER SCROLL BACKGROUND - Vertical Unroll from Center */}
      <PaperScrollBackground />

      {/* Sticky Viewport with Parchment Background */}
      <div 
        className="sticky top-0 overflow-hidden" 
        style={{ 
          height: '100vh', 
          width: '100%',
          position: 'relative'
        }}
      >
        {/* 🖼️ FRAME PLAYER - 120 Frames Animation from ZIP */}
        <FramePlayer containerRef={containerRef} totalFrames={120} />

        {/* Canvas for Frame Animation (Background Layer) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit: 'cover',
          }}
        />

        {/* Parchment/Scroll Overlay with Vertical Opening Animation */}
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{
            clipPath: useTransform(
              smoothProgress,
              (v) => `polygon(0 ${Math.max(0, 50 - v * 55)}%, 100% ${Math.max(0, 50 - v * 55)}%, 100% ${Math.min(100, 50 + v * 55)}%, 0% ${Math.min(100, 50 + v * 55)}%)`
            )
          }}
        >
          {/* Parchment Texture Background */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(to right, #d4c4a8, #e8dcc8, #d4c4a8),
                url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.12'/%3E%3C/svg%3E")
              `,
              backgroundBlendMode: 'overlay',
            }}
          >
            {/* Aged paper texture */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' result='noise'/%3E%3CfeDiffuseLighting in='noise' lighting-color='%23f5e6c8' surfaceScale='2'%3E%3CfeDistantLight azimuth='45' elevation='60'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Torn edges effect */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <defs>
                <filter id="torn-edge-main">
                  <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" />
                </filter>
              </defs>
              <rect 
                x="0" y="0" width="100%" height="100%" 
                fill="none"
                stroke="#8b7355"
                strokeWidth="12"
                filter="url(#torn-edge-main)"
                opacity="0.5"
              />
            </svg>

            {/* Aging stains */}
            <div className="absolute top-[8%] left-[12%] w-36 h-36 rounded-full bg-[#c4a57b] opacity-8 blur-3xl" />
            <div className="absolute bottom-[18%] right-[18%] w-44 h-44 rounded-full bg-[#b89b6a] opacity-6 blur-3xl" />
            <div className="absolute top-[58%] left-[72%] w-28 h-28 rounded-full bg-[#d4bc94] opacity-8 blur-2xl" />
          </div>

          {/* Content Overlay */}
          <AnimatePresence mode="wait">
            {activeSection && (
              <motion.div
                key={activeSection.start}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
                className="relative z-20 h-full flex items-center"
              >
                {activeSection.content}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-30 h-1.5 bg-black/30">
          <motion.div
            className="h-full"
            style={{ 
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #8b4513, #d4a574, #c49464)'
            }}
            transition={{ duration: 0.15 }}
          />
        </div>

        {/* Progress Indicator */}
        <div 
          className="absolute bottom-4 right-4 z-30 flex items-center gap-2 text-sm font-mono"
          style={{ color: '#d4a574' }}
        >
          <span style={{ color: '#8b4513', fontWeight: 'bold' }}>{progressPct}</span>
          <span>% explored</span>
        </div>

        {/* Section Dots Navigation */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
          {textSections.map((section, i) => (
            <motion.button
              key={i}
              onClick={() => {
                const targetScroll = section.start * (containerRef.current?.offsetHeight || 0);
                window.scrollTo({ top: targetScroll, behavior: 'smooth' });
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                activeSection === section 
                  ? 'bg-[#8b4513] scale-125 shadow-lg' 
                  : 'bg-[#c4a57b]/50 hover:bg-[#d4b896]'
              }`}
              whileHover={{ scale: 1.5 }}
              aria-label={`Go to section ${i + 1}`}
              style={{
                boxShadow: activeSection === section ? '0 0 8px rgba(139, 69, 19, 0.5)' : 'none'
              }}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
