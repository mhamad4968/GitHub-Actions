#!/usr/bin/env node
/**
 * 2026-08-03 夕反省 GO 針テスト（表示面・□A1・5038・closed-v1 micro・印刷フィルタ）
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { coalesceReportRel } from "./lib/resolve-archived-report.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;

function read(rel) {
  return fs.readFileSync(path.join(root, coalesceReportRel(root, rel)), "utf8");
}

for (const rel of [
  "docs/approved-changes/2026-08-03-evening-reflection-hamada-go.md",
  "docs/runbooks/cio-ops-2026-08-03-evening-improvements.md",
  ".cursor/rules/cio-ops-2026-08-03-evening-improvements.mdc",
  "docs/reports/2026-08-03-evening-reflection.md",
]) {
  assert.ok(fs.existsSync(path.join(root, coalesceReportRel(root, rel))), `missing ${rel}`);
}

{
  const go = read("docs/approved-changes/2026-08-03-evening-reflection-hamada-go.md");
  assert.match(go, /すべて承認/);
  assert.match(go, /憲法本文/);
  assert.match(go, /S-UI-SURF-01/);
  assert.match(go, /S-REPORT-A1/);
  assert.match(go, /S-PRINT-FILTER-01/);
  assert.match(go, /O-CLOSED-01/);
  assert.match(go, /M-5038-SURF/);
  assert.match(go, /C-41-SURF/);
  assert.match(go, /C-GO-PRINT/);
}

{
  const rb = read("docs/runbooks/cio-ops-2026-08-03-evening-improvements.md");
  assert.match(rb, /表示面:/);
  assert.match(rb, /単票印刷/);
  assert.match(rb, /モーダル部署/);
  assert.match(rb, /画面\(/);
  assert.match(rb, /cio:report-draft/);
  assert.match(rb, /O-CLOSED-01|微小 UI/);
}

{
  const mdc = read(".cursor/rules/cio-ops-2026-08-03-evening-improvements.mdc");
  const fm = mdc.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(fm, "mdc frontmatter");
  assert.match(fm[1], /alwaysApply:\s*false/);
  assert.doesNotMatch(fm[1], /alwaysApply:\s*true/);
}

{
  const ds = read(".cursor/rules/deepseek-cursor-spec-division.mdc");
  assert.match(ds, /M-5038-SURF/);
  assert.match(ds, /表示面漏れ/);
}

{
  const cl = read("docs/session-report-checklist.md");
  assert.match(cl, /S-REPORT-A1/);
  assert.match(cl, /□ A1 ダブルチェック（誰と・結果）/);
  assert.match(cl, /誰と」括弧なし|括弧なし/);
  assert.match(cl, /cio:report-draft/);
}

{
  const gov = read("docs/runbooks/cio-project-closure-governance.md");
  assert.match(gov, /O-CLOSED-01|C-micro/);
  assert.match(gov, /微小 UI／印刷|微小 UI\/印刷/);
}

{
  const p18 = read(
    "chat-sessions/desktop-ai-emergency-read-pack/18-重要確認.txt",
  );
  assert.match(p18, /C-41-SURF|表示面マトリクス/);
  assert.match(p18, /C-GO-PRINT|印刷面のみ/);
}

{
  const evening = read("docs/reports/2026-08-03-evening-reflection.md");
  assert.match(evening, /承認済|反映済/);
  assert.doesNotMatch(evening, /\| 承認待ち \|/);
}

{
  const src = read("customize/jr-ipad-dash/desktop.src.js");
  assert.match(src, /モーダル部署=/);
  assert.match(src, /画面\(/);
  assert.match(src, /jr-ipad-dash-print-filter-surf/);
}

// □A1: 正例は verify OK、括弧なしは NG
{
  const tmpOk = path.join(os.tmpdir(), `cio-a1-ok-${Date.now()}.md`);
  const tmpNg = path.join(os.tmpdir(), `cio-a1-ng-${Date.now()}.md`);
  const base = `[§1-2-3 ティア判定: L1]（根拠: evening-go-test）
【適用憲法】§1-2-3-4-A §50-3-8
[🎖️ 本セッション割当] CIO=Opus4.8 | Composer=実装 | DeepSeek=§50-3-8 | Kimi=review
[ルール確認] docs/session-report-checklist.md Read 済み

Goal: test
Touch: docs
SPEC_TOUCHED: no

`;
  const v2 = `
【セッション報告チェックシート】
CHECKSHEET_VERSION: 2
CHECKSHEET_OK: yes
SECOND_REVIEWER: deepseek
SPEC_TOUCHED: no
DESTRUCTIVE_OPS: none
DRY_RUN_TO_APPLY_GAP: n/a
`;
  fs.writeFileSync(
    tmpOk,
    base +
      `□ A1 ダブルチェック（誰と・結果）
（着手前ダブルチェック: 非該当 — evening-go-test）
（検証締めダブルチェック: 非該当）
ダブルチェック要約: DeepSeek に短問→抜けなし・本体突合済
` +
      v2,
    "utf8",
  );
  fs.writeFileSync(
    tmpNg,
    base +
      `□ A1 ダブルチェック
ダブルチェック要約: DeepSeekが短問を実施し本体が突合した
` +
      v2,
    "utf8",
  );
  const ok = spawnSync(
    node,
    [
      path.join(root, "scripts/cio-chat-report-selfcheck.mjs"),
      "--file",
      tmpOk,
      "--require-a1",
      "--require-section1",
      "--require-v2",
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(ok.status, 0, ok.stderr || ok.stdout);
  const ng = spawnSync(
    node,
    [
      path.join(root, "scripts/cio-chat-report-selfcheck.mjs"),
      "--file",
      tmpNg,
      "--require-a1",
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.notEqual(ng.status, 0, "missing 誰と must fail");
  try {
    fs.unlinkSync(tmpOk);
    fs.unlinkSync(tmpNg);
  } catch {
    /* ignore */
  }
}

{
  const pkg = JSON.parse(read("package.json"));
  assert.ok(pkg.scripts["test:evening-improvements-2026-08-03"]);
}

console.log("[test:evening-improvements-2026-08-03] OK");
