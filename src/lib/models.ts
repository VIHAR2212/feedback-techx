// Uncharted Expedition — TypeScript domain models.
// Mirrors the Prisma schema so the mock services and any future real DB
// client share the same shape. Seniors can swap mock store -> Prisma client
// without touching components or pages.

export interface Product {
  id: string;
  name: string;
  icon: string;
}

export interface Lab {
  _id?: string;
  labId: string; // "a" | "b" | "c"
  labName: string;
  products: Product[];
}

// One of: "Rough Stone" | "Emerald" | "Ruby" | "Sapphire" | "Diamond"
export type GemstoneTier = 1 | 2 | 3 | 4 | 5;

export const GEMSTONE_TIERS: { tier: GemstoneTier; name: string; token: string }[] = [
  { tier: 1, name: 'Rough Stone', token: 'ROUGH_STONE' },
  { tier: 2, name: 'Emerald', token: 'EMERALD' },
  { tier: 3, name: 'Ruby', token: 'RUBY' },
  { tier: 4, name: 'Sapphire', token: 'SAPPHIRE' },
  { tier: 5, name: 'Diamond', token: 'DIAMOND' },
];

export interface FeedbackEntry {
  _id?: string;
  submissionId?: string;
  studentName: string;
  studentEmail: string;
  studentDepartment: string;
  rating: number;
  comment: string;
  tableId: string;
  labId?: string;
  timestamp: string | Date;
  createdAt?: Date;
}

export interface PaginatedFeedbackResult {
  items: FeedbackEntry[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface PublicLeaderboardEntry {
  name: string;
  department: string;
  completedProductsCount: number;
  shards: string[];
  completionDate: string | null;
  totalRating: number;
  averageRating: number;
  isCompleted: boolean;
}

export type LeaderboardEntry = ExpeditionUser & {
  totalRating: number;
  averageRating: number;
  isCompleted: boolean;
};

export interface DashboardData {
  stats: {
    totalUsers: number;
    totalFeedback: number;
    completedUsers: number;
    averageRating: number;
  };
  leaderboard: ExpeditionUser[];
  productStats: Array<{
    productId: string;
    productName: string;
    labName: string;
    totalRatings: number;
    averageRating: number;
    ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
    totalComments: number;
    lastRated: string | null;
  }>;
}

// What the user "is" inside the expedition. Persistence shape (localStorage)
// — server-side User is reconstructed from FeedbackEntry aggregations.
export interface ExpeditionUser {
  name: string;
  email: string;
  department: string;
  completedProducts: string[];
  unlockedLabs: string[];
  completedLabs: string[];
  shards: string[]; // lab IDs whose shard has been earned
  discoveredClues: string[];
  discoveredTreasures: string[];
  completionDate?: string;
  isCompleted?: boolean;

  // --- Denormalized leaderboard counters -------------------------------
  // Maintained on every feedback write so ranking never needs a $lookup
  // join against the feedback collection. See rankScore below.
  feedbackCount?: number;
  ratingSum?: number;
  completedCount?: number;
  rankScore?: number;
  updatedAt?: Date | string;
}

/**
 * Single sortable value encoding the full leaderboard ordering:
 *   1. finished explorers first
 *   2. then most products rated
 *   3. then highest average rating
 *
 * Packing it into one number lets the leaderboard be a plain indexed
 * `find().sort({ rankScore: -1 }).limit(n)` — an index scan of `n`
 * documents — instead of an aggregation over every user and every feedback
 * row. That is the difference between milliseconds and a timeout once the
 * event has 20k explorers.
 *
 *   completedCount <= ~100        -> occupies the 1e4 decade
 *   averageRating  in [0, 5] x100 -> occupies the units (0..500)
 *   isCompleted                   -> dominates everything at 1e9
 */
export function computeRankScore(input: {
  isCompleted: boolean;
  completedCount: number;
  averageRating: number;
}): number {
  const avg = Math.round(Math.max(0, Math.min(5, input.averageRating)) * 100);
  return (input.isCompleted ? 1_000_000_000 : 0) + input.completedCount * 10_000 + avg;
}

/** One document per product (~26 rows). Counters only, `$inc`-maintained. */
export interface ProductStatsDoc {
  _id: string; // productId / tableId
  labId?: string;
  totalRatings: number;
  ratingSum: number;
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  r5: number;
  totalComments: number;
  lastRated?: Date | string | null;
}

/**
 * Exactly one document (`_id: "global"`). Replaces the old stats
 * aggregation, which built a 20k-element `$addToSet` of every explorer
 * email on each call just to count distinct users.
 */
export interface EventStatsDoc {
  _id: string;
  totalFeedback: number;
  ratingSum: number;
  totalUsers?: number;
}

export interface Clue {
  id: string;
  title: string;
  body: string;
  // Optional tie-back to a lab so the UX can hint which expedition this clue is for.
  labId?: string;
}

export interface Treasure {
  id: string;
  name: string;
  description: string;
}

export interface CertificateShard {
  labId: string;
  labName: string;
  shardNumber: 1 | 2 | 3;
  earnedAt: string; // ISO timestamp
  // A short flavor line printed on the shard card.
  inscription: string;
}
