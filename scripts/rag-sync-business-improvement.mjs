#!/usr/bin/env node
/**
 * 業務改善 spec を .rag/extra-docs にミラー（更新日時が新しい場合のみ）
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const manifestPath = path.join(root, 'data/rag-business-improvement-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const mirrorDir = path.join(root, manifest.ragMirrorDir || '.rag/extra-docs');
  fs.mkdirSync(mirrorDir, { recursive: true });

  let copied = 0;
  let skipped = 0;

  for (const rel of manifest.canonicalSources || []) {
    const src = path.join(root, rel);
    if (!fs.existsSync(src)) {
      console.warn('[rag:sync-business-improvement] skip missing', rel);
      skipped++;
      continue;
    }
    const base = path.basename(rel);
    const dest = path.join(mirrorDir, base);
    const srcM = fs.statSync(src).mtimeMs;
    const destM = fs.existsSync(dest) ? fs.statSync(dest).mtimeMs : 0;
    if (srcM > destM) {
      fs.copyFileSync(src, dest);
      copied++;
      console.log('[rag:sync-business-improvement] copied', base);
    } else {
      skipped++;
    }
  }

  console.log(`[rag:sync-business-improvement] OK copied=${copied} skipped=${skipped}`);
}

main();
