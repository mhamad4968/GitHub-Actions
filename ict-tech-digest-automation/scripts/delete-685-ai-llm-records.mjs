/**
 * 685 正本: AI・LLM カテゴリ（および任意で AI テーマ）のレコードを一括削除。
 *
 *   npx dotenv -e ../../.env -e ../../.env.proxy -- node scripts/delete-685-ai-llm-records.mjs --dry-run
 *   npx dotenv -e ../../.env -e ../../.env.proxy -- node scripts/delete-685-ai-llm-records.mjs --apply
 *   … --include-topic   # category 以外でタイトル・概要が AI テーマのものも対象
 */
import "dotenv/config";
import {
  DEPRECATED_AI_LLM_CATEGORY,
  isAiLlmTopicText,
} from "../src/lib/ai-exclusion.ts";

const APP = Number(process.env.ICT_DIGEST_STORE_APP_ID || "685");
const FC_CATEGORY = "category";
const FC_TITLE = "title";
const FC_OVERVIEW = "overview";
const FC_PUBLISHED = "published_at";
const CHUNK = 100;

function requireEnv(k) {
  const v = process.env[k];
  if (!v || !String(v).trim()) throw new Error(`環境変数 ${k} が未設定です。`);
  return String(v).trim();
}

function buildAuthHeaders() {
  const user = requireEnv("KINTONE_USERNAME");
  const pass = requireEnv("KINTONE_PASSWORD");
  const headers = {
    "X-Cybozu-Authorization": Buffer.from(`${user}:${pass}`, "utf8").toString("base64"),
  };
  if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
    headers.Authorization = `Basic ${Buffer.from(
      `${process.env.KINTONE_BASIC_AUTH_USERNAME}:${process.env.KINTONE_BASIC_AUTH_PASSWORD}`,
      "utf8",
    ).toString("base64")}`;
  }
  return headers;
}

function jsonHeaders() {
  return { ...buildAuthHeaders(), "Content-Type": "application/json" };
}

let baseUrl = requireEnv("KINTONE_BASE_URL").trim().replace(/\/+$/, "");
baseUrl = baseUrl.replace(/\/k$/i, "");

function cell(rec, code) {
  return rec[code]?.value ?? "";
}

async function fetchAllRecords() {
  const fields = ["$id", FC_CATEGORY, FC_TITLE, FC_OVERVIEW, FC_PUBLISHED];
  const all = [];
  for (let off = 0; off < 50000; off += 500) {
    const u = new URL(`${baseUrl}/k/v1/records.json`);
    u.searchParams.set("app", String(APP));
    u.searchParams.set(
      "query",
      `order by ${FC_PUBLISHED} desc, レコード番号 desc limit 500 offset ${off}`,
    );
    fields.forEach((f, i) => u.searchParams.set(`fields[${i}]`, f));
    const res = await fetch(u, { headers: buildAuthHeaders() });
    const j = await res.json();
    if (!res.ok) throw new Error(`GET records: ${j.code} ${j.message}`);
    const recs = j.records || [];
    all.push(...recs);
    if (recs.length < 500) break;
  }
  return all;
}

function isTargetRecord(rec, includeTopic) {
  const cat = String(cell(rec, FC_CATEGORY)).trim();
  if (cat === DEPRECATED_AI_LLM_CATEGORY) return { reason: "category" };
  if (!includeTopic) return null;
  const title = String(cell(rec, FC_TITLE));
  const overview = String(cell(rec, FC_OVERVIEW));
  if (isAiLlmTopicText(title, overview)) return { reason: "topic" };
  return null;
}

async function deleteIds(ids) {
  for (let i = 0; i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK);
    const res = await fetch(`${baseUrl}/k/v1/records.json`, {
      method: "DELETE",
      headers: jsonHeaders(),
      body: JSON.stringify({
        app: APP,
        ids: slice,
      }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(`DELETE records: ${j.code} ${j.message}`);
    console.log(`[685] 削除 ${i + 1}〜${i + slice.length} / ${ids.length}`);
  }
}

async function main() {
  const dryRun = !process.argv.includes("--apply");
  const includeTopic = process.argv.includes("--include-topic");
  if (!dryRun && !process.argv.includes("--apply")) {
    console.error("本番削除は --apply を付けて実行してください。");
    process.exit(1);
  }

  console.log(
    `[685] AI記事一括削除 app=${APP} mode=${dryRun ? "dry-run" : "APPLY"} includeTopic=${includeTopic}`,
  );

  const all = await fetchAllRecords();
  console.log(`[685] 全レコード取得: ${all.length} 件`);

  const targets = [];
  for (const rec of all) {
    const hit = isTargetRecord(rec, includeTopic);
    if (hit) {
      targets.push({
        id: Number(rec.$id.value),
        reason: hit.reason,
        category: cell(rec, FC_CATEGORY),
        published: cell(rec, FC_PUBLISHED),
        title: String(cell(rec, FC_TITLE)).slice(0, 100),
      });
    }
  }

  const byCat = targets.filter((t) => t.reason === "category").length;
  const byTopic = targets.filter((t) => t.reason === "topic").length;
  console.log(
    `[685] 削除対象: ${targets.length} 件（category=${byCat} topic=${byTopic}）`,
  );
  for (const t of targets.slice(0, 30)) {
    console.log(`  - $id=${t.id} [${t.reason}] ${t.published} ${t.category} | ${t.title}`);
  }
  if (targets.length > 30) {
    console.log(`  … 他 ${targets.length - 30} 件`);
  }

  if (!targets.length) {
    console.log("[685] 削除対象なし。終了。");
    return;
  }

  if (dryRun) {
    console.error("[685] dry-run: DELETE していません。実行するには --apply を付けてください。");
    return;
  }

  const ids = targets.map((t) => t.id);
  await deleteIds(ids);
  console.log(`[685] 削除完了: ${ids.length} 件`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
