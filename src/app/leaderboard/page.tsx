'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import UnchartedSignboardLeaderboard, {
  LeaderboardEntry,
  ProductStatsEntry,
} from '@/components/uncharted/UnchartedSignboardLeaderboard';
import BackButton from '@/components/BackButton';

export default function PublicLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [productStats, setProductStats] = useState<ProductStatsEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      const publicData = data.map(
        (
          entry: LeaderboardEntry & { completedProductsCount?: number },
          index: number
        ) => ({
          name: entry.name || '—',
          department: entry.department,
          totalFeedback: entry.completedProductsCount || 0,
          averageRating: entry.averageRating || 0,
          isCompleted: entry.isCompleted || false,
          shards: entry.shards || [],
          rank: index + 1,
        })
      );
      setLeaderboard(publicData);
      setError('');
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load expedition rankings');
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
    }, 45000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard, fetchProductStats]);

  // Ensure autoplay works across all browsers
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.warn('Leaderboard background video autoplay prevented:', err);
      });
    }
  }, [videoError]);

  return (
    <main className="relative h-screen min-h-screen w-full overflow-hidden text-foreground flex flex-col justify-end items-center">
      <div className="fixed left-3 top-3 z-50">
        <BackButton to="/labs" label="Labs" />
      </div>

      {/* Fallback scenic image behind video */}
      <img
        src="/assets/images/leaderboard_scenic_bg.jpg"
        alt="Expedition Background"
        className="pointer-events-none fixed inset-0 h-full w-full object-cover z-0"
      />

      {/* Looping muted background video */}
      {!videoError && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={() => {
            console.error('Failed to load /videos/leaderboard-background.mp4');
            setVideoError(true);
          }}
          className="pointer-events-none fixed inset-0 h-full w-full object-cover z-0"
        >
          <source src="/videos/leaderboard-background.mp4" type="video/mp4" />
        </video>
      )}

      {/* Subtle overlay (warm cinematic tint) */}
      <div
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45 z-[1]"
      />

      {/* Main Uncharted Signboard Content Grounded at Bottom */}
      <div className="relative z-10 w-full h-full flex flex-col justify-end items-center pb-0">
        <UnchartedSignboardLeaderboard
          leaderboard={leaderboard}
          productStats={productStats}
          isLoading={isLoading}
          error={error}
          isAdmin={false}
          onRefresh={() => {
            fetchLeaderboard();
            fetchProductStats();
          }}
        />
      </div>
    </main>
  );
}
