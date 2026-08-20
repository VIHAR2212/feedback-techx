'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchLeaderboard();
    fetchProductStats();
    const interval = setInterval(() => {
      fetchLeaderboard();
      fetchProductStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Ensure autoplay works across all browsers
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.warn('Admin leaderboard background video autoplay prevented:', err);
      });
    }
  }, [videoError]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/admin/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      const formatted = data.map((entry: any, index: number) => ({
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
    <AdminRouteGuard>
      <main className="relative min-h-screen w-full overflow-x-hidden px-2 sm:px-4 py-4 sm:py-8 text-foreground flex flex-col justify-start">
        {/* Fallback solid background in case video fails */}
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[#0d0704]" />

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
            className="pointer-events-none fixed inset-0 h-full w-full object-cover"
            style={{ zIndex: 0 }}
          >
            <source src="/videos/leaderboard-bg.mp4" type="video/mp4" />
          </video>
        )}

        {/* Subtle dark tint */}
        <div
          className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/60"
          style={{ zIndex: 1 }}
        />

        {/* Main Uncharted Signboard Content with Admin Controls */}
        <div className="relative z-10 w-full">
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
