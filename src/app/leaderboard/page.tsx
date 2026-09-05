'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AdminRouteGuard from '@/components/uncharted/AdminRouteGuard';
import UnchartedSignboardLeaderboard, {
  LeaderboardEntry,
  ProductStatsEntry,
} from '@/components/uncharted/UnchartedSignboardLeaderboard';
import BackButton from '@/components/BackButton';
import { getNetworkTier, isSaveDataEnabled } from '@/lib/network-tier';

export default function PublicLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [productStats, setProductStats] = useState<ProductStatsEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoError, setVideoError] = useState(false);
  const [canPlayVideo, setCanPlayVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard?limit=50');
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
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard, fetchProductStats]);

  // Check network tier before mounting or playing background video
  useEffect(() => {
    const tier = getNetworkTier();
    const saveData = isSaveDataEnabled();
    if (tier !== 'slow' && !saveData) {
      setCanPlayVideo(true);
    }
  }, []);

  // Ensure autoplay works across all browsers & pause when tab is hidden
  useEffect(() => {
    if (!canPlayVideo) return;

    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.warn('Leaderboard background video autoplay prevented:', err);
      });
    }

    const handleVisibility = () => {
      if (!videoRef.current) return;
      if (document.visibilityState === 'hidden') {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [videoError, canPlayVideo]);

  return (
    <AdminRouteGuard>
      <main className="relative h-screen min-h-screen w-full overflow-hidden text-foreground flex flex-col justify-end items-center">
        <div className="fixed left-3 top-3 z-50">
          <BackButton to="/admin" label="Admin" />
        </div>

        {/* Fallback scenic image behind video */}
        <img
          src="/assets/images/leaderboard_scenic_bg.jpg"
          alt="Expedition Background"
          className="pointer-events-none fixed inset-0 h-full w-full object-cover z-0"
        />

        {/* Looping muted background video (only on moderate/fast connections) */}
        {canPlayVideo && !videoError && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster="/assets/images/leaderboard_scenic_bg.jpg"
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
        <div className="relative z-10 w-full h-full flex flex-col justify-end items-center pb-12 sm:pb-14">
          <UnchartedSignboardLeaderboard
            leaderboard={leaderboard}
            productStats={productStats}
            isLoading={isLoading}
            error={error}
            isAdmin={true}
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
