'use client';

// localStorage persistence helpers for the Uncharted expedition.
// All per-user progress (completed products, unlocked labs, shards, clues,
// treasures) is mirrored to localStorage so the client can hydrate
// instantly without waiting on the API. The server-side mock store in
// services.ts holds the same shape for admin/leaderboard queries.

import { LAB_ORDER, getLabById } from '@/lib/mock-data';
import type { ExpeditionUser } from '@/lib/models';

const PRODUCTS_KEY = (email: string) => `submittedFeedback_${email}`;
const UNLOCKED_KEY = (email: string) => `unlockedLabs_${email}`;
const COMPLETED_LABS_KEY = (email: string) => `completedLabs_${email}`;
const SHARDS_KEY = (email: string) => `shards_${email}`;
const CLUES_KEY = (email: string) => `discoveredClues_${email}`;
const TREASURES_KEY = (email: string) => `discoveredTreasures_${email}`;
const COMPLETION_KEY = (email: string) => `completion_${email}`;

function emptyExpedition(email: string): ExpeditionUser {
  return {
    name: '',
    email,
    department: '',
    completedProducts: [],
    unlockedLabs: ['a'], // Lab A always unlocked at start
    completedLabs: [],
    shards: [],
    discoveredClues: [],
    discoveredTreasures: [],
  };
}

export function loadExpeditionUser(email: string): ExpeditionUser {
  if (typeof window === 'undefined') return emptyExpedition(email);
  try {
    const completedProducts = JSON.parse(
      localStorage.getItem(PRODUCTS_KEY(email)) || '[]'
    ) as string[];
    const unlockedLabs = JSON.parse(
      localStorage.getItem(UNLOCKED_KEY(email)) || '["a"]'
    ) as string[];
    const completedLabs = JSON.parse(
      localStorage.getItem(COMPLETED_LABS_KEY(email)) || '[]'
    ) as string[];
    const shards = JSON.parse(
      localStorage.getItem(SHARDS_KEY(email)) || '[]'
    ) as string[];
    const discoveredClues = JSON.parse(
      localStorage.getItem(CLUES_KEY(email)) || '[]'
    ) as string[];
    const discoveredTreasures = JSON.parse(
      localStorage.getItem(TREASURES_KEY(email)) || '[]'
    ) as string[];
    const completionDate =
      localStorage.getItem(COMPLETION_KEY(email)) === 'true'
        ? new Date().toISOString()
        : undefined;

    return {
      name: '',
      email,
      department: '',
      completedProducts,
      unlockedLabs,
      completedLabs,
      shards,
      discoveredClues,
      discoveredTreasures,
      completionDate,
    };
  } catch {
    return emptyExpedition(email);
  }
}

export function saveCompletedProduct(email: string, productId: string) {
  const key = PRODUCTS_KEY(email);
  const arr = JSON.parse(localStorage.getItem(key) || '[]') as string[];
  if (!arr.includes(productId)) arr.push(productId);
  localStorage.setItem(key, JSON.stringify(arr));
  return arr;
}

// After a feedback submit, re-evaluate which labs are completed, which
// shards are earned, which lab is unlocked next, and whether the whole
// expedition is finished. Mirrors updateUserProgress() in services.ts.
export function recalculateProgress(email: string): {
  completedProducts: string[];
  unlockedLabs: string[];
  completedLabs: string[];
  shards: string[];
  isExpeditionComplete: boolean;
} {
  const completedProducts = JSON.parse(
    localStorage.getItem(PRODUCTS_KEY(email)) || '[]'
  ) as string[];

  const unlockedLabs = JSON.parse(
    localStorage.getItem(UNLOCKED_KEY(email)) || '["a"]'
  ) as string[];
  const completedLabs = JSON.parse(
    localStorage.getItem(COMPLETED_LABS_KEY(email)) || '[]'
  ) as string[];
  const shards = JSON.parse(
    localStorage.getItem(SHARDS_KEY(email)) || '[]'
  ) as string[];

  for (const labId of LAB_ORDER) {
    if (completedLabs.includes(labId)) continue;
    const lab = getLabById(labId);
    if (!lab) continue;
    const allDone = lab.products.every((p) => completedProducts.includes(p.id));
    if (allDone) {
      completedLabs.push(labId);
      if (!shards.includes(labId)) shards.push(labId);
      const idx = LAB_ORDER.indexOf(labId);
      if (idx + 1 < LAB_ORDER.length) {
        const next = LAB_ORDER[idx + 1];
        if (!unlockedLabs.includes(next)) unlockedLabs.push(next);
      }
    }
  }

  const isExpeditionComplete = shards.length >= LAB_ORDER.length;
  if (isExpeditionComplete) {
    localStorage.setItem(COMPLETION_KEY(email), 'true');
  }

  localStorage.setItem(UNLOCKED_KEY(email), JSON.stringify(unlockedLabs));
  localStorage.setItem(COMPLETED_LABS_KEY(email), JSON.stringify(completedLabs));
  localStorage.setItem(SHARDS_KEY(email), JSON.stringify(shards));
  return { completedProducts, unlockedLabs, completedLabs, shards, isExpeditionComplete };
}

export function appendClue(email: string, clueId: string) {
  const key = CLUES_KEY(email);
  const arr = JSON.parse(localStorage.getItem(key) || '[]') as string[];
  if (!arr.includes(clueId)) arr.push(clueId);
  localStorage.setItem(key, JSON.stringify(arr));
}

export function isLabCompleted(email: string, labId: string): boolean {
  const arr = JSON.parse(
    localStorage.getItem(COMPLETED_LABS_KEY(email)) || '[]'
  ) as string[];
  return arr.includes(labId);
}

export function isLabUnlocked(email: string, labId: string): boolean {
  const arr = JSON.parse(
    localStorage.getItem(UNLOCKED_KEY(email)) || '["a"]'
  ) as string[];
  return arr.includes(labId);
}

function getShardsCollected(email: string): string[] {
  return JSON.parse(
    localStorage.getItem(SHARDS_KEY(email)) || '[]'
  ) as string[];
}

export function isExpeditionComplete(email: string): boolean {
  const shards = getShardsCollected(email);
  return shards.length >= LAB_ORDER.length;
}
