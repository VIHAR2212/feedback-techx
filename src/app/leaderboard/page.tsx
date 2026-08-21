'use client';

import { useState, useEffect, useRef } from 'react';
import UnchartedSignboardLeaderboard, {
  LeaderboardEntry,
  ProductStatsEntry,
} from '@/components/uncharted/UnchartedSignboardLeaderboard';

export default function PublicLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [productStats, setProductStats] = useState<ProductStatsEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchLeaderboard();
    fetchProductStats();
    const interval = setInterval(() => {
      fetchLeaderboard();
      fetchProductStats();
    }, 45000);
    return () => clearInterval(interval);
  }, []);

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

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/admin/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      const publicData = data.map(
        (entry: LeaderboardEntry & { email?: string; completedProducts?: string[] }, index: number) => ({
          name: entry.name || '—',
          department: entry.department,
          totalFeedback: entry.completedProducts?.length || entry.totalFeedback || 0,
          averageRating: entry.averageRating || 0,
          isCompleted: entry.isCompleted || false,
          shards: entry.shards || [],
          rank: index + 1,
          email: entry.email,
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
  };

  const fetchProductStats = async () => {
    try {
      const response = await fetch('/api/admin/product-stats');
      if (!response.ok) throw new Error('Failed to fetch product stats');
      const data = await response.json();
      setProductStats(data);
    } catch (err) {
      console.error('Error fetching product stats:', err);
    }
  };

  return (
    <main className="relative h-screen min-h-screen w-full overflow-hidden text-foreground flex flex-col justify-end items-center">
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
            console.error('Failed to load /videos/leaderboard-bg.mp4');
            setVideoError(true);
          }}
          className="pointer-events-none fixed inset-0 h-full w-full object-cover z-0"
        >
          <source src="/videos/leaderboard-bg.mp4" type="video/mp4" />
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

