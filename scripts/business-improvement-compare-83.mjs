#!/usr/bin/env node
/**
 * 旧83（評価テーブル）× §4.3.1 機械突合。
 *
 * Usage:
 *   npm run business-improvement:compare-83
 *   npm run business-improvement:compare-83 -- --out docs/reports/2026-05-24-app83-spec431-crosswalk.md
 *
 * 入力（既定）:
 *   scripts/data/app-83-records-snapshot.json
 *   scripts/data/business-improvement-eval-spec-431.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DATA = path.join(REPO_ROOT, 'scripts', 'data');

const OLD_TYPE_MAP = {
  '業務改善提案評価：評価': { proposalType: '業務改善提案', axis: '効果' },
  '業務改善提案評価：工夫度': { proposalType: '業務改善提案', axis: '工夫度' },
  '業務改善提案評価：努力度': { proposalType: '業務改善提案', axis: '努力度' },
  'アイディア提案評価：総合評価': { proposalType: 'アイデア提案', axis: '総合的審査' },
  最終評価: { proposalType: '(メタ)', axis: '表彰ランク閾値' },
};

function parseArgs(argv) {
  let out = path.join(REPO_ROOT, 'docs', 'reports', '2026-05-24-app83-spec431-crosswalk.md');
  let recordsPath = path.join(DATA, 'app-83-records-snapshot.json');
  let specPath = path.join(DATA, 'business-improvement-eval-spec-431.json');
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out' && argv[i + 1]) out = argv[++i];
    else if (argv[i] === '--records' && argv[i + 1]) recordsPath = argv[++i];
    else if (argv[i] === '--spec' && argv[i + 1]) specPath = argv[++i];
  }
  return {
    out: path.isAbsolute(out) ? out : path.join(REPO_ROOT, out),
    recordsPath: path.isAbsolute(recordsPath) ? recordsPath : path.join(REPO_ROOT, recordsPath),
    specPath: path.isAbsolute(specPath) ? specPath : path.join(REPO_ROOT, specPath),
  };
}

function buildExpectedRows(spec) {
  const rows = [];
  for (const [proposalType, block] of Object.entries(spec.proposalTypes)) {
    for (const item of block.items) {
      for (const level of item.levels) {
        rows.push({
          proposalType,
          axis: item.axis,
          stage: level.stage,
          points: level.points,
          key: `${proposalType}|${item.axis}|${level.points}`,
        });
      }
    }
  }
  return rows;
}

function classifyMetaRow(rec) {
  const rank = String(rec['評価'] || '').trim();
  const pts = Number(rec['評価点']);
  if (['A', 'B', 'C'].includes(rank)) return '🔧';
  return '❓';
}

function detectDuplicates(records) {
  const seen = new Map();
  const dupes = [];
  for (const r of records) {
    const type = r['評価種別'];
    const pts = r['評価点'];
    if (type === '最終評価') continue;
    const key = `${type}|${pts}`;
    if (seen.has(key)) {
      dupes.push({ id: r.id, duplicateOf: seen.get(key), key });
    } else {
      seen.set(key, r.id);
    }
  }
  return dupes;
}

const { out, recordsPath, specPath } = parseArgs(process.argv.slice(2));

if (!fs.existsSync(recordsPath)) {
  console.error(`Missing ${recordsPath} — run: npm run business-improvement:snapshot-83`);
  process.exit(1);
}
if (!fs.existsSync(specPath)) {
  console.error(`Missing ${specPath}`);
  process.exit(1);
}

const snapshot = JSON.parse(fs.readFileSync(recordsPath, 'utf8'));
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const records = snapshot.records || [];
const expectedRows = buildExpectedRows(spec);
const dupes = detectDuplicates(records);

const evalRecords = records.filter((r) => r['評価種別'] !== '最終評価');
const metaRecords = records.filter((r) => r['評価種別'] === '最終評価');

const crosswalk = [];
const matchedKeys = new Set();

for (const exp of expectedRows) {
  const oldTypes = Object.entries(OLD_TYPE_MAP)
    .filter(([, v]) => v.proposalType === exp.proposalType && v.axis === exp.axis)
    .map(([k]) => k);

  const candidates = evalRecords.filter(
    (r) => oldTypes.includes(r['評価種別']) && Number(r['評価点']) === exp.points,
  );
  const primary = candidates.find((r) => !dupes.some((d) => d.id === r.id)) || candidates[0];

  if (primary) {
    matchedKeys.add(`${primary['評価種別']}|${primary['評価点']}|${primary.id}`);
    crosswalk.push({
      verdict: '✅',
      proposalType: exp.proposalType,
      axis: exp.axis,
      stage: exp.stage,
      specPoints: exp.points,
      oldId: primary.id,
      oldType: primary['評価種別'],
      oldLabel: primary['評価'],
      note: candidates.length > 1 ? `重複${candidates.length}件（代表1件）` : '',
    });
  } else {
    crosswalk.push({
      verdict: '🟠',
      proposalType: exp.proposalType,
      axis: exp.axis,
      stage: exp.stage,
      specPoints: exp.points,
      oldId: '',
      oldType: '',
      oldLabel: '',
      note: '§4.3.1のみ — 83に該当行なし',
    });
  }
}

const orphans = evalRecords.filter((r) => {
  const key = `${r['評価種別']}|${r['評価点']}|${r.id}`;
  return !matchedKeys.has(key);
});

const summary = {
  total83: records.length,
  metaRows: metaRecords.length,
  evalRows: evalRecords.length,
  expected431: expectedRows.length,
  matched: crosswalk.filter((r) => r.verdict === '✅').length,
  missingIn83: crosswalk.filter((r) => r.verdict === '🟠').length,
  orphan83: orphans.length,
  duplicates: dupes.length,
};

const lines = [];
lines.push('# 旧83 × §4.3.1 突合表（機械生成）');
lines.push('');
lines.push(`**生成**: ${new Date().toISOString()}  \n**正本**: \`scripts/data/app-83-records-snapshot.json\` × \`business-improvement-eval-spec-431.json\``);
lines.push('');
lines.push('## サマリ');
lines.push('');
lines.push('| 項目 | 件数 |');
lines.push('|------|------|');
lines.push(`| 83 全レコード | ${summary.total83} |`);
lines.push(`| うち 最終評価（メタ） | ${summary.metaRows} |`);
lines.push(`| うち 評価段階行 | ${summary.evalRows} |`);
lines.push(`| §4.3.1 期待行（20） | ${summary.expected431} |`);
lines.push(`| ✅ 点数一致 | ${summary.matched} |`);
lines.push(`| 🟠 83に無し | ${summary.missingIn83} |`);
lines.push(`| 🔵 83のみ（重複・余剰） | ${summary.orphan83} |`);
lines.push(`| 重複キー | ${summary.duplicates} |`);
lines.push('');
lines.push('> **Q70**: §4.3.1 の点数は固定。83の「最終評価」3行は **ルックアップ用メタ**（100/1000/5000）→ 新仕様では **JS自動ランク+最終決定** に置換。');
lines.push('');
lines.push('## 突合表（§4.3.1 → 83）');
lines.push('');
lines.push('| 判定 | 提案種別 | 軸 | 段階 | §4.3.1点 | 83 ID | 旧評価種別 | 旧ラベル | 備考 |');
lines.push('|------|----------|-----|------|----------|-------|------------|----------|------|');
for (const row of crosswalk) {
  lines.push(
    `| ${row.verdict} | ${row.proposalType} | ${row.axis} | ${row.stage} | ${row.specPoints} | ${row.oldId || '—'} | ${row.oldType || '—'} | ${String(row.oldLabel || '—').replace(/\|/g, '\\|').slice(0, 40)} | ${row.note || ''} |`,
  );
}

if (metaRecords.length) {
  lines.push('');
  lines.push('## メタ行（最終評価 — 明日 Q57 確認候補）');
  lines.push('');
  lines.push('| 83 ID | 評価 | 評価点 | 判定 | 新仕様での扱い（案） |');
  lines.push('|-------|------|--------|------|---------------------|');
  for (const r of metaRecords) {
    const v = classifyMetaRow(r);
    const proposal =
      v === '🔧'
        ? '設定マスタ不要 — **Q63/Q65 境界で JS 自動判定**。旧100/1000/5000は廃止'
        : '要確認';
    lines.push(`| ${r.id} | ${r['評価']} | ${r['評価点']} | ${v} | ${proposal} |`);
  }
}

if (orphans.length) {
  lines.push('');
  lines.push('## 83 のみ存在（余剰・重複）');
  lines.push('');
  lines.push('| 83 ID | 評価種別 | 評価点 | 評価ラベル | 備考 |');
  lines.push('|-------|----------|--------|------------|------|');
  for (const r of orphans) {
    const isDupe = dupes.some((d) => d.id === r.id);
    lines.push(
      `| ${r.id} | ${r['評価種別']} | ${r['評価点']} | ${String(r['評価'] || '').slice(0, 36)} | ${isDupe ? '重複候補' : '余剰'} |`,
    );
  }
}

if (dupes.length) {
  lines.push('');
  lines.push('## 重複検知');
  lines.push('');
  for (const d of dupes) {
    lines.push(`- ID **${d.id}** は ID ${d.duplicateOf} と同一キー \`${d.key}\``);
  }
}

lines.push('');
lines.push('## 旧→新 評価種別マップ');
lines.push('');
lines.push('| 旧83 評価種別 | 新 提案種別 | 新 評価軸 |');
lines.push('|--------------|------------|----------|');
for (const [oldType, m] of Object.entries(OLD_TYPE_MAP)) {
  lines.push(`| ${oldType} | ${m.proposalType} | ${m.axis} |`);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${lines.join('\n')}\n`, 'utf8');

console.log('[compare-83] summary:', JSON.stringify(summary));
console.log(`[compare-83] report -> ${out}`);

process.exit(summary.missingIn83 > 0 || summary.orphan83 > 0 ? 0 : 0);
