'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckpointNode } from '@/lib/expeditionData';

export interface ObservationPayload {
  rating: number;
  comment: string;
}

interface ProductObservationModalProps {
  product: CheckpointNode;
  isSubmitted: boolean;
  onClose: () => void;
  onSuccess: (payload: ObservationPayload) => void;
}

export default function ProductObservationModal({
  product,
  isSubmitted,
  onClose,
  onSuccess,
}: ProductObservationModalProps) {
  const [rating, setRating] = useState<number>(isSubmitted ? 5 : 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the fake-submit timer if the modal unmounts mid-flight.
  useEffect(() => {
    return () => {
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    submitTimerRef.current = setTimeout(() => {
      setIsSubmitting(false);
      onSuccess({ rating, comment: feedback.trim() });
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm select-none font-serif">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 18 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 18 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{ backgroundImage: `url('/assets/images/review-card.webp')` }}
        className="relative w-full max-w-[480px] aspect-[4/5] bg-[length:100%_100%] bg-no-repeat bg-center drop-shadow-[0_25px_65px_rgba(0,0,0,0.98)] text-[#241308] flex flex-col justify-between overflow-hidden"
      >
        {/* Antique Brass & Leather Close Button (Inside Card Theme) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dossier"
          className="absolute top-[8%] right-[8%] w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center cursor-pointer z-30 transition-all duration-150 active:scale-90 group shadow-[0_3px_8px_rgba(0,0,0,0.7)]"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#3a2212] via-[#24140a] to-[#120a05] border-2 border-[#8c6d23] group-hover:border-[#d4af37] shadow-inner" />
          <span className="relative text-xs sm:text-sm font-serif font-black text-[#d4af37] group-hover:text-[#fff3cc] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            ✕
          </span>
        </button>

        {/* Printable Safe Parchment Content (Centered & Lowered for Balance) */}
        <div className="absolute inset-0 pt-[21%] pb-[14%] px-[12%] sm:px-[14%] flex flex-col justify-between overflow-hidden">
          {/* 1. Header (Centered, Prominent, Lowered into Open Parchment) */}
          <div className="flex flex-col items-center text-center border-b border-[#8b6943]/35 pb-1.5">
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.22em] text-[#7a481c] font-['Cinzel',_serif]">
                RECON DOSSIER // OBSERVATION
              </span>
              {isSubmitted && (
                <span className="rotate-[-2deg] border border-[#8b261d] px-1.5 py-0.2 rounded bg-[#8b261d]/15 text-[#8b261d] font-mono font-bold text-[8.5px] tracking-wider uppercase">
                  LOGGED ✓
                </span>
              )}
            </div>

            {/* Big Centered Checkpoint Title */}
            <h2 className="text-lg sm:text-2xl font-bold text-[#1c0f05] font-['EB_Garamond',_serif] tracking-tight leading-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
              {product.name}
            </h2>

            {/* Centered Handwritten Field Observation Quote */}
            <p className="text-xs sm:text-sm text-[#4a2810] font-[family-name:var(--font-handwriting)] font-semibold italic leading-tight mt-0.5 px-2 line-clamp-2">
              &quot;{product.description}&quot;
            </p>
          </div>

          {/* 2. Feedback Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 flex-1 justify-end pt-1">
            {/* Avery Pirate Coin Rating */}
            <div>
              <div className="flex items-center justify-between mb-1 px-0.5">
                <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-[#5c3e21] font-['Cinzel',_serif]">
                  Sector Reliability <span className="text-[#8b261d] font-black">*</span>
                </label>

                <span className="text-[10px] font-mono font-bold text-[#7a481c]">
                  {rating > 0 ? `${rating} / 5 Coins` : 'Select Rating'}
                </span>
              </div>

              {/* Recessed Leather Coin Well */}
              <div className="flex items-center justify-between px-2.5 py-1 rounded bg-[#241308]/10 border border-[#7a481c]/30 shadow-inner">
                {[1, 2, 3, 4, 5].map((coinIndex) => {
                  const filled = coinIndex <= (hoverRating || rating);
                  return (
                    <button
                      key={coinIndex}
                      type="button"
                      onClick={() => setRating(coinIndex)}
                      onMouseEnter={() => setHoverRating(coinIndex)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="group relative transition-transform duration-150 hover:scale-115 active:scale-95 focus:outline-none cursor-pointer p-0.5"
                    >
                      {filled && (
                        <span className="absolute inset-0 rounded-full bg-amber-400/30 blur-sm pointer-events-none" />
                      )}

                      <img
                        src="/assets/images/avery-pirate-coin.webp"
                        alt={`Rating Coin ${coinIndex}`}
                        className={`relative w-7 h-7 sm:w-8 sm:h-8 object-contain transition-all duration-150 ${
                          filled
                            ? 'opacity-100 drop-shadow-[0_2px_6px_rgba(212,175,55,0.75)] brightness-110 contrast-110 scale-105'
                            : 'opacity-30 grayscale brightness-50 contrast-90 group-hover:opacity-75 group-hover:grayscale-0'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Surveyor Observations Textarea */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-[#5c3e21] font-['Cinzel',_serif] mb-0.5 px-0.5">
                Surveyor Notes & Impressions
              </label>

              <textarea
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Inscribe telemetry findings or impressions..."
                className="w-full p-2 rounded bg-[#f7f0e3]/95 text-[#1f1006] placeholder-[#8c6f4b]/70 text-xs sm:text-sm font-[family-name:var(--font-handwriting)] font-semibold focus:outline-none focus:ring-1.5 focus:ring-[#7a481c] resize-none shadow-inner border border-[#7a481c]/40 leading-snug"
              />
            </div>

            {/* Action Plaque Button (Positioned Cleanly Inside Parchment Above Bottom Rim) */}
            <div className="pt-0.5">
              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                style={{
                  clipPath:
                    'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
                }}
                className={`w-full py-2 sm:py-2.5 px-4 font-black text-[10px] sm:text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 font-['Cinzel',_serif] shadow-md touch-manipulation cursor-pointer border-t border-[#fff3cc]/60 ${
                  rating > 0 && !isSubmitting
                    ? 'bg-gradient-to-b from-[#d4af37] via-[#b38920] to-[#7a5214] text-[#140802] hover:brightness-110 active:scale-[0.98]'
                    : 'bg-[#5c3e21]/40 text-[#241308]/40 cursor-not-allowed border-none'
                }`}
              >
                {isSubmitting ? (
                  <span>Inking Observations...</span>
                ) : (
                  <>
                    <span>{isSubmitted ? 'Update Checkpoint Notes' : 'Seal & Submit Observations'}</span>
                    <span>➔</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}