#!/usr/bin/env node
/**
 * kintone アプリを REST でヘルスチェックし、Markdown レポートを出力する。
 *
 * 認証（優先順）:
 *   1. KINTONE_USERNAME + KINTONE_PASSWORD → X-Cybozu-Authorization（案A・推奨）
 *      任意: KINTONE_BASIC_AUTH_USERNAME / KINTONE_BASIC_AUTH_PASSWORD
 *   2. API トークン: KINTONE_API_TOKEN_COLLECT / KINTONE_API_TOKEN_ANALYZE / KINTONE_API_TOKEN
 *
 * 検査対象アプリ:
 *   - SPACE_HEALTH_APP_IDS があればカンマ区切りの ID のみ
 *   - パスワード認証かつ SPACE_HEALTH_USE_KINTONE_APPS_MD が false でないとき:
 *     `kintone-apps.md` の「## アプリ一覧」表から ID を自動抽出（594,595,…）
 *   - 上記以外: 既定 631,632
 *
 * 環境変数:
 *   KINTONE_DOMAIN（必須・ホスト名のみ）または KINTONE_BASE_URL
 *   KINTONE_APPS_MD_PATH（任意）kintone-apps.md の絶対パス
 *   KINTONE_API_TOKEN がカンマ区切りのときは各トークンを順に試す（トークン認証時のみ）
 *
 * GitHub Actions: GITHUB_STEP_SUMMARY があれば同内容を追記する。
 *
 * kintone スペース 48 等への自動反映（任意）:
 *   KINTONE_SPACE_HEALTH_SPACE_ID を設定し、更新対象の HTML（ポータル or 既定スレッド）に
 *   <!-- JBIS_SPACE_HEALTH_AUTO_START --> / END マーカーを挟む。
 *   パスワード認証（KINTONE_USERNAME + KINTONE_PASSWORD）必須。
 */
import "dotenv/config";
import { appendFileSync, readFileSync, existsSync } from "node:fs";
import { pushReportToSpacePortal } from "./space-health-push-space-body.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
    // 本番テナントでは Phase1 全フィールド未移行の場合があるため、
    // analyze が投稿に使う最小セットのみ検証する（不足は別タスクでフォーム整備）。
    expectedFields: ["target_week", "weekly_trend"],
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

/** @returns {Record<string, string> | null} */
function passwordAuthHeaders() {
  const user = process.env.KINTONE_USERNAME?.trim();
  const pass = process.env.KINTONE_PASSWORD?.trim();
  if (!user || !pass) return null;
  const headers = {
    "X-Cybozu-Authorization": Buffer.from(`${user}:${pass}`, "utf8").toString("base64"),
  };
  if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
    const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
    const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
    headers.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, "utf8").toString("base64")}`;
  }
  return headers;
}

/** @returns {string[]} */
function collectTokensOptional() {
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
  return out;
}

function requireTokensIfNoPassword(pwHeaders) {
  if (pwHeaders) return collectTokensOptional();
  const tokens = collectTokensOptional();
  if (tokens.length === 0) {
    throw new Error(
      "認証情報がありません。案A: KINTONE_USERNAME + KINTONE_PASSWORD を設定するか、" +
        "従来どおり KINTONE_API_TOKEN_COLLECT / KINTONE_API_TOKEN_ANALYZE / KINTONE_API_TOKEN のいずれかを設定してください。",
    );
  }
  return tokens;
}

/**
 * @param {string} domain
 * @param {Record<string, string>} headers
 * @param {string} appId
 */
async function fetchAppJsonWithHeaders(domain, headers, appId) {
  const url = `https://${domain}/k/v1/app.json?id=${encodeURIComponent(appId)}`;
  const res = await fetch(url, { method: "GET", headers });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  return { ok: res.ok, status: res.status, json, text: text.slice(0, 400) };
}

/**
 * @param {string} domain
 * @param {string} token
 * @param {string} appId
 */
async function fetchAppJson(domain, token, appId) {
  return fetchAppJsonWithHeaders(domain, { "X-Cybozu-API-Token": token }, appId);
}

/** フォームフィールドを取得して期待フィールドの存在を検証する */
async function checkExpectedFieldsWithHeaders(domain, headers, appId, expectedFields) {
  if (!expectedFields || expectedFields.length === 0) return { checked: false };
  const url = `https://${domain}/k/v1/app/form/fields.json?app=${encodeURIComponent(appId)}`;
  const res = await fetch(url, { method: "GET", headers });
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

async function checkExpectedFields(domain, token, appId, expectedFields) {
  return checkExpectedFieldsWithHeaders(domain, { "X-Cybozu-API-Token": token }, appId, expectedFields);
}

async function fetchRecordsProbeWithHeaders(domain, headers, appId) {
  const url = new URL(`https://${domain}/k/v1/records.json`);
  url.searchParams.set("app", appId);
  url.searchParams.set("totalCount", "true");
  url.searchParams.set("query", "$id > 0 order by $id desc limit 1");
  const res = await fetch(url.toString(), { method: "GET", headers });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  return { ok: res.ok, status: res.status, json, text: text.slice(0, 400) };
}

async function fetchRecordsProbe(domain, token, appId) {
  return fetchRecordsProbeWithHeaders(domain, { "X-Cybozu-API-Token": token }, appId);
}

/** JST の境界を kintone レコードクエリ用リテラルにする（+09:00 固定） */
function toKintoneJstDatetimeLiteral(d) {
  const s = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
  return `${s.replace(" ", "T")}+09:00`;
}

/**
 * @param {string} domain
 * @param {Record<string, string>} headers
 * @param {string} appId
 * @param {string} query
 */
async function fetchRecordsWithTotalCount(domain, headers, appId, query) {
  const url = new URL(`https://${domain}/k/v1/records.json`);
  url.searchParams.set("app", appId);
  url.searchParams.set("totalCount", "true");
  url.searchParams.set("query", query);
  url.searchParams.set("size", "1");
  const res = await fetch(url.toString(), { method: "GET", headers });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  const raw = json?.totalCount;
  const totalCount = raw != null && !Number.isNaN(Number(raw)) ? Number(raw) : null;
  return {
    ok: res.ok,
    status: res.status,
    json,
    totalCount,
    records: json?.records || [],
    message: json?.message,
  };
}

/** @param {Record<string, unknown>} rec */
function pickLatestUpdatedLiteral(rec) {
  const keys = ["更新日時", "Updated_datetime", "updated_time", "Modified_datetime"];
  for (const k of keys) {
    const o = rec[k];
    const v = o && typeof o === "object" && o !== null && "value" in o ? String(/** @type {{ value?: unknown }} */ (o).value ?? "") : "";
    if (/\d{4}-\d{2}-\d{2}T/.test(v)) return v;
  }
  for (const [k, o] of Object.entries(rec)) {
    if (k.startsWith("$")) continue;
    const v = o && typeof o === "object" && o !== null && "value" in o ? String(/** @type {{ value?: unknown }} */ (o).value ?? "") : "";
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) return v;
  }
  return null;
}

/** @param {string} iso */
function formatDisplayJst(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.length > 16 ? iso.slice(0, 16) : iso;
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

/**
 * レコード総数・直近24hの更新件数・直近レコードの更新日時表示
 * @param {string} domain
 * @param {Record<string, string>} headers
 * @param {string} appId
 */
async function fetchAppStatsWithHeaders(domain, headers, appId) {
  const totalRes = await fetchRecordsWithTotalCount(domain, headers, appId, "$id > 0 limit 1");
  const total =
    totalRes.ok && totalRes.totalCount != null && !Number.isNaN(totalRes.totalCount) ? totalRes.totalCount : null;

  const since = toKintoneJstDatetimeLiteral(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const updateQueries = [`更新日時 >= "${since}"`, `Updated_datetime >= "${since}"`];
  /** @type {number | null} */
  let updated24h = null;
  for (const q of updateQueries) {
    const r = await fetchRecordsWithTotalCount(domain, headers, appId, `${q} limit 1`);
    if (r.ok && r.totalCount != null && !Number.isNaN(r.totalCount)) {
      updated24h = r.totalCount;
      break;
    }
  }

  /** @type {string | null} */
  let lastLit = null;
  const orderQueries = ["$id > 0 order by 更新日時 desc limit 1", "$id > 0 order by $id desc limit 1"];
  for (const q of orderQueries) {
    const url = new URL(`https://${domain}/k/v1/records.json`);
    url.searchParams.set("app", appId);
    url.searchParams.set("query", q);
    url.searchParams.set("size", "1");
    const res = await fetch(url.toString(), { method: "GET", headers });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* noop */
    }
    const rec = json?.records?.[0];
    if (res.ok && rec) {
      lastLit = pickLatestUpdatedLiteral(rec);
      if (lastLit) break;
    }
  }

  return {
    total,
    updated24h,
    lastUpdatedDisplay: lastLit ? formatDisplayJst(lastLit) : "—",
  };
}

function resolveKintoneAppsMdPath() {
  const fromEnv = process.env.KINTONE_APPS_MD_PATH?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.join(__dirname, "..", "kintone-apps.md");
}

/** 「## アプリ一覧」セクションの表から 2 列目のアプリ ID を抽出 */
function parseAppIdsFromKintoneAppsMd(md) {
  const lines = md.split(/\r?\n/);
  let inSection = false;
  const ids = [];
  for (const line of lines) {
    if (line.startsWith("## アプリ一覧")) {
      inSection = true;
      continue;
    }
    if (inSection && line.startsWith("## ")) break;
    if (!inSection) continue;
    const m = line.match(/^\|\s*.+?\|\s*(?:\*\*)?(\d{3,4})(?:\*\*)?\s*\|/);
    if (m) ids.push(m[1]);
  }
  return [...new Set(ids)].sort((a, b) => Number(a) - Number(b));
}

function appsFromIds(ids) {
  return ids.map((id) => {
    const d = DEFAULT_APPS.find((a) => a.id === id);
    return d || { id, name: `App ${id}`, path: `/k/${id}/` };
  });
}

function parseAppIds() {
  const raw = process.env.SPACE_HEALTH_APP_IDS?.trim();
  if (!raw) return null;
  const ids = raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s));
  return ids.length ? appsFromIds(ids) : null;
}

function resolveApps(pwHeaders) {
  const manual = parseAppIds();
  if (manual) return manual;

  const useMd = process.env.SPACE_HEALTH_USE_KINTONE_APPS_MD !== "0"
    && process.env.SPACE_HEALTH_USE_KINTONE_APPS_MD !== "false";
  if (pwHeaders && useMd) {
    const mdPath = resolveKintoneAppsMdPath();
    if (existsSync(mdPath)) {
      const md = readFileSync(mdPath, "utf8");
      const ids = parseAppIdsFromKintoneAppsMd(md);
      if (ids.length > 0) return appsFromIds(ids);
    }
  }
  return DEFAULT_APPS;
}

async function main() {
  const domain = requireDomain();
  const pwHeaders = passwordAuthHeaders();
  const tokens = requireTokensIfNoPassword(pwHeaders);
  const apps = resolveApps(pwHeaders);

  const now = new Date().toISOString();
  const lines = [];
  lines.push(`## システムヘルスチェック（kintone）`);
  lines.push("");
  lines.push(`- **実行時刻（UTC）**: ${now}`);
  lines.push(`- **ドメイン**: \`${domain}\``);
  lines.push(`- **認証**: ${pwHeaders ? "パスワード（X-Cybozu-Authorization）" : `API トークン（最大 ${tokens.length} 個を試行）`}`);
  lines.push(`- **検査アプリ数**: ${apps.length}`);
  if (pwHeaders && !process.env.SPACE_HEALTH_APP_IDS?.trim()) {
    lines.push(`- **アプリ一覧の出所**: \`kintone-apps.md\` の「## アプリ一覧」表（SPACE_HEALTH_USE_KINTONE_APPS_MD=0 で無効化可）`);
  }
  lines.push("");
  lines.push("| App ID | アプリ名 | レコード数 | 24h変動 | ステータス | 最終更新 |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  lines.push(
    "- **24h変動**: 各アプリの「更新日時」（または `Updated_datetime`）が直近24時間以内のレコード件数。算出不可時は — 。",
  );
  lines.push(
    "- **最終更新**: 取得できた範囲で最新の更新日時（`$id` 降順で拾えない場合は — ）。",
  );
  lines.push("");

  let allOk = true;

  for (const app of apps) {
    let best = { ok: false, status: 0, name: "", detail: "" };
    let successToken = null;

    if (pwHeaders) {
      const r = await fetchAppJsonWithHeaders(domain, pwHeaders, app.id);
      if (r.ok && r.json?.name) {
        best = { ok: true, status: r.status, name: String(r.json.name), detail: "" };
      } else if (r.status === 403 || r.status === 401) {
        const rec = await fetchRecordsProbeWithHeaders(domain, pwHeaders, app.id);
        if (rec.ok) {
          best = { ok: true, status: rec.status, name: "", detail: "records API（app.json は権限外）" };
        } else {
          best = {
            ok: false,
            status: rec.status,
            name: "",
            detail: rec.json?.message || rec.text || r.json?.message || r.text || "",
          };
        }
      } else {
        best = {
          ok: r.ok,
          status: r.status,
          name: r.json?.name ? String(r.json.name) : "",
          detail: r.json?.message || r.text || "",
        };
      }

      if (!best.ok) allOk = false;

      /** @type {{ checked: boolean; missing?: string[]; error?: string | null }} */
      let fc = { checked: false, missing: [], error: null };
      if (best.ok && app.expectedFields?.length) {
        fc = await checkExpectedFieldsWithHeaders(domain, pwHeaders, app.id, app.expectedFields);
        if (fc.checked && !fc.error && fc.missing.length > 0) allOk = false;
      }

      const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
      const displayName = best.ok && best.name ? best.name : app.name;
      const fieldWarn = Boolean(fc.checked && !fc.error && fc.missing && fc.missing.length > 0);
      const statusJa = !best.ok ? "異常" : fieldWarn ? "警告" : "正常";

      let stats = { total: /** @type {number | null} */ (null), updated24h: /** @type {number | null} */ (null), lastUpdatedDisplay: "—" };
      if (best.ok) {
        try {
          stats = await fetchAppStatsWithHeaders(domain, pwHeaders, app.id);
        } catch {
          /* keep defaults */
        }
      }

      const recCell = stats.total != null ? String(stats.total) : "—";
      const h24Cell = stats.updated24h != null ? String(stats.updated24h) : "—";
      lines.push(
        `| ${app.id} | ${esc(displayName)} | ${recCell} | ${h24Cell} | ${statusJa} | ${esc(stats.lastUpdatedDisplay)} |`,
      );
      continue;
    }

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

    /** @type {{ checked: boolean; missing?: string[]; error?: string | null }} */
    let fc = { checked: false, missing: [], error: null };
    if (best.ok && successToken && app.expectedFields?.length) {
      fc = await checkExpectedFields(domain, successToken, app.id, app.expectedFields);
      if (fc.checked && !fc.error && fc.missing.length > 0) allOk = false;
    }

    const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
    const displayName = best.ok && best.name ? best.name : app.name;
    const fieldWarn = Boolean(fc.checked && !fc.error && fc.missing && fc.missing.length > 0);
    const statusJa = !best.ok ? "異常" : fieldWarn ? "警告" : "正常";

    let stats = { total: /** @type {number | null} */ (null), updated24h: /** @type {number | null} */ (null), lastUpdatedDisplay: "—" };
    if (best.ok && successToken) {
      try {
        stats = await fetchAppStatsWithHeaders(domain, { "X-Cybozu-API-Token": successToken }, app.id);
      } catch {
        /* keep defaults */
      }
    }

    const recCell = stats.total != null ? String(stats.total) : "—";
    const h24Cell = stats.updated24h != null ? String(stats.updated24h) : "—";
    lines.push(
      `| ${app.id} | ${esc(displayName)} | ${recCell} | ${h24Cell} | ${statusJa} | ${esc(stats.lastUpdatedDisplay)} |`,
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

  let spacePushOk = true;
  const spaceIdForPush = process.env.KINTONE_SPACE_HEALTH_SPACE_ID?.trim();
  if (spaceIdForPush) {
    const pushResult = await pushReportToSpacePortal({
      domain,
      pwHeaders,
      reportMd: report,
      summaryPath,
    });
    if (!pushResult.skipped && !pushResult.ok) {
      spacePushOk = false;
      if (summaryPath) {
        try {
          appendFileSync(
            summaryPath,
            `\n### kintone スペース本文の自動反映\n**失敗**: ${pushResult.message}\n`,
            "utf8",
          );
        } catch {
          /* noop */
        }
      }
    } else if (!pushResult.skipped && pushResult.ok && summaryPath) {
      try {
        appendFileSync(summaryPath, `\n### kintone スペース本文の自動反映\n${pushResult.message}\n`, "utf8");
      } catch {
        /* noop */
      }
    }
  }

  process.exit(allOk && spacePushOk ? 0 : 1);
}

main().catch((e) => {
  console.error("[space-health-report]", e);
  process.exit(1);
});
