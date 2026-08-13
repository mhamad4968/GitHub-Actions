#!/usr/bin/env node
/**
 * 月次下書きパックを作る。ネタは空スロット。既存 HAMADA-NETA は上書きしない。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function jstYm() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 7);
}

function nextYm(ym) {
  const [y, m] = ym.split('-').map(Number);
  const nm = m === 12 ? 1 : m + 1;
  const ny = m === 12 ? y + 1 : y;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}

function defaultPackMonth() {
  const now = jstYm();
  try {
    const registry = JSON.parse(
      fs.readFileSync(path.join(root, 'templates/doc-lane/keiei-kaigi-docx-registry.json'), 'utf8'),
    );
    const cur = (registry.templates || []).find((t) => t.meetingMonth === now);
    if (cur?.status === 'completed') return nextYm(now);
  } catch {
    /* keep now */
  }
  return now;
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : '';
}

function main() {
  const ym = arg('month') || defaultPackMonth();
  const dir = path.join(root, 'docs/reports/keiei-draft-packs', ym);
  fs.mkdirSync(dir, { recursive: true });

  const tpl = fs.readFileSync(
    path.join(root, 'chat-sessions/templates/keiei-monthly-draft-pack-README.template.md'),
    'utf8',
  );
  const readme = path.join(dir, 'README.md');
  if (!fs.existsSync(readme)) fs.writeFileSync(readme, tpl.replaceAll('{YYYY-MM}', ym), 'utf8');

  const neta = path.join(dir, 'HAMADA-NETA.md');
  if (!fs.existsSync(neta)) {
    fs.writeFileSync(
      neta,
      `# 周知ネタ（浜田渡し） ${ym}\n\n基本: 浜田が書いて渡す。空なら待つ。出ないときだけ相談。\n\n- [ ] 題:\n- [ ] 出典:\n`,
      'utf8',
    );
  }

  const registry = JSON.parse(
    fs.readFileSync(path.join(root, 'templates/doc-lane/keiei-kaigi-docx-registry.json'), 'utf8'),
  );
  const base =
    (registry.templates || []).find((t) => t.recommendedAsBase) ||
    (registry.templates || []).at(-1) ||
    {};
  fs.writeFileSync(
    path.join(dir, 'POINTERS.json'),
    `${JSON.stringify(
      {
        month: ym,
        recommendedBaseId: base.id || null,
        recommendedBasePath: base.path || null,
        netaRunbook: 'docs/runbooks/keiei-kaigi-neta-from-security-next.md',
        reportRunbook: 'docs/runbooks/keiei-kaigi-security-report.md',
        note: 'ネタ先出し禁止。8月度 completed は再着手しない。',
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(`[cio:keiei:draft-pack] OK ${dir}`);
  process.exit(0);
}

main();
