export interface CheckpointNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  x: number; // Percentage from left (0 - 100)
  y: number; // Percentage from top (0 - 100)
}

export interface ExpeditionLab {
  id: string;
  labId?: string;
  sourceLab?: string;
  chapterNumber: string;
  name: string;
  title: string;
  subtitle: string;
  badgeTitle: string;
  fragmentId?: string;
  fragmentName?: string;
  fragmentImage?: string;
  mapImage: string;
  themeType: 'jungle' | 'frost' | 'volcano';
  inkColor: string;
  glowColor: string;
  coreGlow: string;
  badgeClass: string;
  checkpoints: CheckpointNode[];
}

export type ExpeditionLabConfig = ExpeditionLab;

export const comicAssets: Record<string, string> = {
  sky: '/assets/images/world-map.jpg',
  plane: '/assets/images/expedition_map_bg.jpg',
  jump: '/assets/images/sector-01-voyage.png',
  fall: '/assets/images/journal-spread.png',
  compass: '/assets/images/avery-pirate-coin.png',
  mapFragment: '/assets/images/expedition_status_bg.png',
};

export interface LabDiscoveryProgress {
  completed: number;
  total: number;
  isComplete: boolean;
  isCompleted: boolean;
  percentage: number;
  doneCount: number;
}

// 1. Primary Base Labs (Strictly 3 Sectors with Distinct Maps & Environments)
const baseExpeditionLabs: Record<string, ExpeditionLab> = {
  '1': {
    id: '1',
    labId: '1',
    sourceLab: '1',
    chapterNumber: 'Chapter I',
    name: 'Sector 01',
    title: 'LAB NO. 1',
    subtitle: 'Uncover lost technological blueprints, wireless relays, and ancient jungle canopy ruins.',
    badgeTitle: 'Portolan Route Mastered',
    fragmentId: '1',
    fragmentName: 'Avery Pirate Seal',
    fragmentImage: '/assets/images/avery-pirate-coin.png',
    mapImage: '/assets/images/journal-spread-lab1.jpg',
    themeType: 'jungle',
    inkColor: '#192b16',
    glowColor: '#22c55e',
    coreGlow: '#dcfce7',
    badgeClass: 'bg-[#14532d]/20 text-[#166534] border-[#166534]/40',
    checkpoints: [
      {
        id: 'c1-p1',
        name: 'Port of Departure (Temple Ruins)',
        description: 'Initial expedition staging post and ancient stone temple telemetry verification.',
        icon: '⛵',
        x: 48,
        y: 22,
      },
      {
        id: 'c1-p2',
        name: 'Hidden Mangrove Cove',
        description: 'Mid-Atlantic coastal currents calibration and compass alignment check.',
        icon: '🧭',
        x: 82,
        y: 20,
      },
      {
        id: 'c1-p3',
        name: 'Emerald Mountain Sanctuary',
        description: 'High-altitude canopy beacon relay and atmospheric signal diagnostics.',
        icon: '⚓',
        x: 78,
        y: 52,
      },
      {
        id: 'c1-p4',
        name: 'Cascade Basin Waypoint',
        description: 'Tropical thermal management logging and hydro-telemetry checks.',
        icon: '🗺️',
        x: 74,
        y: 64,
      },
      {
        id: 'c1-p5',
        name: 'Sun Altar Highlands',
        description: 'Ancient stepped temple observation post and final passage clearance survey.',
        icon: '🏔️',
        x: 36,
        y: 68,
      },
    ],
  },
  '2': {
    id: '2',
    labId: '2',
    sourceLab: '2',
    chapterNumber: 'Chapter II',
    name: 'Sector 02',
    title: 'LAB NO. 2',
    subtitle: 'Investigate lost glacial fjords, sub-zero telemetry matrices, and frozen spires.',
    badgeTitle: 'Libertalia Explorer',
    fragmentId: '2',
    fragmentName: 'Magellan Cross Key',
    fragmentImage: '/assets/images/avery-pirate-coin.png',
    mapImage: '/assets/images/journal-spread-lab2.jpg',
    themeType: 'frost',
    inkColor: '#0f2238',
    glowColor: '#38bdf8',
    coreGlow: '#e0f2fe',
    badgeClass: 'bg-[#0369a1]/20 text-[#0284c7] border-[#0284c7]/40',
    checkpoints: [
      {
        id: 'c2-p1',
        name: 'Glacial Fjord Staging Post',
        description: 'Perimeter acoustic radar detection and glacial shelf sonar verification.',
        icon: '🏝️',
        x: 32,
        y: 18,
      },
      {
        id: 'c2-p2',
        name: 'Frozen Shoals Beacon',
        description: 'Subterranean signal relay alignment through dense ice sheet acoustics.',
        icon: '🗝️',
        x: 76,
        y: 36,
      },
      {
        id: 'c2-p3',
        name: 'Frost Spire Lookout',
        description: 'Automated optical sensor diagnostics and blizzard-condition telemetry.',
        icon: '🔭',
        x: 62,
        y: 56,
      },
      {
        id: 'c2-p4',
        name: 'Sub-Zero Ice Shelf',
        description: 'Cryogenic storage node access and biometric latency benchmark.',
        icon: '🪙',
        x: 24,
        y: 72,
      },
      {
        id: 'c2-p5',
        name: 'Aurora Terminal Matrix',
        description: 'Glacial polar terminus and multi-node network synchronization.',
        icon: '🏛️',
        x: 58,
        y: 74,
      },
    ],
  },
  '3': {
    id: '3',
    labId: '3',
    sourceLab: '3',
    chapterNumber: 'Chapter III',
    name: 'Sector 03',
    title: 'LAB NO. 3',
    subtitle: 'Survey volcanic calderas, geothermal magma flows, and master eruption spires.',
    badgeTitle: 'Master Navigator',
    fragmentId: '3',
    fragmentName: 'King’s Astrolabe Crest',
    fragmentImage: '/assets/images/avery-pirate-coin.png',
    mapImage: '/assets/images/journal-spread-lab3.jpg',
    themeType: 'volcano',
    inkColor: '#240902',
    glowColor: '#f97316',
    coreGlow: '#fef08a',
    badgeClass: 'bg-[#9a3412]/20 text-[#c2410c] border-[#ea580c]/40',
    checkpoints: [
      {
        id: 'c3-p1',
        name: 'Obsidian Caldera Outpost',
        description: 'Extreme thermal pressure calibration at active volcanic summit.',
        icon: '🌊',
        x: 38,
        y: 16,
      },
      {
        id: 'c3-p2',
        name: 'Brimstone Lava Pools',
        description: 'Geothermal sensor sweep and molten basalt current mapping logs.',
        icon: '🚢',
        x: 76,
        y: 20,
      },
      {
        id: 'c3-p3',
        name: 'The Great Eruption Apex',
        description: 'Super-volcano core monitoring and extreme heat dissipation matrix.',
        icon: '🌋',
        x: 56,
        y: 36,
      },
      {
        id: 'c3-p4',
        name: 'Basalt Spire Furnace',
        description: 'High-frequency telemetry logging through magma chimney acoustics.',
        icon: '🪸',
        x: 84,
        y: 64,
      },
      {
        id: 'c3-p5',
        name: 'Molten Core Terminus',
        description: 'Final expedition terminus and global master beacon uplink confirmation.',
        icon: '⚜️',
        x: 52,
        y: 78,
      },
    ],
  },
};

// 2. Slug & Letter Aliases Mapping
const labAliases: Record<string, string> = {
  a: '1',
  b: '2',
  c: '3',
  portolan: '1',
  libertalia: '2',
  'kings-bay': '3',
};

// 3. Proxy Wrapper: Keeps Object.values(expeditionLabs) to 3 items while resolving aliases
export const expeditionLabs: Record<string, ExpeditionLab> = new Proxy(baseExpeditionLabs, {
  get(target, prop: string) {
    if (prop in target) return target[prop];
    if (typeof prop === 'string' && prop in labAliases) {
      return target[labAliases[prop]];
    }
    return undefined;
  },
  ownKeys() {
    return ['1', '2', '3'];
  },
  getOwnPropertyDescriptor(target, prop) {
    return Object.getOwnPropertyDescriptor(target, prop);
  },
});

export function getSubmittedFeedbackForUser(userEmail: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`feedback_submitted_${userEmail}`) || localStorage.getItem(`submittedFeedback_${userEmail}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSubmittedFeedbackForUser(userEmail: string, checkpointId: string): string[] {
  if (typeof window === 'undefined') return [];
  const current = getSubmittedFeedbackForUser(userEmail);
  if (!current.includes(checkpointId)) {
    const updated = [...current, checkpointId];
    localStorage.setItem(`feedback_submitted_${userEmail}`, JSON.stringify(updated));
    localStorage.setItem(`submittedFeedback_${userEmail}`, JSON.stringify(updated));
    window.dispatchEvent(new Event('feedbackSubmitted'));
    return updated;
  }
  return current;
}

export function clearSubmittedFeedbackForUser(userEmail: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`feedback_submitted_${userEmail}`);
  localStorage.removeItem(`submittedFeedback_${userEmail}`);
  window.dispatchEvent(new Event('feedbackSubmitted'));
}

export function getLabDiscoveryProgress(
  labKeyOrId: string | undefined,
  userEmail: string
): LabDiscoveryProgress {
  const key = labKeyOrId || '1';
  const lab = expeditionLabs[key] || baseExpeditionLabs['1'];

  if (!lab || !lab.checkpoints) {
    return {
      completed: 0,
      total: 0,
      isComplete: false,
      isCompleted: false,
      percentage: 0,
      doneCount: 0,
    };
  }

  const submitted = getSubmittedFeedbackForUser(userEmail);
  const completed = lab.checkpoints.filter((cp) => submitted.includes(cp.id)).length;
  const total = lab.checkpoints.length;
  const isComplete = total > 0 && completed === total;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    completed,
    total,
    isComplete,
    isCompleted: isComplete,
    percentage,
    doneCount: completed,
  };
}

export function isLabCompleted(labId: string, userEmail: string): boolean {
  const lab = expeditionLabs[labId];
  if (!lab || !lab.checkpoints) return false;
  const submitted = getSubmittedFeedbackForUser(userEmail);
  return lab.checkpoints.length > 0 && lab.checkpoints.every((cp) => submitted.includes(cp.id));
}

export function getCompletedLabCount(userEmail: string): number {
  const submitted = getSubmittedFeedbackForUser(userEmail);
  return ['1', '2', '3'].filter((labId) => {
    const lab = baseExpeditionLabs[labId];
    return lab && lab.checkpoints.every((cp) => submitted.includes(cp.id));
  }).length;
}
