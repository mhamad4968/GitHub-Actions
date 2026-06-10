#!/usr/bin/env node
/**
 * AGENTS.md を章単位で docs/constitution/ に抽出（§ 番号は AGENTS.md 正本のまま）
 * 用法: npm run constitution:extract-genres
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getExtractGenres,
  getManualPhase2Files,
} from './lib/constitution-genre-catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const agentsPath = path.join(root, 'AGENTS.md');
const outDir = path.join(root, 'docs', 'constitution');
const manifestPath = path.join(outDir, 'manifest.json');

const GENRES = getExtractGenres();

function wrapGenre(meta, body) {
  return `# ${meta.title}

> **条文番号の正本**: \`AGENTS.md\`（本ファイルは読みやすい分割コピー）  
> **いつ読む**: ${meta.when}  
> **索引**: \`RULES-INDEX.md\` → \`docs/constitution/README.md\`

---

## 要約

このジャンルに属する § は、下記本文どおり \`AGENTS.md\` から抽出したものです。解釈の最終正本は \`AGENTS.md\` の同一 § です。

---

${body.trim()}

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | \`AGENTS.md\` |
| 索引 | \`RULES-INDEX.md\` |
| §↔ジャンル | \`data/constitution-section-genre-map.json\` |
| Cursor 常時 | \`.cursor/rules/cio-constitution.mdc\` |
| 手順 | \`WORKFLOW.md\` |
`;
}

function splitChapters(text) {
  const re = /^## 第\d+章[^\n]*/gm;
  const indices = [];
  let m;
  while ((m = re.exec(text)) !== null) indices.push({ i: m.index, h: m[0] });
  const chunks = [];
  for (let k = 0; k < indices.length; k++) {
    const start = indices[k].i;
    const end = k + 1 < indices.length ? indices[k + 1].i : text.length;
    chunks.push({ header: indices[k].h, body: text.slice(start, end) });
  }
  return chunks;
}

function main() {
  const text = fs.readFileSync(agentsPath, 'utf8');
  const lines = text.split(/\r?\n/);
  const chapters = splitChapters(text);

  fs.mkdirSync(outDir, { recursive: true });

  const findChapter = (re) => chapters.find((c) => re.test(c.header))?.body ?? '';

  const ch1Idx = lines.findIndex((l) => /^## 第1章/.test(l));
  const written = [];

  const writeGenre = (meta, body) => {
    if (!body.trim()) return;
    const fp = path.join(outDir, meta.file);
    fs.writeFileSync(fp, `${wrapGenre(meta, body)}\n`, 'utf8');
    written.push(meta.file);
  };

  writeGenre(GENRES[0], lines.slice(0, ch1Idx >= 0 ? ch1Idx : 64).join('\n'));

  for (let i = 1; i < GENRES.length; i++) {
    const meta = GENRES[i];
    if (!meta.chapter) continue;
    const primary = findChapter(meta.chapter);
    if (meta.combineExtraChapter && meta.extraChapter) {
      const extra = findChapter(meta.extraChapter);
      writeGenre(meta, `${primary}\n\n${extra}`.trim());
    } else {
      writeGenre(meta, primary);
    }
  }

  const prevManifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : {};

  const manifest = {
    ...prevManifest,
    generatedAt: new Date().toISOString(),
    source: 'AGENTS.md',
    catalog: 'data/constitution-genre-catalog.json',
    extractedFromAgents: written,
    manualPhase2: prevManifest.manualPhase2 || getManualPhase2Files(),
    sectionGenreMap: 'data/constitution-section-genre-map.json',
    desktopMap: prevManifest.desktopMap || 'chat-sessions/desktop-ai-emergency-read-pack/28-CONSTITUTION-GENRE-MAP.txt',
  };

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log('[constitution:extract-genres] wrote', written.length, 'files →', outDir);
  for (const f of written) console.log(' ', f);
}

main();
