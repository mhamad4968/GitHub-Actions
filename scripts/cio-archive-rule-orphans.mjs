#!/usr/bin/env node
/**
 * verify-rule-hierarchy-prune が指す superseded プランを docs/plans/_archive/ へ移動
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUPERSEDED_PLANS } from './verify-rule-hierarchy-prune.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const dry = process.argv.includes('--dry-run');
  let moved = 0;
  for (const s of SUPERSEDED_PLANS) {
    const fromAbs = path.join(root, s.from);
    const toAbs = path.join(root, s.to);
    if (!fs.existsSync(fromAbs)) continue;
    if (fs.existsSync(toAbs)) {
      console.log(`[cio-archive-rule-orphans] skip (dest exists): ${s.to}`);
      continue;
    }
    fs.mkdirSync(path.dirname(toAbs), { recursive: true });
    const banner = `> **ARCHIVED** ${new Date().toISOString().slice(0, 10)} — ${s.reason}\n> 正本: \`docs/constitution/00-rule-hierarchy.md\`\n\n`;
    const body = fs.readFileSync(fromAbs, 'utf8');
    if (dry) {
      console.log(`[dry-run] would archive ${s.from} → ${s.to}`);
    } else {
      fs.writeFileSync(toAbs, banner + body, 'utf8');
      fs.unlinkSync(fromAbs);
      console.log(`[cio-archive-rule-orphans] archived ${s.from} → ${s.to}`);
    }
    moved++;
  }
  console.log(`[cio-archive-rule-orphans] done (${moved} file(s))`);
}

main();
