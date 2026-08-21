// Uncharted Expedition — MongoDB-backed labs service.
//
// Persists the journal labs (3 sectors + their checkpoints) in a `labs`
// collection so admin edits survive restarts. On first read the collection
// is seeded from the static expeditionData so the site works even before
// any admin edit has been made.
//
// Only the journal labs live here — feedback/users/leaderboard remain on
// the in-memory mockStore (see services.ts).

import { getDatabase } from './mongodb';
import { ExpeditionLab } from './expeditionData';

export type LabDoc = {
  labKey: string; // '1' | '2' | '3'
  lab: ExpeditionLab;
  updatedAt: Date;
};

export const LAB_KEYS = ['1', '2', '3'] as const;

function sanitizeLabs(raw: Record<string, unknown>): Record<string, ExpeditionLab> {
  const result: Record<string, ExpeditionLab> = {};
  for (const key of LAB_KEYS) {
    const lab = raw?.[key] as ExpeditionLab | undefined;
    if (lab && lab.id && Array.isArray(lab.checkpoints)) {
      result[key] = {
        ...lab,
        checkpoints: lab.checkpoints.slice(0, 10),
      };
    }
  }
  return result;
}

export async function getLabsFromDb(): Promise<Record<string, ExpeditionLab>> {
  const db = await getDatabase();
  const collection = db.collection<LabDoc>('labs');

  const docs = await collection.find({ labKey: { $in: [...LAB_KEYS] } }).toArray();
  const byKey: Record<string, LabDoc> = {};
  for (const doc of docs) byKey[doc.labKey] = doc;

  const { baseExpeditionLabs } = await import('./expeditionData');

  const labs: Record<string, ExpeditionLab> = {};
  for (const key of LAB_KEYS) {
    if (byKey[key]) {
      const base = baseExpeditionLabs[key] || {};
      labs[key] = {
        ...base,
        ...byKey[key].lab,
        mapImage: byKey[key].lab?.mapImage || base.mapImage,
        themeType: byKey[key].lab?.themeType || base.themeType,
        inkColor: byKey[key].lab?.inkColor || base.inkColor,
        glowColor: byKey[key].lab?.glowColor || base.glowColor,
        coreGlow: byKey[key].lab?.coreGlow || base.coreGlow,
        badgeClass: byKey[key].lab?.badgeClass || base.badgeClass,
      };
    }
  }

  // First run: seed from the static config so the journal always has data.
  if (Object.keys(labs).length === 0) {
    return seedLabs();
  }
  return labs;
}

export async function saveLabsToDb(
  labs: Record<string, ExpeditionLab>
): Promise<Record<string, ExpeditionLab>> {
  const clean = sanitizeLabs(labs);
  if (Object.keys(clean).length === 0) {
    throw new Error('No valid labs provided');
  }

  const db = await getDatabase();
  const collection = db.collection<LabDoc>('labs');
  const now = new Date();

  await Promise.all(
    Object.entries(clean).map(([labKey, lab]) =>
      collection.updateOne(
        { labKey },
        { $set: { lab, updatedAt: now } },
        { upsert: true }
      )
    )
  );
  return clean;
}

export async function resetLabsToSeed(): Promise<Record<string, ExpeditionLab>> {
  const db = await getDatabase();
  const collection = db.collection<LabDoc>('labs');
  await collection.deleteMany({ labKey: { $in: [...LAB_KEYS] } });
  return seedLabs();
}

async function seedLabs(): Promise<Record<string, ExpeditionLab>> {
  // Dynamic import to avoid a circular dependency at module scope:
  // expeditionData imports nothing from this file, but it is imported by
  // the cache wiring we add later — keep this lazy.
  const { baseExpeditionLabs } = await import('./expeditionData');
  const seed: Record<string, ExpeditionLab> = {};
  for (const key of LAB_KEYS) {
    if (baseExpeditionLabs[key]) {
      seed[key] = JSON.parse(JSON.stringify(baseExpeditionLabs[key]));
    }
  }
  await saveLabsToDb(seed);
  return seed;
}