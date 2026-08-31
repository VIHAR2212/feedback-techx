'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AdminRouteGuard from '@/components/uncharted/AdminRouteGuard';
import UnchartedSignboardLeaderboard, {
  LeaderboardEntry,
  ProductStatsEntry,
} from '@/components/uncharted/UnchartedSignboardLeaderboard';

export default function AdminLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [productStats, setProductStats] = useState<ProductStatsEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Declared before the effects below consume them (react-hooks/immutability).
  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      const formatted = data.map((entry: LeaderboardEntry & { completedProducts?: string[] }, index: number) => ({
        name: entry.name || '—',
        email: entry.email,
        department: entry.department,
        totalFeedback: entry.completedProducts?.length || entry.totalFeedback || 0,
        averageRating: entry.averageRating || 0,
        isCompleted: entry.isCompleted || false,
        shards: entry.shards || [],
        rank: index + 1,
      }));
      setLeaderboard(formatted);
      setError('');
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load rankings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProductStats = useCallback(async () => {
    try {
      const response = await fetch('/api/product-stats');
      if (!response.ok) throw new Error('Failed to fetch product stats');
      const data = await response.json();
      setProductStats(data);
    } catch (err) {
      console.error('Error fetching product stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    fetchProductStats();
    const interval = setInterval(() => {
      fetchLeaderboard();
      fetchProductStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard, fetchProductStats]);

  // Ensure video loads, autoplays, and unmutes upon user click/interaction
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = 0.85;

    // Start playback immediately
    const startPlay = async () => {
      try {
        video.muted = false;
        await video.play();
        setIsMuted(false);
      } catch (err) {
        console.warn('Initial unmuted play attempt blocked by browser policy:', err);
        video.muted = true;
        setIsMuted(true);
        video.play().catch(console.warn);
      }
    };
    startPlay();

    // Enable audio upon first click anywhere on screen
    const enableAudio = () => {
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = 0.85;
        videoRef.current.play().catch(console.warn);
        setIsMuted(false);
      }
      ['click', 'keydown', 'touchstart', 'pointerdown'].forEach((evt) =>
        window.removeEventListener(evt, enableAudio)
      );
    };

    ['click', 'keydown', 'touchstart', 'pointerdown'].forEach((evt) =>
      window.addEventListener(evt, enableAudio, { once: true, passive: true })
    );

    return () => {
      ['click', 'keydown', 'touchstart', 'pointerdown'].forEach((evt) =>
        window.removeEventListener(evt, enableAudio)
      );
    };
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      videoRef.current.volume = 0.85;
      if (!nextMuted) {
        videoRef.current.play().catch(console.warn);
      }
      setIsMuted(nextMuted);
    }
  };

  return (
    <AdminRouteGuard>
      <main className="relative h-screen min-h-screen w-full overflow-hidden bg-black text-foreground flex flex-col justify-center items-center">
        {/* Looping background video */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={false}
          playsInline
          preload="auto"
          className="pointer-events-none fixed inset-0 h-full w-full object-contain md:object-cover z-0"
        >
          <source src="/videos/leaderboard-background.mp4" type="video/mp4" />
        </video>

        {/* Main Uncharted Signboard Content Centered */}
        <div className="relative z-10 w-full h-full flex flex-col justify-center items-center p-0">
          <UnchartedSignboardLeaderboard
            leaderboard={leaderboard}
            productStats={productStats}
            isLoading={isLoading}
            error={error}
            isAdmin={true}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onRefresh={() => {
              fetchLeaderboard();
              fetchProductStats();
            }}
          />
        </div>
      </main>
    </AdminRouteGuard>
  );
}
