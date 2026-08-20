// Downscales public/frames/*.jpg to WebP for the LandingReveal scroll sequence.
// Original JPGs are kept as an onerror fallback in LandingReveal.tsx.
// Usage: node scripts/optimize-frames.mjs
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const FRAMES_DIR = join(process.cwd(), 'public', 'frames');
const MAX_WIDTH = 1280;

const files = (await readdir(FRAMES_DIR))
  .filter((f) => f.endsWith('.jpg'))
  .sort();

let totalBefore = 0;
let totalAfter = 0;

for (const f of files) {
  const inPath = join(FRAMES_DIR, f);
  const outPath = join(FRAMES_DIR, f.replace(/\.jpg$/, '.webp'));
  const before = (await stat(inPath)).size;
  const info = await sharp(inPath)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 72, effort: 4 })
    .toFile(outPath);
  totalBefore += before;
  totalAfter += info.size;
  console.log(`${f}: ${(before / 1024).toFixed(0)}KB -> ${(info.size / 1024).toFixed(0)}KB`);
}

console.log(
  `Total: ${(totalBefore / 1024 / 1024).toFixed(1)}MB -> ${(totalAfter / 1024 / 1024).toFixed(1)}MB WebP (${Math.round((1 - totalAfter / totalBefore) * 100)}% smaller)`
);