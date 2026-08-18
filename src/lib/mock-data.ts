// Uncharted Expedition — mock static data.
// All seeds seniors will need on a real DB live here: labs, products,
// clue pool, treasure pool, certificate shard templates.

import { Lab, Clue, Treasure } from './models';

export const LABS: Lab[] = [
  {
    labId: 'a',
    labName: 'Checkpoint A — Mountain Pass',
    products: [
      { id: 'a1', name: 'Trueconnect.jio', icon: '📡' },
      { id: 'a2', name: 'Drone', icon: '🚁' },
      { id: 'a3', name: 'Samsung Ecosystem', icon: '📱' },
      { id: 'a4', name: 'IP Camera', icon: '📹' },
      { id: 'a5', name: '100 Billion Tech', icon: '💰' },
      { id: 'a6', name: 'VSCode', icon: '💻' },
      { id: 'a7', name: 'Temperature Calibrator', icon: '🌡️' },
    ],
  },
  {
    labId: 'b',
    labName: 'Checkpoint B — Lost Temple',
    products: [
      { id: 'b1', name: 'SimilaCure', icon: '💊' },
      { id: 'b2', name: 'Allotrak', icon: '📊' },
      { id: 'b3', name: 'Reliance Samarth', icon: '🛍️' },
      { id: 'b4', name: 'Video Door Phone', icon: '🚪' },
      { id: 'b5', name: 'Motherboard Setup Raw — 1', icon: '⚙️' },
      { id: 'b6', name: 'Dial Club', icon: '☎️' },
      { id: 'b7', name: 'The Hobby Tribe', icon: '🌐' },
      { id: 'b8', name: 'Copilot', icon: '🤖' },
      { id: 'b9', name: 'IOT Monitoring', icon: '📡' },
    ],
  },
  {
    labId: 'c',
    labName: 'Checkpoint C — Coastal Ruins',
    products: [
      { id: 'c1', name: 'DND Services', icon: '🚫' },
      { id: 'c2', name: 'Her Circle', icon: '♀️' },
      { id: 'c3', name: 'Optimyz', icon: '📈' },
      { id: 'c4', name: 'RDiscovery', icon: '🔬' },
      { id: 'c5', name: 'PaperPal', icon: '📝' },
      { id: 'c6', name: 'MDVR Camera Shivsahi', icon: '🚌' },
      { id: 'c7', name: 'Motherboard Setup Raw — 2', icon: '🛠️' },
      { id: 'c8', name: 'OSM', icon: '🗺️' },
      { id: 'c9', name: 'Apple Ecosystem', icon: '🍏' },
      { id: 'c10', name: 'EDQuest', icon: '🎓' },
    ],
  },
];

export const LAB_ORDER: string[] = LABS.map((l) => l.labId); // ["a","b","c"]

export function getLabById(labId: string): Lab | undefined {
  return LABS.find((l) => l.labId === labId);
}

export function getProductById(productId: string): { product: { id: string; name: string; icon: string }; lab: Lab } | undefined {
  for (const lab of LABS) {
    const product = lab.products.find((p) => p.id === productId);
    if (product) return { product, lab };
  }
  return undefined;
}

export function totalProductCount(): number {
  return LABS.reduce((sum, lab) => sum + lab.products.length, 0);
}

// --- Clue pool — shown randomly (or not at all) after a feedback submit ---
export const CLUE_POOL: Clue[] = [
  {
    id: 'clue-a-1',
    title: 'Cryptic Inscription',
    body: 'A weathered tablet mentions "the river that flows north" — perhaps a hint for the next checkpoint.',
    labId: 'a',
  },
  {
    id: 'clue-a-2',
    title: 'Torn Map Fragment',
    body: 'A torn piece of parchment shows a path leading east of the temple gate.',
    labId: 'a',
  },
  {
    id: 'clue-b-1',
    title: 'Old Journal Page',
    body: 'Someone scribbled "the third torch from the left is a decoy" — could be useful later.',
    labId: 'b',
  },
  {
    id: 'clue-b-2',
    title: 'Strange Compass Reading',
    body: 'The compass needle wobbles here — something metallic is buried nearby.',
    labId: 'b',
  },
  {
    id: 'clue-c-1',
    title: 'Half-Eaten Logbook',
    body: '"High tide at dawn exposes the lower passage" — underlined twice.',
    labId: 'c',
  },
  {
    id: 'clue-c-2',
    title: 'Carved Symbol',
    body: 'A spiral with three dots appears on the cliff face — the same mark is on the final chest.',
    labId: 'c',
  },
];

// --- Treasure pool — optional mini-game reward, never blocks progression ---
export const TREASURE_POOL: Treasure[] = [
  { id: 'tr-coin', name: 'Ancient Coin', description: 'A worn bronze coin from a forgotten kingdom.' },
  { id: 'tr-relic', name: 'Bone Relic', description: 'A small carved figure, perhaps a good-luck charm.' },
  { id: 'tr-map', name: 'Folded Sketch', description: 'A rough sketch of a place you do not recognise yet.' },
  { id: 'tr-blank', name: 'Empty Cache', description: 'Nothing here but dust. Better luck next time.' },
];

// --- Certificate shard templates (1 per lab) ---
export const SHARD_INSCRIPTIONS: Record<string, string> = {
  a: 'Awarded for clearing the Mountain Pass — first leg of the expedition.',
  b: 'Awarded for surviving the Lost Temple — second leg of the expedition.',
  c: 'Awarded for charting the Coastal Ruins — final leg of the expedition.',
};

export function getShardInscription(labId: string): string {
  return SHARD_INSCRIPTIONS[labId] ?? 'Expedition checkpoint cleared.';
}

// --- Admin seed (kept identical to original Minecraft project) ---
export const ADMIN_SEED = {
  username: 'vcet-nsdc',
  password: 'AIDS@2025',
  permissions: ['leaderboard', 'feedback_view', 'analytics'],
};

export const DEPARTMENT_OPTIONS = [
  'AI-DS', 'CSE-DS', 'COMPS', 'EXTC', 'MECH',
  'VLSI', 'IT', 'CIVIL', 'MMS',
];
