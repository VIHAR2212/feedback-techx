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
