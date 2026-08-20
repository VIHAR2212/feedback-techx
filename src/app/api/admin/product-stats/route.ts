import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/mock-store';
import { LABS } from '@/lib/mock-data';
import type { Lab, Product } from '@/lib/models';

// GET /api/admin/product-stats — per-product rating distribution. Same
// shape as the original Minecraft endpoint so the admin leaderboard page
// works without changes.
export async function GET() {
  try {
    const allFeedback = mockStore.feedback.slice();

    // Build product lookup from static LABS.
    const productMap = new Map<string, { name: string; labName: string; labId: string }>();
    for (const lab of LABS) {
      for (const product of lab.products) {
        productMap.set(product.id, {
          name: product.name,
          labName: lab.labName,
          labId: lab.labId,
        });
      }
    }

    const productStats = new Map<
      string,
      {
        productId: string;
        productName: string;
        labName: string;
        totalRatings: number;
        averageRating: number;
        ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
        totalComments: number;
        lastRated: string | null;
      }
    >();

    for (const feedback of allFeedback) {
      const info = productMap.get(feedback.tableId);
      if (!info) continue;
      if (!productStats.has(feedback.tableId)) {
        productStats.set(feedback.tableId, {
          productId: feedback.tableId,
          productName: info.name,
          labName: info.labName,
          totalRatings: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          totalComments: 0,
          lastRated: null,
        });
      }
      const stats = productStats.get(feedback.tableId)!;
      stats.totalRatings++;
      const tier = Math.max(1, Math.min(5, feedback.rating)) as 1 | 2 | 3 | 4 | 5;
      stats.ratingDistribution[tier]++;
      if (feedback.comment && feedback.comment.trim() !== '') {
        stats.totalComments++;
      }
      const tsString = typeof feedback.timestamp === 'string' ? feedback.timestamp : feedback.timestamp instanceof Date ? feedback.timestamp.toISOString() : '';
      if (!stats.lastRated || new Date(feedback.timestamp) > new Date(stats.lastRated)) {
        stats.lastRated = tsString;
      }
    }

    const arr = Array.from(productStats.values()).map((s) => {
      const totalRatingSum = Object.entries(s.ratingDistribution).reduce(
        (sum, [r, c]) => sum + parseInt(r, 10) * c,
        0
      );
      s.averageRating = s.totalRatings > 0 ? totalRatingSum / s.totalRatings : 0;
      return s;
    });

    arr.sort((a, b) => {
      if (a.totalRatings !== b.totalRatings) return b.totalRatings - a.totalRatings;
      return b.averageRating - a.averageRating;
    });

    return NextResponse.json(arr);
  } catch (error) {
    console.error('Error fetching product stats:', error);
    return NextResponse.json({ error: 'Failed to fetch product statistics' }, { status: 500 });
  }
}

// Suppress "unused" warnings for type imports kept for parity with the
// original route file.
void (null as unknown as Lab);
void (null as unknown as Product);
