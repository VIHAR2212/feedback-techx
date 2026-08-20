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

// 1. Primary Base Labs (Strictly 3 Sectors)
const baseExpeditionLabs: Record<string, ExpeditionLab> = {
  '1': {
    id: '1',
    labId: '1',
    sourceLab: '1',
    chapterNumber: 'Chapter I',
    name: 'Sector 01',
    title: 'LAB NO. 1',
    subtitle: 'Uncover lost technological blueprints, wireless relays, and early hardware prototypes.',
    badgeTitle: 'Portolan Route Mastered',
    fragmentId: '1',
    fragmentName: 'Avery Pirate Seal',
    fragmentImage: '/assets/images/avery-pirate-coin.png',
    checkpoints: [
      {
        id: 'c1-p1',
        name: 'Port of Departure (Hispania)',
        description: 'Initial expedition staging post and wireless telemetry beacon verification.',
        icon: '⛵',
        x: 50,
        y: 26,
      },
      {
        id: 'c1-p2',
        name: 'Azores Navigation Shoals',
        description: 'Mid-Atlantic ocean currents calibration and compass alignment check.',
        icon: '🧭',
        x: 77,
        y: 38,
      },
      {
        id: 'c1-p3',
        name: 'Sargasso Dead Calm Reach',
        description: 'High-resistance maritime testing grounds under variable signal drift.',
        icon: '⚓',
        x: 33,
        y: 45,
      },
      {
        id: 'c1-p4',
        name: 'Caribbean Passage Waypoint',
        description: 'Tropical thermal management logging and battery endurance checks.',
        icon: '🗺️',
        x: 48,
        y: 52,
      },
      {
        id: 'c1-p5',
        name: 'Cape Horn Observation Post',
        description: 'Sub-polar telemetry relay and final passage clearance survey.',
        icon: '🏔️',
        x: 50,
        y: 87,
      },
    ],
  },
  '2': {
    id: '2',
    labId: '2',
    sourceLab: '2',
    chapterNumber: 'Chapter II',
    name: 'Sector 02',
    title: 'Libertalia Pirate Haven',
    subtitle: 'Investigate lost pirate coves, IoT telemetry matrices, and automated defenses.',
    badgeTitle: 'Libertalia Explorer',
    fragmentId: '2',
    fragmentName: 'Magellan Cross Key',
    fragmentImage: '/assets/images/avery-pirate-coin.png',
    checkpoints: [
      {
        id: 'c2-p1',
        name: "Smuggler's Outer Atoll",
        description: 'Perimeter acoustic radar detection and barrier sonar verification.',
        icon: '🏝️',
        x: 35,
        y: 22,
      },
      {
        id: 'c2-p2',
        name: "Founder's Hidden Grotto",
        description: 'Subterranean signal relay alignment through dense stone acoustics.',
        icon: '🗝️',
        x: 72,
        y: 34,
      },
      {
        id: 'c2-p3',
        name: 'Quarantine Watchtower',
        description: 'Automated optical sensor diagnostics and night-vision telemetry.',
        icon: '🔭',
        x: 52,
        y: 49,
      },
      {
        id: 'c2-p4',
        name: 'Pirate Treasury Vault',
        description: 'Encrypted storage node access and biometric latency benchmark.',
        icon: '🪙',
        x: 30,
        y: 68,
      },
      {
        id: 'c2-p5',
        name: 'Avery Grand Amphitheater',
        description: 'Central acoustic chamber and multi-node network synchronization.',
        icon: '🏛️',
        x: 65,
        y: 84,
      },
    ],
  },
  '3': {
    id: '3',
    labId: '3',
    sourceLab: '3',
    chapterNumber: 'Chapter III',
    name: 'Sector 03',
    title: "LAB NO.  3",
    subtitle: 'Survey deep-sea abyssal trenches, submerged ruins, and final beacon clusters.',
    badgeTitle: 'Master Navigator',
    fragmentId: '3',
    fragmentName: 'King’s Astrolabe Crest',
    fragmentImage: '/assets/images/avery-pirate-coin.png',
    checkpoints: [
      {
        id: 'c3-p1',
        name: 'Abyssal Trench Entry',
        description: 'Pressure hull telemetry calibration at extreme oceanic depth.',
        icon: '🌊',
        x: 44,
        y: 20,
      },
      {
        id: 'c3-p2',
        name: 'Sunken Galleon Graveyard',
        description: 'Hydrophone sweep and submerged wreckage mapping logs.',
        icon: '🚢',
        x: 75,
        y: 42,
      },
      {
        id: 'c3-p3',
        name: 'Hydrothermal Vent Matrix',
        description: 'Geothermal sensor array monitoring and extreme temperature dissipation.',
        icon: '🌋',
        x: 36,
        y: 54,
      },
      {
        id: 'c3-p4',
        name: 'Bioluminescent Reef Shelf',
        description: 'Low-light optical frequency sweep and environmental logging.',
        icon: '🪸',
        x: 68,
        y: 70,
      },
      {
        id: 'c3-p5',
        name: 'The Abyssal Spire Core',
        description: 'Final expedition terminus and global master beacon uplink confirmation.',
        icon: '⚜️',
        x: 48,
        y: 86,
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
