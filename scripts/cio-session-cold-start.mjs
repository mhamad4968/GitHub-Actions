#!/usr/bin/env node
/**
 * セッション cold-start 統合オーケストレータ
 *
 *   npm run cio:session:cold-start
 *   npm run cio:session:cold-start -- --skip-bootstrap
 *   npm run cio:session:cold-start -- --full-morning   # 朝報をフル生成
 *
 * 状態: IDLE → MORNING → PREFLIGHT → ROLLUP → QUICK-HEALTH → WALL-CLOCK
 *   → MANDATORY_READS → KNOWLEDGE_WAKE → GROK-RESET
 *   → **WAKE-PREFLIGHT-HEAL → EARLY-WAKE-COMMIT** → BOOTSTRAP
 *   → CHECKPOINT-GIT-HEAL → EXPORT → WAKE-COMMIT → IMPORT → READY
 *
 * #S-WAKE-ORDER-01: rollup/rag/stamp の dirty を bootstrap の Git 残件検査より前に commit し、
 * 毎回の「未コミット N 件」偽陽性を根絶する。
 *
 * WALL-CLOCK（§51-6-2）: bootstrap 直前に session:clock:clear → session:clock:set。
 * 続けて watch / web を確保（manual-desktop / trialPaused でも WAKE 後の stale watch を防ぐ）。
 * Phase 6c: bootstrap 後に watch/web を再確保（cio:health 二重起動による stale 防止）。
 * trialPaused / manual-desktop で sessionEnd が clear しない場合の残留開始時刻を防ぐ。
 *
 * @see docs/runbooks/session-cold-start-v1.md
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { jstYmdIso } from './lib/repo-node-env.mjs';
import {
  ensureMorningPrep,
  readMorningPrepMode,
  runNpmScript,
  runSessionPreflight,
} from './lib/cio-session-preflight.mjs';
import { clearWarnEscalation } from './lib/cio-team-ops-warn-escalation.mjs';
import {
  readWebUrl,
  spawnWatch,
  spawnWebServer,
} from './lib/session-clock-process.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd) {
  console.log(`\n━━ ${cmd}\n`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

function main() {
  const skipBootstrap = process.argv.includes('--skip-bootstrap');
  const skipRollup = process.argv.includes('--skip-rollup');
  const fullMorning = process.argv.includes('--full-morning');
  const ymd = jstYmdIso();

  console.log('═══════════════════════════════════════');
  console.log('  CIO session cold-start（統合立ち上げ）');
  console.log(`  ${new Date().toISOString()}  JST ${ymd}`);
  console.log('═══════════════════════════════════════\n');

  // Phase 1 — 朝報（無ければ fast 生成。--full-morning で常にフル）
  console.log('▶ Phase 1 MORNING');
  if (fullMorning) {
    const r = ensureMorningPrep(root, { fast: false });
    console.log(`[cold-start] morning: ${r.action} ok=${r.ok}`);
    if (!r.ok) {
      console.error('[cold-start] ❌ morning-prep 生成失敗 — 以降は続行しますが §46 要確認');
    }
  } else {
    const mode = readMorningPrepMode(root, ymd);
    if (mode === 'missing') {
      const r = ensureMorningPrep(root, { fast: true });
      console.log(`[cold-start] morning: ${r.action} ok=${r.ok}`);
      if (!r.ok) {
        console.error('[cold-start] ❌ fast morning-prep 失敗');
        process.exit(2);
      }
    } else {
      console.log(`[cold-start] morning: 既存 (${mode}) — スキップ`);
    }
  }

  // Phase 2 — 引き継ぎ修復（scores + bridge 鮮度）
  console.log('\n▶ Phase 2 PREFLIGHT');
  const pf = runSessionPreflight(root, { forceHandoff: false });
  console.log(`[cold-start] preflight actions: ${pf.actions.join(' → ')}`);
  for (const w of pf.warnings) console.warn(`[cold-start] ⚠ ${w}`);
  if (!pf.ok) {
    console.error('[cold-start] ❌ preflight に失敗ステップあり');
    process.exit(2);
  }

  // Phase 3 — 凍結ゾーン + rollup + handoff 整合
  console.log('\n▶ Phase 3 ROLLUP');
  run('npm run verify:checkpoint-freeze-zone -- --auto-rollup');
  run('npm run cio:handoff:repair-latest');
  run('npm run verify:checkpoint-handoff-template');
  if (!skipRollup) {
    run('npm run cio:checkpoint:rollup -- --keep 3');
  }
  run('npm run cio:session:export-handoff');
  run('npm run verify:session-handoff-integrity -- --strict-staleness');
  run('npm run verify:checkpoint-project-closure');

  // Phase 4 — quick health（朝報 verify 込み）
  console.log('\n▶ Phase 4 QUICK-HEALTH');
  try {
    run('npm run cio:quick-health');
  } catch {
    console.warn('[cold-start] quick-health NG — 詳細は上記ログ。bootstrap は続行可');
  }

  // Phase 5 — §51-6-2 壁時計（前セッション開始時刻の残留防止 → mandatory-read-gate 通過）
  console.log('\n▶ Phase 5 WALL-CLOCK');
  console.log('[cold-start] §51-6-2: session:clock:clear → session:clock:set（WAKE 標準）');
  run('npm run session:clock:clear');
  run('npm run session:clock:set');
  // manual-desktop / trialPaused では sessionStart hook が watch/web を起動しないため、
  // WAKE 後に stale pid 警告が出るのを防ぐ（Desktop bat と併用可・既稼働なら no-op）
  try {
    const watch = spawnWatch();
    console.log(`[cold-start] watch ${watch.message}${watch.pid != null ? ` pid=${watch.pid}` : ''}`);
    const web = spawnWebServer();
    const url = web.url || readWebUrl();
    console.log(
      `[cold-start] web ${web.message}${url ? ` → ${url}` : ''}${web.pid != null ? ` pid=${web.pid}` : ''}`,
    );
  } catch (e) {
    console.warn(`[cold-start] watch/web ensure WARN: ${e?.message || e}`);
  }

  // Phase 5c — mandatory_reads スタンプ（entry-points E1 正本 · G4 配線）
  console.log('\n▶ Phase 5c MANDATORY_READS');
  run('npm run cio:mandatory-reads:stamp');

  // Phase 5d — アクティブ・ナレッジWAKE（MCP 受動参照の穴埋め · M-RAG-04）
  console.log('\n▶ Phase 5d KNOWLEDGE_WAKE');
  run('npm run cio:knowledge:wake-stamp');

  // Phase 5b — Grok L2b セッション状態リセット（C 回数・契約スタンプ残留防止）
  console.log('\n▶ Phase 5b GROK-SESSION-RESET');
  run('npm run cio:grok:execution-guard -- --session-reset --reason WAKE');
  clearWarnEscalation(root);

  // Phase 5e — bootstrap 前残件予防（tmp purge / rag heal / Part C sync）
  // #S-WAKE-ORDER-01: bootstrap 1e の Git 残件 NG 偽陽性を根絶するため、stamp 後・bootstrap 前に commit
  console.log('\n▶ Phase 5e WAKE-PREFLIGHT-HEAL');
  try {
    run('npm run cio:wake:preflight-heal');
  } catch {
    console.warn('[cold-start] wake:preflight-heal NG — 手動で npm run cio:wake:preflight-heal');
  }

  // Phase 5e2 — early checkpoint Git stamp（worktree のみ · --force-stamp）
  // 2026-08-10: Phase 5f が古い **Git** 行のまま commit すると bootstrap で D-CHKPT-02
  // （ancestor ずれ）が出る。early commit 前に stamp し、bootstrap では R44 off-by-one まで落とす。
  // 2026-08-11: 通常 heal は off-by-one で no-op → 5f 後 tip^2 で D-CHKPT-02 再発。
  //   → **--force-stamp** で HEAD へ寄せてから 5f（commit 後は tip^1 = R44 許容）。
  // Phase 6b の stamp→export→wake 1 commit は維持（#D-CLOSE-02 / R44）。
  console.log('\n▶ Phase 5e2 CHECKPOINT-GIT-HEAL（pre-early-wake stamp）');
  try {
    run('npm run cio:checkpoint:git-heal -- --force-stamp');
  } catch {
    console.warn(
      '[cold-start] pre-early checkpoint:git-heal --force-stamp NG — 手動で npm run cio:checkpoint:git-heal -- --force-stamp',
    );
  }

  // Phase 5f — early wake-commit（rollup archive / rag / knowledge / Part C を bootstrap 前に確定）
  console.log('\n▶ Phase 5f EARLY-WAKE-HANDOFF-COMMIT');
  try {
    run('npm run cio:wake:handoff-commit -- --push');
  } catch {
    console.warn('[cold-start] early wake:handoff-commit NG — 手動で npm run cio:wake:handoff-commit -- --push');
  }

  // Phase 6 — bootstrap + import
  if (!skipBootstrap) {
    console.log('\n▶ Phase 6 BOOTSTRAP');
    run('npm run session:bootstrap');
  }

  // Phase 6b — D-CHKPT-02 worktree stamp のみ（--commit/--push 禁止）
  // heal 単独 commit→直後 wake だと tip が進み Git が grandparent になり #D-CLOSE-02 NG（2026-08-06）
  // 正: stamp → export → wake が checkpoint+bridge を 1 commit（R44 off-by-one = parent）
  console.log('\n▶ Phase 6b CHECKPOINT-GIT-HEAL（worktree stamp）');
  try {
    run('npm run cio:checkpoint:git-heal');
  } catch {
    console.warn('[cold-start] checkpoint:git-heal NG — 手動で npm run cio:checkpoint:git-heal');
  }

  // Phase 6b1 — bridge を現 tip に合わせてから wake（stamp 後の鮮度）
  console.log('\n▶ Phase 6b1 EXPORT-HANDOFF（pre-wake）');
  try {
    run('npm run cio:session:export-handoff');
  } catch {
    console.warn('[cold-start] export-handoff NG — 手動で npm run cio:session:export-handoff');
  }

  // Phase 6b2 — stamp+export 成果物を 1 commit（heal 後の tip 追随）
  // SESSION-CLOCK は意図的 dirty のため対象外（verify-session-close-git-warn と同趣旨）
  console.log('\n▶ Phase 6b2 WAKE-HANDOFF-COMMIT（post-heal）');
  try {
    run('npm run cio:wake:handoff-commit -- --push');
  } catch {
    console.warn('[cold-start] wake:handoff-commit NG — 手動で npm run cio:wake:handoff-commit -- --push');
  }

  // Phase 6c — bootstrap 内 cio:health が WSL /tmp 経路で web を二重起動し、
  // Windows pid/url と食い違って stale になるのを防ぐ（WAKE 後に再確保）
  console.log('\n▶ Phase 6c WALL-CLOCK-REEENSURE');
  try {
    const watch = spawnWatch();
    console.log(`[cold-start] re-ensure watch ${watch.message}${watch.pid != null ? ` pid=${watch.pid}` : ''}`);
    const web = spawnWebServer();
    const url = web.url || readWebUrl();
    console.log(
      `[cold-start] re-ensure web ${web.message}${url ? ` → ${url}` : ''}${web.pid != null ? ` pid=${web.pid}` : ''}`,
    );
  } catch (e) {
    console.warn(`[cold-start] wall-clock re-ensure WARN: ${e?.message || e}`);
  }

  console.log('\n▶ Phase 7 IMPORT');
  run('npm run verify:session-handoff-integrity -- --import');

  console.log('\n═══════════════════════════════════════');
  console.log('  cold-start READY');
  console.log('  Skill: .cursor/skills/kintone-session-bootstrap/SKILL.md');
  console.log('  Lifecycle: docs/runbooks/session-lifecycle-v2.md');
  console.log('═══════════════════════════════════════\n');
}

main();
