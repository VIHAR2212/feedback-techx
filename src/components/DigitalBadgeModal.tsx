'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DigitalBadgeModalProps {
    sectorTitle: string;
    keyPieceNumber: number;
    keyPieceAsset: string;
    onClose: () => void;
}

export default function DigitalBadgeModal({
    sectorTitle,
    keyPieceNumber,
    keyPieceAsset,
    onClose,
}: DigitalBadgeModalProps) {
    const shareText = `I just surveyed all 5 tech checkpoints in ${sectorTitle} and recovered Magellan Key Fragment ${keyPieceNumber}/2! 🧭✨`;

    const handleShareLinkedIn = () => {
        window.open(
            `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`,
            '_blank'
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none font-['Georgia']">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md bg-[#160e0a] border-2 border-[#c49b4d] rounded-xl p-6 shadow-[0_0_40px_rgba(212,175,55,0.4)] flex flex-col items-center text-center overflow-hidden"
            >
                {/* Background Plaque Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.15)_0%,_transparent_70%)] pointer-events-none" />

                {/* Title */}
                <span className="text-[10px] font-mono uppercase font-bold tracking-[0.3em] text-[#a88a58] mb-1">
                    Sector Reconnaissance Complete
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#f5e6cc] drop-shadow mb-4">
                    Key Fragment {keyPieceNumber} of 2 Recovered
                </h2>

                {/* Key Fragment Showcase */}
                <div className="relative w-36 h-36 rounded-full bg-[#2a170d] border-2 border-[#d4af37] flex items-center justify-center my-2 shadow-inner">
                    <div className="absolute inset-0 rounded-full bg-amber-400/10 animate-ping pointer-events-none" />
                    <img
                        src={keyPieceAsset}
                        alt="Magellan Key Fragment"
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/assets/images/avery-pirate-coin.png';
                        }}
                        className="w-24 h-24 object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)]"
                    />
                </div>

                <p className="text-xs text-[#c5a880] italic leading-relaxed my-3 max-w-xs">
                    &quot;The first mechanism of the Magellan Cross Key has been aligned. Survey Sector 02 to retrieve the matching shaft.&quot;
                </p>

                {/* Action Buttons */}
                <div className="w-full flex flex-col gap-2.5 mt-2">
                    <button
                        onClick={handleShareLinkedIn}
                        className="w-full py-2.5 px-4 bg-[#0a66c2] hover:bg-[#084e96] text-white font-mono font-bold text-xs uppercase tracking-wider rounded shadow active:scale-[0.98] transition flex items-center justify-center gap-2"
                    >
                        <span>Share Badge on LinkedIn</span>
                        <span>↗</span>
                    </button>

                    <button
                        onClick={onClose}
                        style={{
                            clipPath: 'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
                        }}
                        className="w-full py-2.5 px-4 bg-gradient-to-b from-[#c5a059] via-[#9e7831] to-[#6a4e1d] text-[#1c120c] font-mono font-bold text-xs uppercase tracking-widest shadow active:scale-[0.98] transition hover:brightness-110"
                    >
                        Continue Expedition ➔
                    </button>
                </div>
            </motion.div>
        </div>
    );
}