"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

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
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.6); // Default BGM volume increased
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const buttonSoundRef = useRef<HTMLAudioElement | null>(null);
  const coinSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    bgmRef.current = new Audio('/sounds/BGM_NEW.m4a');
    bgmRef.current.loop = true;
    bgmRef.current.volume = volume;

    buttonSoundRef.current = new Audio('/sounds/Button sound.m4a');
    coinSoundRef.current = new Audio('/sounds/coin rush.m4a');

    if (bgmRef.current) {
        bgmRef.current.preload = 'metadata'; // Load only metadata initially to save bandwidth/memory
    }
    if (buttonSoundRef.current) {
        buttonSoundRef.current.preload = 'auto'; // Keep smaller sounds auto
    }
    if (coinSoundRef.current) {
        coinSoundRef.current.preload = 'auto';
    }

    // Attempt to play BGM automatically (browsers may block this without user interaction)
    const playBgm = async () => {
      try {
        if (!isMuted && bgmRef.current) {
          await bgmRef.current.play();
        }
      } catch (err) {
        console.warn("Autoplay prevented. User interaction required to start background music.");
      }
    };
    
    playBgm();

    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, []); // Only run once on mount

  useEffect(() => {
    if (bgmRef.current) {
      if (isMuted) {
        bgmRef.current.pause();
      } else {
        bgmRef.current.play().catch(console.warn);
      }
    }
  }, [isMuted]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a')) {
        playButtonSound();
      }
      
      // Attempt to play BGM on first interaction if it was paused (e.g. autoplay blocked)
      if (bgmRef.current && bgmRef.current.paused && !isMuted) {
        bgmRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, [isMuted]);

  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = volume;
    }
  }, [volume]);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const playButtonSound = () => {
    if (buttonSoundRef.current) {
      buttonSoundRef.current.currentTime = 0;
      buttonSoundRef.current.play().catch(console.warn);
    }
  };

  const playCoinSound = () => {
    if (coinSoundRef.current) {
      coinSoundRef.current.currentTime = 0;
      coinSoundRef.current.play().catch(console.warn);
    }
  };

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
