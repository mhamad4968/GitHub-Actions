/**
 * 統合テスト: AGENTS.md 4 つの防衛線のシミュレーション検証
 *
 * §7 — Gemini モデルフォールバック（3 層構成・404 自動切替）
 * §9 — 例外枠ダブルキー論理（通常枠/例外枠の分離・ハードリミット）
 *
 * 実行: npx tsx src/__tests__/integration-defense-lines.ts
 */

// ===================================================================
// §7: Gemini モデルフォールバック検証
// ===================================================================

import {
  GEMINI_MODEL_FALLBACKS,
  geminiModelCandidates,
  isGeminiModelNotFoundError,
} from "../lib/format-news-gemini.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

console.log("=" .repeat(70));
console.log("§7 — AI モデル生存戦略: フォールバック構成の検証");
console.log("=" .repeat(70));

// 7-1: 3 層以上のフォールバック
console.log("\n[7-1] GEMINI_MODEL_FALLBACKS は 3 層以上");
assert(GEMINI_MODEL_FALLBACKS.length >= 3, `候補数 = ${GEMINI_MODEL_FALLBACKS.length} >= 3`);

// 7-2: エイリアス層の存在
console.log("\n[7-2] 第 1 層: エイリアス（*-latest）を含む");
const aliasModels = GEMINI_MODEL_FALLBACKS.filter((m) => m.includes("-latest"));
assert(aliasModels.length >= 1, `エイリアスモデル数 = ${aliasModels.length} >= 1 (${aliasModels.join(", ")})`);

// 7-2: 安定版の存在
console.log("\n[7-2] 第 2 層: 安定版（固定 ID）を含む");
const stableModels = GEMINI_MODEL_FALLBACKS.filter(
  (m) => !m.includes("-latest") && !m.includes("-preview"),
);
assert(stableModels.length >= 1, `安定版モデル数 = ${stableModels.length} >= 1 (${stableModels.join(", ")})`);

// 7-2: プレビュー版の存在
console.log("\n[7-2] 第 3 層: プレビュー版を含む");
const previewModels = GEMINI_MODEL_FALLBACKS.filter((m) => m.includes("-preview"));
assert(previewModels.length >= 1, `プレビュー版モデル数 = ${previewModels.length} >= 1 (${previewModels.join(", ")})`);

// 7-3: gemini-2.0-* が含まれていないこと
console.log("\n[7-3] 廃止モデル gemini-2.0-* が含まれない");
const deprecated = GEMINI_MODEL_FALLBACKS.filter((m) => m.startsWith("gemini-2.0"));
assert(deprecated.length === 0, `廃止モデル数 = ${deprecated.length} (期待: 0)`);

// 7-4: GEMINI_MODEL 未設定時の動作
console.log("\n[7-4] GEMINI_MODEL 未設定時: FALLBACKS がそのまま返る");
const origModel = process.env.GEMINI_MODEL;
delete process.env.GEMINI_MODEL;
const candidatesNoEnv = geminiModelCandidates();
assert(
  candidatesNoEnv.length === GEMINI_MODEL_FALLBACKS.length,
  `候補数 = ${candidatesNoEnv.length} (FALLBACKS = ${GEMINI_MODEL_FALLBACKS.length})`,
);
assert(
  candidatesNoEnv[0] === GEMINI_MODEL_FALLBACKS[0],
  `先頭 = ${candidatesNoEnv[0]} (期待: ${GEMINI_MODEL_FALLBACKS[0]})`,
);

// 7-4: GEMINI_MODEL 設定時: 先頭に挿入される
console.log("\n[7-4] GEMINI_MODEL 設定時: 先頭に挿入 + 重複排除");
process.env.GEMINI_MODEL = "gemini-custom-test";
const candidatesWithEnv = geminiModelCandidates();
assert(candidatesWithEnv[0] === "gemini-custom-test", `先頭 = ${candidatesWithEnv[0]}`);
assert(
  candidatesWithEnv.length === GEMINI_MODEL_FALLBACKS.length + 1,
  `候補数 = ${candidatesWithEnv.length} (FALLBACKS + 1)`,
);

// 重複時
process.env.GEMINI_MODEL = GEMINI_MODEL_FALLBACKS[0];
const candidatesDup = geminiModelCandidates();
assert(
  candidatesDup.length === GEMINI_MODEL_FALLBACKS.length,
  `重複時: 候補数 = ${candidatesDup.length} (重複排除で FALLBACKS と同数)`,
);

// 元に戻す
if (origModel !== undefined) process.env.GEMINI_MODEL = origModel;
else delete process.env.GEMINI_MODEL;

// 404 判定
console.log("\n[7-4] isGeminiModelNotFoundError: 404 エラー判定");
const err404 = new Error(
  "[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent: [404 Not Found] models/gemini-2.0-flash is not found for API version v1beta, or is not supported for generateContent.",
);
assert(isGeminiModelNotFoundError(err404), "404 メッセージを正しく検出");

const err429 = new Error("Resource has been exhausted (e.g. check quota).");
assert(!isGeminiModelNotFoundError(err429), "429 を 404 と誤判定しない");

const errGeneric = new Error("Network timeout");
assert(!isGeminiModelNotFoundError(errGeneric), "一般エラーを 404 と誤判定しない");

// ===================================================================
// §9: 例外枠ダブルキー論理の検証
// ===================================================================

console.log("\n" + "=" .repeat(70));
console.log("§9 — 重要ニュースの特権枠管理: ダブルキー論理の検証");
console.log("=" .repeat(70));

const TOP_N = 3;
const EXCEPTION_MAX_PER_DAY = 3;
const HARD_DAILY_TOTAL_MAX = TOP_N + EXCEPTION_MAX_PER_DAY; // = 6

const SEVERITY_EXCEPTION_PATTERNS: readonly (readonly string[])[] = [
  ["ランサム", "国内"],
  ["ランサム", "被害"],
  ["ランサム", "攻撃"],
  ["不正アクセス", "流出"],
  ["不正アクセス", "漏洩"],
  ["ゼロデイ", "悪用"],
];

function matchesSeverityException(title: string, body: string): boolean {
  const blob = `${title}\n${body}`.toLowerCase();
  return SEVERITY_EXCEPTION_PATTERNS.some((group) =>
    group.every((kw) => blob.includes(kw.toLowerCase())),
  );
}

type SimRow = { title: string; link: string; isKeywordMatch: boolean };

function simulateExceptionBucket(
  candidates: SimRow[],
  normalPicks: SimRow[],
  alreadyUsedExceptions: number,
): { toAdd: SimRow[]; normalCount: number; exceptionCount: number; totalCapped: boolean } {
  const normalUrls = new Set(normalPicks.map((r) => r.link));
  const exceptionBudget = Math.max(0, EXCEPTION_MAX_PER_DAY - alreadyUsedExceptions);

  let exceptionRows: SimRow[] = [];
  if (exceptionBudget > 0) {
    const potentialExceptions = candidates
      .filter((r) => r.isKeywordMatch)
      .filter((r) => !normalUrls.has(r.link))
      .filter((r) => matchesSeverityException(r.title, ""));
    exceptionRows = potentialExceptions.slice(0, exceptionBudget);
  }

  let totalCapped = false;
  const totalBeforeCap = normalPicks.length + exceptionRows.length;
  if (totalBeforeCap > HARD_DAILY_TOTAL_MAX) {
    exceptionRows = exceptionRows.slice(0, HARD_DAILY_TOTAL_MAX - normalPicks.length);
    totalCapped = true;
  }

  const toAdd = [...normalPicks, ...exceptionRows];
  return {
    toAdd,
    normalCount: normalPicks.length,
    exceptionCount: exceptionRows.length,
    totalCapped,
  };
}

// ケース 1: 例外条件なし → 通常枠のみ
console.log("\n[9-1] 例外条件を満たさない候補のみ → 通常枠 3 件のみ");
{
  const candidates: SimRow[] = [
    { title: "脆弱性が判明", link: "https://a.example/1", isKeywordMatch: true },
    { title: "個人情報流出", link: "https://a.example/2", isKeywordMatch: true },
    { title: "DDoS 攻撃発生", link: "https://a.example/3", isKeywordMatch: true },
    { title: "システム障害", link: "https://a.example/4", isKeywordMatch: true },
  ];
  const normalPicks = candidates.slice(0, TOP_N);
  const result = simulateExceptionBucket(candidates, normalPicks, 0);
  assert(result.normalCount === 3, `通常枠 = ${result.normalCount}`);
  assert(result.exceptionCount === 0, `例外枠 = ${result.exceptionCount}`);
  assert(result.toAdd.length === 3, `合計 = ${result.toAdd.length}`);
}

// ケース 2: ランサムウェア×国内 → 例外枠発動
console.log("\n[9-2] ランサムウェア×国内 → 通常枠 3 + 例外枠 1");
{
  const candidates: SimRow[] = [
    { title: "脆弱性が判明", link: "https://b.example/1", isKeywordMatch: true },
    { title: "個人情報流出", link: "https://b.example/2", isKeywordMatch: true },
    { title: "DDoS 攻撃発生", link: "https://b.example/3", isKeywordMatch: true },
    { title: "国内企業でランサムウェア被害", link: "https://b.example/4", isKeywordMatch: true },
  ];
  const normalPicks = candidates.slice(0, TOP_N);
  const result = simulateExceptionBucket(candidates, normalPicks, 0);
  assert(result.normalCount === 3, `通常枠 = ${result.normalCount}`);
  assert(result.exceptionCount === 1, `例外枠 = ${result.exceptionCount}`);
  assert(result.toAdd.length === 4, `合計 = ${result.toAdd.length}`);
  assert(!result.totalCapped, "ハードリミット未到達");
}

// ケース 3: 例外候補 5 件 → 例外上限 3 件で打ち止め
console.log("\n[9-3] 例外候補が上限超え → 例外枠 3 件で打ち止め");
{
  const candidates: SimRow[] = [
    { title: "脆弱性が判明", link: "https://c.example/1", isKeywordMatch: true },
    { title: "個人情報流出", link: "https://c.example/2", isKeywordMatch: true },
    { title: "DDoS 攻撃発生", link: "https://c.example/3", isKeywordMatch: true },
    { title: "国内企業でランサムウェア被害1", link: "https://c.example/4", isKeywordMatch: true },
    { title: "国内企業でランサムウェア攻撃2", link: "https://c.example/5", isKeywordMatch: true },
    { title: "不正アクセスで情報流出3", link: "https://c.example/6", isKeywordMatch: true },
    { title: "ゼロデイ悪用4", link: "https://c.example/7", isKeywordMatch: true },
    { title: "国内ランサム被害5", link: "https://c.example/8", isKeywordMatch: true },
  ];
  const normalPicks = candidates.slice(0, TOP_N);
  const result = simulateExceptionBucket(candidates, normalPicks, 0);
  assert(result.normalCount === 3, `通常枠 = ${result.normalCount}`);
  assert(result.exceptionCount === 3, `例外枠 = ${result.exceptionCount} (上限 3)`);
  assert(result.toAdd.length === 6, `合計 = ${result.toAdd.length} (ハードリミット 6)`);
  assert(!result.totalCapped, "ハードリミット到達せず（3+3=6 ちょうど）");
}

// ケース 4: 当日すでに例外 2 件消費 → 残り 1 件
console.log("\n[9-4] 当日すでに例外 2 件消費 → 残り 1 件のみ");
{
  const candidates: SimRow[] = [
    { title: "脆弱性が判明", link: "https://d.example/1", isKeywordMatch: true },
    { title: "個人情報流出", link: "https://d.example/2", isKeywordMatch: true },
    { title: "DDoS 攻撃発生", link: "https://d.example/3", isKeywordMatch: true },
    { title: "国内企業でランサムウェア被害A", link: "https://d.example/4", isKeywordMatch: true },
    { title: "ゼロデイ悪用B", link: "https://d.example/5", isKeywordMatch: true },
  ];
  const normalPicks = candidates.slice(0, TOP_N);
  const result = simulateExceptionBucket(candidates, normalPicks, 2);
  assert(result.normalCount === 3, `通常枠 = ${result.normalCount}`);
  assert(result.exceptionCount === 1, `例外枠 = ${result.exceptionCount} (残り 1)`);
  assert(result.toAdd.length === 4, `合計 = ${result.toAdd.length}`);
}

// ケース 5: 当日すでに例外 3 件消費 → 追加 0 件
console.log("\n[9-5] 当日すでに例外 3 件消費 → 例外枠追加 0");
{
  const candidates: SimRow[] = [
    { title: "脆弱性が判明", link: "https://e.example/1", isKeywordMatch: true },
    { title: "国内企業でランサムウェア被害", link: "https://e.example/2", isKeywordMatch: true },
  ];
  const normalPicks = candidates.slice(0, TOP_N);
  const result = simulateExceptionBucket(candidates, normalPicks, 3);
  assert(result.exceptionCount === 0, `例外枠 = ${result.exceptionCount} (枯渇)`);
  assert(result.toAdd.length <= TOP_N, `合計 = ${result.toAdd.length} <= ${TOP_N}`);
}

// ケース 6: 通常枠が既にランサム記事を含む → 例外枠で重複しない
console.log("\n[9-6] 通常枠に既に含まれるランサム記事 → 例外枠で重複しない");
{
  const candidates: SimRow[] = [
    { title: "国内企業でランサムウェア被害", link: "https://f.example/1", isKeywordMatch: true },
    { title: "個人情報流出", link: "https://f.example/2", isKeywordMatch: true },
    { title: "DDoS 攻撃発生", link: "https://f.example/3", isKeywordMatch: true },
  ];
  const normalPicks = candidates.slice(0, TOP_N);
  const result = simulateExceptionBucket(candidates, normalPicks, 0);
  assert(result.exceptionCount === 0, `例外枠 = ${result.exceptionCount} (通常枠に含まれるため重複なし)`);
  assert(result.toAdd.length === 3, `合計 = ${result.toAdd.length}`);
}

// ケース 7: AND 条件の片方だけ → 例外扱いにならない
console.log("\n[9-7] AND 条件の片方だけ（ランサムのみ、国内なし） → 例外扱いにならない");
{
  assert(
    matchesSeverityException("ランサムウェア対策", "") === false,
    "「ランサム」のみでは例外非該当",
  );
  assert(
    matchesSeverityException("国内企業のランサムウェア被害", "") === true,
    "「ランサム」+「被害」で例外該当",
  );
  assert(
    matchesSeverityException("ゼロデイ脆弱性", "") === false,
    "「ゼロデイ」のみでは例外非該当",
  );
  assert(
    matchesSeverityException("ゼロデイ脆弱性が悪用される", "") === true,
    "「ゼロデイ」+「悪用」で例外該当",
  );
}

// ケース 8: 全 6 パターンの AND 条件検証
console.log("\n[9-8] 全 6 パターンの AND 条件網羅テスト");
{
  const cases: [string, boolean][] = [
    ["ランサムウェアが国内企業を襲う", true],
    ["ランサムウェアによる被害が拡大", true],
    ["ランサムウェア攻撃の手口", true],
    ["不正アクセスで個人情報が流出", true],
    ["不正アクセスにより漏洩が判明", true],
    ["ゼロデイ脆弱性の悪用を確認", true],
    ["パッチ適用のお知らせ", false],
    ["脆弱性対策の重要性", false],
  ];
  for (const [title, expected] of cases) {
    assert(
      matchesSeverityException(title, "") === expected,
      `「${title}」→ ${expected ? "例外該当" : "非該当"}`,
    );
  }
}

// ===================================================================
// 結果サマリー
// ===================================================================
console.log("\n" + "=" .repeat(70));
console.log(`テスト結果: ${passed} passed, ${failed} failed`);
console.log("=" .repeat(70));

if (failed > 0) {
  process.exitCode = 1;
}
