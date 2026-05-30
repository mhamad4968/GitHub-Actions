#!/usr/bin/env node
/**
 * 週末自律監査 — bridge 連動 + 健康レポート（実装凍結時・CEO 不在）
 * @see docs/runbooks/cio-weekend-autonomous-audit.md
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { bridgePath, loadBridge } from './lib/cio-session-bridge.mjs';
import { purgeDeadLines, scanDeadLines } from './lib/cio-dead-lines-purge.mjs';
import { scanDeadCode, archiveDeadCode } from './lib/cio-dead-code-purge.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const plansDir = path.join(root, 'docs', 'plans');

function jstDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
}

function run(cmd) {
  try {
    const out = execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { ok: true, out: out.trim() };
  } catch (e) {
    return { ok: false, out: (e.stdout || e.stderr || e.message || '').trim() };
  }
}

function auditBridgeTargets(bridge) {
  const lines = ['', '## 監査詳細（bridge 連動）', ''];
  if (!bridge) {
    lines.push('_bridge 無し — `npm run cio:session:export-handoff` 未実行_', '');
  } else {
    lines.push(`- **exportedAt**: ${bridge.exportedAt}`);
    lines.push(`- **gitHead**: ${bridge.gitHead}`);
    lines.push(`- **nextTask**: ${bridge.nextTask}`, '');
    lines.push('### 対象ファイル群（repo-tree / eslint 監査対象）', '');
    for (const rel of bridge.nextFiles || []) {
      const p = path.join(root, rel);
      const exists = fs.existsSync(p);
      lines.push(`- \`${rel}\`: ${exists ? '存在 OK' : 'NG 欠落'}`);
    }
    lines.push('', '### MCP 監査ゲート', '');
    const reg = run('npm run verify:cio-mcp-registry');
    lines.push(`- verify:cio-mcp-registry: ${reg.ok ? 'OK' : 'NG'}`);
    const comp = run('npm run cio:guard:composer-mcp-audit');
    lines.push(`- cio:guard:composer-mcp-audit: ${comp.ok ? 'OK' : 'NG'}`);
    lines.push('', '### Self-Healing 布石', '');
    lines.push(
      '- L2 以下の **構文のみ** エラー → Composer 2.5 が `[WEEKEND-SELF-HEALING]` コミット可（仕様意味変更禁止）',
    );
    lines.push('- 正本: `docs/runbooks/cio-weekend-autonomous-audit.md` §Self-Healing', '');
  }
  lines.push('', '### Kimi 職分 — 死に文パージ（第7層）', '');
  const deadScan = scanDeadLines(root);
  lines.push(`- 候補: ${deadScan.length} 件`);
  const deadMoved = purgeDeadLines(root, { apply: true });
  for (const m of deadMoved.slice(0, 20)) {
    lines.push(`- 退避: \`${m.from}\` → \`${m.to}\``);
  }
  if (deadMoved.length > 20) lines.push(`- …他 ${deadMoved.length - 20} 件`);
  lines.push('', '### Kimi×Composer — デッドコードパージ（第8層）', '');
  const codeHits = scanDeadCode(root, { includeCustomize: false });
  lines.push(`- 未参照 export 候補: ${codeHits.length} 件`);
  const codeMoved = archiveDeadCode(root, codeHits, { apply: true });
  for (const m of codeMoved.slice(0, 10)) {
    lines.push(`- 退避: \`${m.from}\` → \`${m.to}\` [${m.fns.join(', ')}]`);
  }
  lines.push('');
  return { lines, deadCodeMoved: codeMoved };
}

function mergeIntoCanonicalReport(detailLines, ymd) {
  const canonical = path.join(plansDir, '2026-05-29-weekend-health-audit.md');
  const marker = '## 監査詳細（bridge 連動）';
  if (fs.existsSync(canonical)) {
    let body = fs.readFileSync(canonical, 'utf8');
    const idx = body.indexOf(marker);
    if (idx >= 0) body = body.slice(0, idx).trimEnd() + '\n';
    body += '\n' + detailLines.join('\n') + '\n';
    fs.writeFileSync(canonical, body, 'utf8');
    return canonical;
  }
  return null;
}

function main() {
  const ymd = jstDate();
  const outPath = path.join(plansDir, `${ymd}-weekend-health-audit.md`);
  const bridge = loadBridge(root);

  const checks = [
    ['verify:cio-mcp-registry', 'npm run verify:cio-mcp-registry'],
    ['verify:cio-env-integrity', 'npm run verify:cio-env-integrity'],
    ['verify:cio-four-ai-governance', 'npm run verify:cio-four-ai-governance'],
    ['verify:cio-session-dissolution', 'npm run verify:cio-session-dissolution'],
    ['verify:cio-environment-infra', 'npm run verify:cio-environment-infra'],
    ['verify:cio-extreme-defence-infra', 'npm run verify:cio-extreme-defence-infra'],
    ['npm audit --omit=dev', 'npm audit --omit=dev --json'],
  ];

  const lines = [
    `# 週末健康状態監査レポート（${ymd} JST）`,
    '',
    '**生成**: `npm run cio:weekend:autonomous-audit`',
    '**提出**: 週明け月曜ファーストターンで CEO へ',
    '**実装レーン**: 凍結中（customize/deploy 未実施）',
    '',
    '## サマリ',
    '',
  ];

  let allOk = true;
  for (const [name, cmd] of checks) {
    const r = run(cmd);
    lines.push(`- **${name}**: ${r.ok ? 'OK' : 'NG'}`);
    if (!r.ok) allOk = false;
  }

  lines.push('', '## npm audit（抜粋）', '');
  const audit = run('npm audit --omit=dev');
  lines.push('```', audit.out.slice(0, 2000) || '(empty)', '```');

  const detailResult = auditBridgeTargets(bridge);
  const detail = detailResult.lines;
  lines.push(...detail);

  if (detailResult.deadCodeMoved?.length) {
    try {
      execSync(
        'git add docs/archive/dead-codes scripts && git commit -m "[WEEKEND-DEAD-CODE-PURGE] archive unreferenced exports" -m "Kimi×Composer weekend dead-code purge."',
        { cwd: root, stdio: 'inherit', shell: true },
      );
      lines.push('', '- **[WEEKEND-DEAD-CODE-PURGE]** コミット完了', '');
    } catch {
      lines.push('', '- **[WEEKEND-DEAD-CODE-PURGE]** コミットスキップ（変更なし or hook）', '');
    }
  }

  lines.push('', '## 次アクション（月曜）', '', '- CEO 検収', '- NG 項目があれば CIO 自律是正', '');

  fs.mkdirSync(plansDir, { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');

  const merged = mergeIntoCanonicalReport(detail, ymd);
  if (merged) console.log('[cio-weekend-autonomous-audit] merged detail →', merged);

  console.log('[cio-weekend-autonomous-audit]', allOk ? 'OK' : 'NG', outPath);
  process.exit(allOk ? 0 : 1);
}

main();
