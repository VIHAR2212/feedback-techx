// Uncharted Expedition — mock static data.
// All seeds seniors will need on a real DB live here: labs, products,
// clue pool, treasure pool, certificate shard templates.

import { Lab, Clue, Treasure } from './models';

export const LABS: Lab[] = [
  {
    labId: 'a',
    labName: "Chapter 01 — King's Bay",
    products: [
      { id: 'a1', name: 'Trueconnect.jio', icon: '📶' },
      { id: 'a2', name: 'Drone', icon: '🚁' },
      { id: 'a3', name: 'Samsung Ecosystem', icon: '📱' },
      { id: 'a4', name: 'IP Camera', icon: '📹' },
      { id: 'a5', name: '100 Billion Tech', icon: '💰' },
      { id: 'a6', name: 'VSCode', icon: '💻' },
      { id: 'a7', name: 'Temperature Calibrator', icon: '🌡️' },
    ],
  },
  {
    labId: 'c',
    labName: 'Chapter 02 — Libertalia',
    products: [
      { id: 'c1', name: 'SimilaCure', icon: '💊' },
      { id: 'c2', name: 'Allotrak', icon: '📊' },
      { id: 'c3', name: 'Reliance Samarth', icon: '🛍️' },
      { id: 'c4', name: 'Video Door Phone', icon: '🚪' },
      { id: 'c5', name: 'Motherboard Setup Raw — 1', icon: '⚙️' },
      { id: 'c6', name: 'Dial Club', icon: '☎️' },
      { id: 'c7', name: 'The Hobby Tribe', icon: '🌐' },
      { id: 'c8', name: 'Copilot', icon: '🤖' },
      { id: 'c9', name: 'IOT Monitoring', icon: '📡' },
    ],
  },
  {
    labId: 'd',
    labName: 'Chapter 03 — New Devon',
    products: [
      { id: 'd1', name: 'DND Services', icon: '🚫' },
      { id: 'd2', name: 'Her Circle', icon: '♀️' },
      { id: 'd3', name: 'Optimyz', icon: '📈' },
      { id: 'd4', name: 'RDiscovery', icon: '🔬' },
      { id: 'd5', name: 'PaperPal', icon: '📝' },
      { id: 'd6', name: 'MDVR Camera Shivsahi', icon: '🚌' },
      { id: 'd7', name: 'Motherboard Setup Raw — 2', icon: '🛠️' },
      { id: 'd8', name: 'OSM', icon: '🗺️' },
      { id: 'd9', name: 'Apple Ecosystem', icon: '🍏' },
      { id: 'd10', name: 'EDQuest', icon: '🎓' },
    ],
  },
];

export const LAB_ORDER: string[] = LABS.map((l) => l.labId); // ["a","c","d"]

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
    id: 'clue-c-1',
    title: 'Old Journal Page',
    body: 'Someone scribbled "the third torch from the left is a decoy" — could be useful later.',
    labId: 'c',
  },
  {
    id: 'clue-c-2',
    title: 'Strange Compass Reading',
    body: 'The compass needle wobbles here — something metallic is buried nearby.',
    labId: 'c',
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
// Keys match the canonical lab IDs in LABS above ("a", "c", "d").
export const SHARD_INSCRIPTIONS: Record<string, string> = {
  a: 'Awarded for clearing the Mountain Pass — first leg of the expedition.',
  c: 'Awarded for surviving the Lost Temple — second leg of the expedition.',
  d: 'Awarded for charting the Coastal Ruins — final leg of the expedition.',
};

export function getShardInscription(labId: string): string {
  return SHARD_INSCRIPTIONS[labId] ?? 'Expedition checkpoint cleared.';
}

// --- Admin credentials live in server-side env vars (ADMIN_USERNAME /
// ADMIN_PASSWORD / ADMIN_PASSWORD_HASH). Never ship them to the client. ---

export const DEPARTMENT_OPTIONS = [
  'AI-DS', 'CSE-DS', 'COMPS', 'EXTC', 'MECH',
  'VLSI', 'IT', 'CIVIL', 'MMS',
];
