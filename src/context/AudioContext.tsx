"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { getNetworkTier, isSaveDataEnabled } from '@/lib/network-tier';

type AudioContextType = {
  isMuted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  playButtonSound: () => void;
  playCoinSound: () => void;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  // Default muted if user has Save-Data enabled or is on a slow connection
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === 'undefined') return true;
    return isSaveDataEnabled() || getNetworkTier() === 'slow';
  });
  const [volume, setVolume] = useState(0.6);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const buttonSoundRef = useRef<HTMLAudioElement | null>(null);
  const coinSoundRef = useRef<HTMLAudioElement | null>(null);

  // Lazy getters to prevent network requests and audio decoding on mount
  const getBgm = useCallback(() => {
    if (!bgmRef.current && typeof window !== 'undefined') {
      const audio = new Audio('/sounds/BGM_NEW.m4a');
      audio.loop = true;
      audio.volume = volume;
      audio.preload = 'none';
      bgmRef.current = audio;
    }
    return bgmRef.current;
  }, [volume]);

  const getButtonSound = useCallback(() => {
    if (!buttonSoundRef.current && typeof window !== 'undefined') {
      const audio = new Audio('/sounds/Button sound.m4a');
      audio.preload = 'none';
      buttonSoundRef.current = audio;
    }
    return buttonSoundRef.current;
  }, []);

  const getCoinSound = useCallback(() => {
    if (!coinSoundRef.current && typeof window !== 'undefined') {
      const audio = new Audio('/sounds/coin rush.m4a');
      audio.preload = 'none';
      coinSoundRef.current = audio;
    }
    return coinSoundRef.current;
  }, []);

  useEffect(() => {
    if (bgmRef.current) {
      if (isMuted) {
        bgmRef.current.pause();
      } else {
        bgmRef.current.play().catch(() => {});
      }
    }
  }, [isMuted]);

  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
      if (buttonSoundRef.current) {
        buttonSoundRef.current = null;
      }
      if (coinSoundRef.current) {
        coinSoundRef.current = null;
      }
    };
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (!next) {
        // User explicitly unmuted: initialize BGM if needed and play
        const bgm = getBgm();
        if (bgm) {
          bgm.play().catch(() => {});
        }
      } else if (bgmRef.current) {
        bgmRef.current.pause();
      }
      return next;
    });
  }, [getBgm]);

  const playButtonSound = useCallback(() => {
    if (isMuted) return;
    const sound = getButtonSound();
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }, [isMuted, getButtonSound]);

  const playCoinSound = useCallback(() => {
    if (isMuted) return;
    const sound = getCoinSound();
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }, [isMuted, getCoinSound]);

  return (
    <AudioContext.Provider value={{ isMuted, volume, toggleMute, setVolume, playButtonSound, playCoinSound }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}

