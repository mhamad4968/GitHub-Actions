#!/usr/bin/env node
/**
 * 方針2 — SPEC.md 自律タスク自動スコアリング・優先順位ソート
 * @see AGENTS.md §50-3-11 第6層 / docs/handoff/spec-task-scores.json
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { readCheckpointNextTask } from "./lib/cio-checkpoint-read.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Test-only fixture injection. Production uses the repository root when unset.
const root = path.resolve(process.env.CIO_TASK_SCORE_ROOT || repoRoot);
const SPEC_REL = "templates/yojitsu-budget-lite/SPEC.md";
const BACKLOG_REL =
  "templates/yojitsu-budget-lite/docs/yojitsu-feature-backlog.md";
const CHECKPOINT_REL = "chat-sessions/checkpoint-latest.md";
const SCORES_REL = "docs/handoff/spec-task-scores.json";
const AUTO_BEGIN = "<!-- CIO-TASK-PRIORITY:AUTO:BEGIN -->";
const AUTO_END = "<!-- CIO-TASK-PRIORITY:AUTO:END -->";

function read(rel) {
  const p = path.join(root, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

function isConstraintText(text) {
  const t = String(text || "");
  return /しない|触らない|禁止|凍結|GO前|配信しない|xlsx依頼時のみ|再開しない|8\/13まで|まで触らない|constraint/i.test(
    t,
  );
}

function scoreTask(text, source) {
  const t = text.toLowerCase();
  let difficulty = 2;
  let tokens = 2;
  let impact = 3;
  const kind = isConstraintText(text) ? "constraint" : "work";

  if (/deploy|customize|put|delete|本番|677|678|679/.test(t)) {
    difficulty = 5;
    tokens = 3;
    impact = 5;
  } else if (/案b1|space\s*57|skeleton|設定マスタ|6\/8.*実装/.test(t)) {
    difficulty = 5;
    tokens = 3;
    impact = 5;
  } else if (/§41|q36|案a1|打合せ|憲法|spec\.md/.test(t)) {
    difficulty = 3;
    tokens = 2;
    impact = 5;
  } else if (/verify|lint|script|npm run|docs\//.test(t)) {
    difficulty = 2;
    tokens = 1;
    impact = 3;
  } else if (/メタ|readme|typo|索引/.test(t)) {
    difficulty = 1;
    tokens = 1;
    impact = 2;
  }

  // 制約文は「仕事」として高難度扱いにしない（空月の誤誘導防止）
  if (kind === "constraint" && source !== "checkpoint") {
    difficulty = Math.min(difficulty, 1);
    impact = Math.min(impact, 2);
  }

  const tokenLabel = tokens === 1 ? "低" : tokens === 2 ? "中" : "高";
  let priority = difficulty * 10 + tokens * 5 - impact * 3;
  if (source === "checkpoint") {
    impact = Math.max(impact, 5);
    // checkpoint の「次の1手」は実行コスト評価より Lifecycle の明示順を優先する。
    // 禁止文（例: deploy しない）を高難度タスクと誤認して backlog より下げない。
    priority = 0;
  }

  return {
    id: `${source}:${text.slice(0, 40).replace(/\s+/g, "_")}`,
    text: text.trim(),
    source,
    kind,
    difficulty,
    tokens: tokenLabel,
    tokenScore: tokens,
    impact,
    priority,
    status: "pending",
  };
}

function collectTasks() {
  const tasks = [];
  const spec = read(SPEC_REL);

  for (const m of spec.matchAll(/^- \[ \]\s*(.+)$/gm)) {
    tasks.push(scoreTask(m[1], "SPEC.md"));
  }

  for (const m of read(BACKLOG_REL).matchAll(
    /^\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/gm,
  )) {
    const [, id, summary, , status] = m;
    const idTrim = id.trim();
    if (
      !idTrim ||
      idTrim.startsWith("ID") ||
      idTrim === "—" ||
      /^-+$/.test(idTrim)
    )
      continue;
    if (/完了|done/i.test(status)) continue;
    tasks.push(scoreTask(`${idTrim}: ${summary.trim()}`, "backlog"));
  }

  const nextTask = readCheckpointNextTask(root);
  if (nextTask) {
    tasks.push(scoreTask(nextTask, "checkpoint"));
  } else {
    const cp = read(CHECKPOINT_REL);
    if (/q36|§41|案a1/i.test(cp)) {
      tasks.push(
        scoreTask("§41 案A1 — Q36 GO 報告・打合せ v5", "checkpoint-synthetic"),
      );
    }
  }

  if (!tasks.length) {
    tasks.push(
      scoreTask("§41 案A1 — Q36 GO 待ち（実装レーン凍結中）", "synthetic"),
      scoreTask("cio:task:score-spec 定期再実行 — タスク棚卸し", "synthetic"),
    );
  }

  const seen = new Set();
  return tasks.filter((t) => {
    const k = t.text;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function buildAutoSection(sorted) {
  const lines = [
    AUTO_BEGIN,
    "",
    "## AI Task Priority（自動スコアリング · `npm run cio:task:score-spec`）",
    "",
    "> **入力ソース**: 未完了チェックボックス / backlog / checkpoint。`[🎖️ 本セッション割当]` 連動。",
    "",
    "| Rank | Task | 難易度 | Token | Impact | Priority |",
    "|------|------|--------|-------|--------|----------|",
  ];
  sorted.forEach((t, i) => {
    const kindMark = t.kind === "constraint" ? "〔制約〕" : "";
    lines.push(
      `| ${i + 1} | ${kindMark}${t.text.replace(/\|/g, "\\|").slice(0, 60)} | ${t.difficulty}/5 | ${t.tokens} | ${t.impact}/5 | ${t.priority} |`,
    );
  });
  lines.push("", AUTO_END);
  return lines.join("\n");
}

function patchSpec(sorted) {
  const specPath = path.join(root, SPEC_REL);
  let body = read(SPEC_REL);
  const section = buildAutoSection(sorted);

  if (body.includes(AUTO_BEGIN)) {
    const start = body.indexOf(AUTO_BEGIN);
    const end = body.indexOf(AUTO_END);
    if (end >= 0) {
      body = body.slice(0, start) + section + body.slice(end + AUTO_END.length);
    }
  } else {
    body = body.trimEnd() + "\n\n" + section + "\n";
  }
  fs.writeFileSync(specPath, body, "utf8");
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const handoffOnly = process.argv.includes("--handoff-only");
  const outputMode = handoffOnly ? "handoff-only" : "normal";
  console.log(
    "[cio:task:score-spec] output mode:",
    outputMode,
    dryRun ? "(dry-run)" : "",
  );
  const tasks = collectTasks();
  tasks.sort((a, b) => a.priority - b.priority || b.impact - a.impact);
  const checkpointTask = tasks.find((task) => task.source === "checkpoint");
  if (checkpointTask && tasks[0] !== checkpointTask) {
    console.error(
      "[cio:task:score-spec] NG checkpoint nextTask must remain Rank1",
    );
    process.exit(1);
  }

  const payload = {
    scoredAt: new Date().toISOString(),
    specPath: SPEC_REL,
    topTask: tasks[0]?.text || null,
    topTaskKind: tasks[0]?.kind || null,
    topWorkTask: tasks.find((t) => t.kind === "work")?.text || null,
    tasks,
  };

  if (!dryRun) {
    fs.mkdirSync(path.dirname(path.join(root, SCORES_REL)), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(root, SCORES_REL),
      JSON.stringify(payload, null, 2) + "\n",
      "utf8",
    );
    if (!handoffOnly) patchSpec(tasks);
  }

  console.log("[cio:task:score-spec] OK", tasks.length, "tasks");
  console.log("[cio:task:score-spec] top:", tasks[0]?.text);
  for (const t of tasks.slice(0, 5)) {
    const kind = t.kind === "constraint" ? "C" : "W";
    console.log(
      `  [${kind}] D${t.difficulty} Tok=${t.tokens} I${t.impact} P${t.priority} — ${t.text.slice(0, 70)}`,
    );
  }
  if (payload.topTaskKind === "constraint" && payload.topWorkTask) {
    console.log("[cio:task:score-spec] topWork:", payload.topWorkTask);
  }
  process.exit(0);
}

main();
