#!/usr/bin/env node
/**
 * スペース 48 周辺の kintone アプリを REST でヘルスチェックし、Markdown レポートを出力する。
 * 既定でアプリ 631（Security NEXT ニュース）・632（週次要約）を検査する。
 *
 * 環境変数:
 *   KINTONE_DOMAIN（必須・ホスト名のみ）
 *   トークン（いずれか）: KINTONE_API_TOKEN_COLLECT / KINTONE_API_TOKEN_ANALYZE / KINTONE_API_TOKEN
 *   KINTONE_API_TOKEN がカンマ区切りのときは各トークンを順に試す
 *   SPACE_HEALTH_APP_IDS（任意）カンマ区切り。省略時は 631,632
 *   KINTONE_BASE_URL（任意）表示用。省略時は https://{domain}
 *
 * GitHub Actions: GITHUB_STEP_SUMMARY があれば同内容を追記する。
 */
import "dotenv/config";
import { appendFileSync } from "node:fs";

/** @type {{ id: string; name: string; path: string; expectedFields?: string[] }[]} */
const DEFAULT_APPS = [
  {
    id: "631",
    name: "Security NEXT ニュース（収集）",
    path: "/k/631/",
    expectedFields: [
      "title", "article_url", "published_date", "summary", "digest",
      "match_keywords_display", "internal_match_meta_json", "internal_source",
      "internal_gemini_mark", "needs_review", "internal_severity_tier",
    ],
  },
  {
    id: "632",
    name: "ニュース週次要約（週次 LLM）",
    path: "/k/632/",
    expectedFields: [
      "target_week", "weekly_trend", "summary_one_line",
      "internal_ref_news_count", "internal_ref_record_id_min",
      "internal_ref_record_id_max", "internal_analysis_run_at",
      "internal_github_run_id",
    ],
  },
];

function requireDomain() {
  const d = process.env.KINTONE_DOMAIN?.trim();
  if (d) return d.replace(/^https?:\/\//i, "").split("/")[0].replace(/\/$/, "");
  const base = process.env.KINTONE_BASE_URL?.trim();
  if (base) {
    try {
      return new URL(base.startsWith("http") ? base : `https://${base}`).hostname;
    } catch {
      /* fall through */
    }
  }
  throw new Error("KINTONE_DOMAIN または KINTONE_BASE_URL が必要です。");
}

/** @returns {string[]} */
function collectTokens() {
  const out = [];
  const pushUnique = (t) => {
    const s = String(t).trim();
    if (s && !out.includes(s)) out.push(s);
  };
  const collect = process.env.KINTONE_API_TOKEN_COLLECT?.trim();
  const analyze = process.env.KINTONE_API_TOKEN_ANALYZE?.trim();
  const legacy = process.env.KINTONE_API_TOKEN?.trim();
  if (collect) pushUnique(collect);
  if (analyze) pushUnique(analyze);
  if (legacy) {
    if (legacy.includes(",")) {
      for (const p of legacy.split(",")) pushUnique(p);
    } else {
      pushUnique(legacy);
    }
  }
  if (out.length === 0) {
    throw new Error(
      "API トークンがありません。KINTONE_API_TOKEN_COLLECT / KINTONE_API_TOKEN_ANALYZE / KINTONE_API_TOKEN のいずれかを設定してください。",
    );
  }
  return out;
}

/**
 * @param {string} domain
 * @param {string} token
 * @param {string} appId
 */
async function fetchAppJson(domain, token, appId) {
  const url = `https://${domain}/k/v1/app.json?id=${encodeURIComponent(appId)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "X-Cybozu-API-Token": token },
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  return { ok: res.ok, status: res.status, json, text: text.slice(0, 400) };
}

/** フォームフィールドを取得して期待フィールドの存在を検証する */
async function checkExpectedFields(domain, token, appId, expectedFields) {
  if (!expectedFields || expectedFields.length === 0) return { checked: false };
  const url = `https://${domain}/k/v1/app/form/fields.json?app=${encodeURIComponent(appId)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "X-Cybozu-API-Token": token },
  });
  if (!res.ok) return { checked: true, missing: [], error: `fields API ${res.status}` };
  let json;
  try {
    json = JSON.parse(await res.text());
  } catch {
    return { checked: true, missing: [], error: "fields JSON parse error" };
  }
  const existing = new Set(Object.keys(json.properties || {}));
  const missing = expectedFields.filter((f) => !existing.has(f));
  return { checked: true, missing, error: null };
}

/** レコード閲覧権限のみのトークン向け（app.json が 403 のとき） */
async function fetchRecordsProbe(domain, token, appId) {
  const url = new URL(`https://${domain}/k/v1/records.json`);
  url.searchParams.set("app", appId);
  url.searchParams.set("totalCount", "true");
  url.searchParams.set("query", "$id > 0 order by $id desc limit 1");
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "X-Cybozu-API-Token": token },
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  return { ok: res.ok, status: res.status, json, text: text.slice(0, 400) };
}

function displayBaseUrl(domain) {
  const raw = process.env.KINTONE_BASE_URL?.trim();
  if (raw) {
    const u = raw.startsWith("http") ? raw : `https://${raw}`;
    return u.replace(/\/+$/, "");
  }
  return `https://${domain}`;
}

function parseAppIds() {
  const raw = process.env.SPACE_HEALTH_APP_IDS?.trim();
  if (!raw) return DEFAULT_APPS;
  const ids = raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s));
  if (ids.length === 0) return DEFAULT_APPS;
  return ids.map((id) => {
    const d = DEFAULT_APPS.find((a) => a.id === id);
    return d || { id, name: `App ${id}`, path: `/k/${id}/` };
  });
}

async function main() {
  const domain = requireDomain();
  const tokens = collectTokens();
  const apps = parseAppIds();
  const base = displayBaseUrl(domain);

  const now = new Date().toISOString();
  const lines = [];
  lines.push(`## システムヘルスチェック（kintone）`);
  lines.push("");
  lines.push(`- **実行時刻（UTC）**: ${now}`);
  lines.push(`- **ドメイン**: \`${domain}\``);
  lines.push(`- **検査アプリ数**: ${apps.length}`);
  lines.push("");
  lines.push("| アプリID | 論理名 | ポータルURL | API | フィールド | 備考 |");
  lines.push("| --- | --- | --- | --- | --- | --- |");

  let allOk = true;

  for (const app of apps) {
    const portalUrl = `${base}${app.path}`;
    let best = { ok: false, status: 0, name: "", detail: "" };
    let successToken = null;
    for (const tok of tokens) {
      const r = await fetchAppJson(domain, tok, app.id);
      if (r.ok && r.json?.name) {
        best = { ok: true, status: r.status, name: String(r.json.name), detail: "" };
        successToken = tok;
        break;
      }
      if (r.status === 403 || r.status === 401) {
        const rec = await fetchRecordsProbe(domain, tok, app.id);
        if (rec.ok) {
          best = {
            ok: true,
            status: rec.status,
            name: "",
            detail: "records API（app.json は権限外）",
          };
          successToken = tok;
          break;
        }
        best = {
          ok: false,
          status: rec.status,
          name: "",
          detail: rec.json?.message || rec.text || r.json?.message || r.text || "",
        };
        continue;
      }
      best = {
        ok: r.ok,
        status: r.status,
        name: r.json?.name ? String(r.json.name) : "",
        detail: r.json?.message || r.text || "",
      };
    }
    if (!best.ok) allOk = false;

    let fieldCell = "—";
    if (best.ok && successToken && app.expectedFields?.length) {
      const fc = await checkExpectedFields(domain, successToken, app.id, app.expectedFields);
      if (fc.checked) {
        if (fc.error) {
          fieldCell = `検証不可 (${fc.error})`;
        } else if (fc.missing.length === 0) {
          fieldCell = `OK (${app.expectedFields.length}/${app.expectedFields.length})`;
        } else {
          fieldCell = `**欠落${fc.missing.length}件**: ${fc.missing.join(", ")}`;
          allOk = false;
        }
      }
    }

    const apiCell = best.ok ? `OK (${best.status})` : `**NG** (${best.status})`;
    const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
    const noteCell = best.ok
      ? best.name
        ? `kintone名: ${esc(best.name)}`
        : "—"
      : esc((best.detail || "権限・トークン・アプリIDを確認").slice(0, 160));
    lines.push(
      `| ${app.id} | ${esc(app.name)} | [開く](${portalUrl}) | ${apiCell} | ${fieldCell} | ${noteCell} |`,
    );
  }

  lines.push("");
  lines.push("### 参照");
  lines.push("");
  lines.push("- アプリ正: リポジトリ直下 `kintone-apps.md`");
  lines.push("- メンテ手順: `docs/maintenance-template.md`（一気通貫メンテ・プレイブック）");
  lines.push("");

  const report = lines.join("\n");
  console.log(report);

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    try {
      appendFileSync(summaryPath, `\n${report}\n`, "utf8");
    } catch (e) {
      console.warn("[space-health-report] GITHUB_STEP_SUMMARY 追記に失敗:", e);
    }
  }

  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error("[space-health-report]", e);
  process.exit(1);
});
