"use client";

import React, { useState } from 'react';
import { useAudio } from '@/context/AudioContext';
import { Volume2, VolumeX } from 'lucide-react';

export default function VolumeControl() {
  const { isMuted, volume, toggleMute, setVolume } = useAudio();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[#1a0e05]/50 border border-[#d4af37]/30 rounded-full p-2 backdrop-blur-sm transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out flex items-center ${
          isHovered ? 'w-24 opacity-100 ml-2' : 'w-0 opacity-0 ml-0'
        }`}
      >
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            const newVolume = parseFloat(e.target.value);
            setVolume(newVolume);
            if (newVolume === 0 && !isMuted) toggleMute();
            if (newVolume > 0 && isMuted) toggleMute();
          }}
          className="w-full accent-[#d4af37] h-1.5 bg-[#d4af37]/30 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      
      <button
        onClick={toggleMute}
        className="text-[#d4af37] hover:text-[#fde047] transition-colors focus:outline-none flex-shrink-0"
        aria-label={isMuted ? "Unmute sound" : "Mute sound"}
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-6 h-6" />
        ) : (
          <Volume2 className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}
