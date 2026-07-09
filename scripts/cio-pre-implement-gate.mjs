#!/usr/bin/env node

/**

 * 着手前ゲート（CEO承認 D1/D2/D3/D4 是正・2026-05-22）

 * R47: --project / --intent でクローズ済みレーン再開をブロック

 */

import fs from 'node:fs';

import path from 'node:path';

import process from 'node:process';

import { fileURLToPath } from 'node:url';

import { spawnSync } from 'node:child_process';

import {

  collect5038EvidenceFromLogs,

  governanceDir,

  read5038Stamp,

} from './lib/cio-four-ai-governance.mjs';

import {

  checkClosedProjectNextTask,

  findClosure,

  formatClosureBanner,

  isProjectClosed,

} from './lib/cio-project-closure.mjs';

import {
  buildRoutePlan,
  formatRoutePlan,
  loadToolRoutingManifest,
} from './lib/cio-tool-routing.mjs';



const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');



const CHECKLIST = `

【着手前ゲート — 必須順（違反＝作業停止）】

1. [§1-2-3 ティア判定] + 【適用憲法】 + [🎖️ 本セッション割当] + [ルール確認] を応答先頭に書く（毎ターン）

2. DeepSeek 1問（§50-3-8・盲点3点）→ CIO 突合3行をチャットに残す

3. customize/** or 80行超 → Composer Subagent（CIO本体は大量Diff禁止）

4. npm run cio:guard:5038 -- --stamp（または --skip "理由"）

5. PPTX/資料系も D2: 年次矛盾・学習負荷・人事説明の盲点1問

6. 報告・締め → npm run cio:report-verify-response -- --file <下書き> exit 0

7. DB+台帳 dash: APP_DB は bundle 前 sync（R43 — \`{lane}:bundle-dash\`）— **0 禁止**

8. verify NG（lint/smoke）かつ Composer 初回 Diff 済 → **Grok L2b(C)** 検討（`cio:grok:execution-guard`）— deploy は CIO のみ



正本: docs/runbooks/cio-four-ai-violation-remediation.md

`;



function logDeepseekEvidence(text) {

  const dir = governanceDir(root);

  fs.mkdirSync(dir, { recursive: true });

  const p = path.join(dir, '5038-deepseek-evidence.md');

  const body = `# §50-3-8 evidence\n\n${text}\n\n[§50-3-8] 実施済\n`;

  fs.writeFileSync(p, body, 'utf8');

  return p;

}



function guardClosedLane(args) {

  const projectIdx = args.indexOf('--project');

  if (projectIdx >= 0) {

    const project = args[projectIdx + 1] || '';

    if (isProjectClosed(root, project)) {

      const banner = formatClosureBanner(root, project);

      console.error(`\n[cio-pre-implement-gate] NG CLOSED レーン: ${project}`);

      if (banner) console.error(banner);

      console.error('  → data/cio-project-closures.json 解除 + 浜田 GO が必要（R47）');

      process.exit(3);

    }

  }



  const intentIdx = args.indexOf('--intent');

  if (intentIdx >= 0) {

    const intent = args[intentIdx + 1] || '';

    const check = checkClosedProjectNextTask(root, intent);

    if (!check.ok) {

      console.error('\n[cio-pre-implement-gate] NG クローズ済みプロジェクトへの着手意図（R47）');

      for (const i of check.issues) {

        console.error(`  [${i.code}] ${i.label} (${i.project})`);

        if (i.fix) console.error(`    fix: ${i.fix}`);

      }

      process.exit(3);

    }

  }



  const laneIdx = args.indexOf('--lane');

  if (laneIdx >= 0) {

    const lane = args[laneIdx + 1] || '';

    const c = findClosure(root, lane);

    if (c) {

      console.warn(`\n[cio-pre-implement-gate] WARN レーン ${lane} は closed-v1 (${c.closedAt})`);

      console.warn(`  正本: ${c.completionReport}`);

    }

  }

}



function main() {

  const args = process.argv.slice(2);

  guardClosedLane(args);

  console.log(CHECKLIST.trim());

  const intentIdx = args.indexOf('--intent');
  if (intentIdx >= 0) {
    const intent = args[intentIdx + 1] || '';
    if (intent) {
      try {
        const manifest = loadToolRoutingManifest(root);
        const plan = buildRoutePlan(manifest, intent);
        console.log('\n--- tool routing (D v2) ---');
        console.log(formatRoutePlan(plan));
        console.log('  → npm run cio:tool:route -- --intent "' + intent.replace(/"/g, '\\"') + '" --log');
      } catch (e) {
        console.warn(`[cio-pre-implement-gate] WARN tool-routing: ${e.message}`);
      }
    }
  }

  const evidence = collect5038EvidenceFromLogs(root);

  const stamp = read5038Stamp(root);

  if (evidence.length) {

    console.log(`\n[cio-pre-implement-gate] §50-3-8 evidence: ${evidence.join(', ')}`);

  } else {

    console.warn('\n[cio-pre-implement-gate] WARN: §50-3-8 evidence なし — DeepSeek→突合→stamp を先に');

  }

  if (stamp?.stampedAt) {

    console.log(`[cio-pre-implement-gate] stamp: ${stamp.stampedAt} mode=${stamp.mode}`);

  }



  const textIdx = args.indexOf('--deepseek-text');

  if (textIdx >= 0) {

    const text = args[textIdx + 1] || '';

    const p = logDeepseekEvidence(text);

    console.log(`[cio-pre-implement-gate] wrote ${path.relative(root, p)}`);

  }



  if (args.includes('--stamp')) {

    const r = spawnSync(

      process.execPath,

      ['scripts/cio-deepseek-5038-evidence-guard.mjs', '--stamp'],

      { cwd: root, stdio: 'inherit', env: process.env }

    );

    process.exit(r.status ?? 1);

  }



  if (args.includes('--strict') && evidence.length === 0) {

    console.error('[cio-pre-implement-gate] NG --strict: §50-3-8 証跡なし');

    console.error('  → DeepSeek 盲点3点 → CIO 突合3行 → npm run cio:guard:5038 -- --stamp');

    console.error('  → 毎ターン先頭: npm run cio:turn-start');

    process.exit(2);

  }



  if (args.includes('--strict')) {

    console.log('[cio-pre-implement-gate] --strict OK（証跡あり）');

  }



  process.exit(0);

}



main();

