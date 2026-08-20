// Lossy-compresses large static images in public/ IN PLACE (same filenames,
// so zero code changes). Skipped: .gif (sharp cannot encode GIF), and files
// under MIN_KB. Originals are recoverable via git (public/ is tracked).
// Usage: node scripts/optimize-images.mjs [--width 1920] [--min-kb 100]
import { readdir, stat, rename, unlink } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import sharp from 'sharp';

const PUBLIC_DIR = join(process.cwd(), 'public');
const arg = (name, fallback) => {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? Number(process.argv[idx + 1]) : fallback;
};
const MAX_WIDTH = arg('--width', 1920);
const MIN_KB = arg('--min-kb', 100);

const targets = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (/\.(png|jpe?g)$/i.test(entry.name)) targets.push(full);
  }
}
await walk(PUBLIC_DIR);

let totalBefore = 0;
let totalAfter = 0;
let converted = 0;

for (const file of targets) {
  const before = (await stat(file)).size;
  if (before < MIN_KB * 1024) continue;

  const ext = extname(file).toLowerCase();
  let pipeline = sharp(file).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });
  if (ext === '.png') {
    pipeline = pipeline.png({ compressionLevel: 9, palette: true, quality: 85, effort: 10 });
  } else {
    pipeline = pipeline.jpeg({ quality: 75, mozjpeg: true });
  }

  const tmp = `${file}.tmp-${process.pid}`;
  await pipeline.toFile(tmp);
  const after = (await stat(tmp)).size;
  if (after >= before) {
    await unlink(tmp);
    continue; // keep original if compression didn't help
  }

  await rename(tmp, file);
  totalBefore += before;
  totalAfter += after;
  converted++;
  console.log(
    `${file.replace(PUBLIC_DIR + '\\', '').padEnd(58)} ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`
  );
}

console.log(
  `\nCompressed ${converted} files: ${(totalBefore / 1024 / 1024).toFixed(1)}MB -> ${(totalAfter / 1024 / 1024).toFixed(1)}MB (${Math.round((1 - totalAfter / totalBefore) * 100)}% smaller)`
);