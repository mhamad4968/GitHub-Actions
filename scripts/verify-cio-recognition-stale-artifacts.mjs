#!/usr/bin/env node
/**
 * R19 認識同期 — 陳腐化アーティファクト検証（Phase 3/4）
 * checkpoint/bridge が正でも、HANDOFF・seal・18 等が誤ブリーフィングを誘発しないか
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadProjectClosures } from './lib/cio-project-closure.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const issues = [];
  const { closures } = loadProjectClosures(root);
  const biClosed = closures.some((c) => c.id === 'business-improvement' && c.status === 'closed-v1');
  if (!biClosed) {
    console.log('[verify:cio-recognition-stale-artifacts] SKIP（business-improvement 未クローズ）');
    process.exit(0);
  }

  const handoffPath = path.join(root, 'chat-sessions/HANDOFF-HUMAN.txt');
  const handoff = fs.readFileSync(handoffPath, 'utf8');
  const lines = handoff.split(/\r?\n/);

  const topBlock = lines.slice(7, 13).join('\n');
  if (!topBlock.includes('2026-06-13')) {
    issues.push('HANDOFF-HUMAN 先頭块に 2026-06-13 なし');
  }
  if (!/項番\s*-0|v1\s*クローズ/i.test(topBlock)) {
    issues.push('HANDOFF-HUMAN 先頭块に 項番 -0 / v1 クローズ なし');
  }
  if (/Q-SCHED-03/.test(topBlock)) {
    issues.push('HANDOFF-HUMAN 先頭块に Q-SCHED-03（TSB-038 再発）');
  }

  const idx611 = handoff.indexOf('2026-06-11');
  if (idx611 >= 0) {
    const chunk611 = handoff.slice(idx611, idx611 + 600);
    if (/Q-SCHED-03/.test(chunk611) && !/SUPERSEDED|6\/13.*完了|先頭.*正/i.test(chunk611)) {
      issues.push('HANDOFF-HUMAN 6/11 块に Q-SCHED-03 あるが superseded 注記なし');
    }
  }

  if (/日終わり.*sync\s*→\s*verify/.test(handoff) && !handoff.includes('cio:session:close-git')) {
    issues.push('HANDOFF-HUMAN 日終わりが旧 sync→verify のまま');
  }

  const checkpoint = fs.readFileSync(path.join(root, 'chat-sessions/checkpoint-latest.md'), 'utf8');
  const bootstrapMatch = checkpoint.match(
    /## セッション切替後の自律復元[\s\S]*?(?=\n---\n\n## |\n## 2026)/,
  );
  const bootstrap = bootstrapMatch ? bootstrapMatch[0] : '';
  if (bootstrap && /日終わり.*sync.*浜田確認|日終わり sync は浜田確認/.test(bootstrap)) {
    issues.push('checkpoint bootstrap 日終わりが旧「浜田確認または §41」のまま');
  }
  if (bootstrap && !bootstrap.includes('cio:session:close-git')) {
    issues.push('checkpoint bootstrap に cio:session:close-git 未記載');
  }

  const r1318Path = path.join(root, 'docs/approved-changes/2026-06-11-rules-r13-r18-hamada-go.md');
  if (fs.existsSync(r1318Path)) {
    const r1318 = fs.readFileSync(r1318Path, 'utf8');
    const laneSection = r1318.match(/## 明日レーン[\s\S]*?(?=\n---|\n## |$)/)?.[0] || '';
    if (/Q-SCHED-03/.test(laneSection) && !/SUPERSEDED|6\/13.*完了|v1 クローズ/i.test(laneSection)) {
      issues.push('approved-changes R13-18 明日レーンに Q-SCHED-03 あるが superseded なし');
    }
  }

  const eighteen = fs.readFileSync(
    path.join(root, 'chat-sessions/desktop-ai-emergency-read-pack/18-重要確認.txt'),
    'utf8',
  );
  if (
    eighteen.includes('cio:session:close-git') &&
    eighteen.includes('→ 続けて `npm run desktop:sync-and-verify`') &&
    !eighteen.includes('内包')
  ) {
    issues.push('18-重要確認 R20 が close-git 後の別途 desktop sync のまま');
  }

  const tips = fs.readFileSync(path.join(root, 'docs/knowledge/debug-tips.md'), 'utf8');
  if (!tips.includes('業務改善 v1 クローズ') && !tips.includes('陳腐化警告')) {
    issues.push('debug-tips.md に v1 クローズ陳腐化警告なし');
  }

  const sealPath = path.join(root, 'docs/handoff/implementation-ok-seal.json');
  if (fs.existsSync(sealPath)) {
    const seal = JSON.parse(fs.readFileSync(sealPath, 'utf8'));
    if (/案B1/.test(seal.scope || '') && !/クローズ|superseded|履歴/i.test(seal.note || '')) {
      issues.push('implementation-ok-seal.json が案B1のままクローズ注記なし');
    }
  }

  const scoresPath = path.join(root, 'docs/handoff/spec-task-scores.json');
  if (fs.existsSync(scoresPath)) {
    const scores = JSON.parse(fs.readFileSync(scoresPath, 'utf8'));
    const stale = (scores.tasks || []).find(
      (t) => /案B1|Q-SCHED-03/.test(t.text || '') && t.status === 'pending',
    );
    if (stale) {
      issues.push(`spec-task-scores.json に pending の陳腐タスク: ${stale.id}`);
    }
  }

  if (issues.length) {
    console.error('[verify:cio-recognition-stale-artifacts] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }

  console.log('[verify:cio-recognition-stale-artifacts] OK 認識同期アーティファクト整合');
  process.exit(0);
}

main();
