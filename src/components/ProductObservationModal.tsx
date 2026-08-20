'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckpointNode } from '@/lib/expeditionData';

interface ProductObservationModalProps {
  product: CheckpointNode;
  isSubmitted: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ duration: 0.2 }}
        style={{ backgroundImage: `url('/assets/images/review-card.png')` }}
        className="relative w-full max-w-[470px] aspect-[4/5] bg-[length:100%_100%] bg-no-repeat bg-center drop-shadow-[0_25px_60px_rgba(0,0,0,0.98)] pt-28 sm:pt-32 pb-8 px-10 sm:px-14 text-[#241308] flex flex-col justify-between overflow-hidden"
      >
        {/* Brass Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dossier"
          className="absolute top-7 right-8 sm:top-8 sm:right-10 w-7 h-7 rounded-full border border-[#5c3e21]/50 bg-[#dfcaa7] hover:bg-[#d4af37] text-[#241308] flex items-center justify-center font-bold text-xs transition active:scale-95 cursor-pointer z-20 shadow-md"
        >
          ✕
        </button>

        {/* 1. Header (Inside Parchment Safe Zone) */}
        <div className="border-b border-[#5c3e21]/25 pb-2 mb-2 pr-6">
          <div className="flex items-center justify-between">
            <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-[#7a481c] font-['Cinzel',_serif]">
              Recon Dossier // Observation
            </span>
            {isSubmitted && (
              <span className="rotate-[-3deg] border border-[#7a1c14] px-1.5 py-0.5 rounded-sm bg-[#7a1c14]/10 text-[#7a1c14] font-mono font-bold text-[9px] tracking-wider uppercase">
                LOGGED ✓
              </span>
            )}
          </div>

          <h2 className="text-base sm:text-lg font-black text-[#241308] font-['EB_Garamond',_serif] tracking-tight leading-snug mt-0.5">
            {product.name}
          </h2>
        </div>

        {/* 2. Direct Field Notes */}
        <div className="mb-2 pl-3 border-l-2 border-[#7a481c]/50">
          <p className="text-xs sm:text-sm text-[#3d200e] font-[family-name:var(--font-handwriting)] font-semibold leading-relaxed">
            &quot;{product.description}&quot;
          </p>
        </div>

        {/* 3. Feedback Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 flex-1 justify-end">

          {/* Avery Pirate Coin Rating */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#5c3e21] font-['Cinzel',_serif]">
                Sector Reliability <span className="text-[#8B1A1A] font-black">*</span>
              </label>

              <span className="text-[10px] font-mono font-bold text-[#7a481c]">
                {rating > 0 ? `${rating} / 5 Coins` : 'Select'}
              </span>
            </div>

            {/* Recessed Leather Coin Well */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded bg-[#241308]/10 border border-[#7a481c]/25 shadow-inner">
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
                      <span className="absolute inset-0 rounded-full bg-amber-400/25 blur-sm pointer-events-none" />
                    )}

                    <img
                      src="/assets/images/avery-pirate-coin.png"
                      alt={`Rating Coin ${coinIndex}`}
                      className={`relative w-7 h-7 sm:w-8 sm:h-8 object-contain transition-all duration-150 ${filled
                          ? 'opacity-100 drop-shadow-[0_2px_6px_rgba(212,175,55,0.7)] brightness-110 contrast-110 scale-105'
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
            <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#5c3e21] font-['Cinzel',_serif] mb-1">
              Surveyor Notes & Impressions
            </label>

            <textarea
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Inscribe telemetry findings or impressions..."
              className="w-full p-2 rounded bg-[#f5ecdc]/90 text-[#241308] placeholder-[#7a5214]/60 text-sm font-[family-name:var(--font-handwriting)] font-semibold focus:outline-none focus:ring-1 focus:ring-[#7a481c] resize-none shadow-inner border border-[#7a481c]/35 leading-snug"
            />
          </div>

          {/* Action Plaque Button */}
          <button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            style={{
              clipPath: 'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
            }}
            className={`w-full py-2.5 px-4 font-bold text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 font-['Cinzel',_serif] shadow-md touch-manipulation cursor-pointer border-t border-[#f5e19f]/50 ${rating > 0 && !isSubmitting
                ? 'bg-gradient-to-b from-[#bfa15f] via-[#947432] to-[#634918] text-[#140802] hover:brightness-110 active:scale-[0.98]'
                : 'bg-[#5c3e21]/40 text-[#241308]/40 cursor-not-allowed'
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
        </form>
      </motion.div>
    </div>
  );
}