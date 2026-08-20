'use client';

import { motion } from 'framer-motion';
import ImageWithFallback from './ImageWithFallback';
import { ExpeditionLabConfig } from '@/lib/expeditionData';

interface CertificateFragmentModalProps {
  lab: ExpeditionLabConfig;
  onClose: () => void;
}

export default function CertificateFragmentModal({ lab, onClose }: CertificateFragmentModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-[#0A0806]/95 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 30 }}
        transition={{ type: 'spring', damping: 20 }}
        className="w-full max-w-[420px] p-6 sm:p-7 text-center bg-uc-navy/95 rounded-xl border border-uc-gold/60 shadow-[0_0_35px_rgba(212,175,55,0.4)]"
      >
        <div className="text-xs tracking-[3px] text-uc-gold font-mono font-bold uppercase">
          EXPEDITION SECTOR SURVEYED!
        </div>

        <h2 className="text-xl sm:text-2xl text-[#F4ECD8] my-2 mb-4 font-uncharted tracking-wide">
          {lab.title}
        </h2>

        {/* Fragment Seal Artwork */}
        <div className="relative w-[140px] sm:w-[160px] h-[140px] sm:h-[160px] mx-auto mb-4 rounded-full overflow-hidden border-2 border-uc-gold shadow-[0_0_20px_rgba(212,175,55,0.5)]">
          <ImageWithFallback
            src={lab.fragmentImage || '/assets/images/avery-pirate-coin.png'}
            alt={lab.fragmentName || lab.title}
            fallbackTitle={`SEAL ${lab.fragmentId || lab.id}`}
            fallbackIcon="SEAL"
            aspectRatio="1/1"
          />
        </div>

        <div className="text-base sm:text-lg text-uc-gold font-bold font-serif mb-1">
          {lab.fragmentName || lab.title}
        </div>

        <p className="text-xs sm:text-sm text-[#D8C3A5] mb-5 font-serif leading-relaxed">
          You have successfully surveyed all checkpoints in this sector and recovered an official certificate seal.
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 px-4 bg-gradient-to-b from-[#E6C265] via-[#C49219] to-[#8A6008] border border-[#4A3305] rounded-md text-[#231303] font-mono text-xs sm:text-sm font-extrabold uppercase tracking-wider cursor-pointer shadow-[0_3px_8px_rgba(0,0,0,0.4)] active:scale-[0.98] transition-transform touch-manipulation"
        >
          RETURN TO ROUTE MAP ➔
        </button>
      </motion.div>
    </motion.div>
  );
}
