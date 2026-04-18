/**
 * space-health-report 実行後に、kintone スペースのポータル／スレッド本文（HTML）へ
 * ヘルスレポートを自動反映する。
 *
 * 対象:
 *   - マルチスレッド: PUT /k/v1/space/body.json（ポータル本文）
 *   - シングルスレッド: PUT /k/v1/space/thread.json（既定スレッド本文）
 *
 * 認証: X-Cybozu-Authorization（KINTONE_USERNAME + KINTONE_PASSWORD）必須。
 *       外側 Basic は space-health-report と同じ headers を渡す。
 *
 * 環境変数:
 *   KINTONE_SPACE_HEALTH_SPACE_ID … 例: 48
 *   SPACE_HEALTH_KINTONE_PUSH_RETRIES … 既定 3（429/5xx 時に指数バックオフ）
 *   SPACE_HEALTH_KINTONE_BODY_MAX_CHARS … 既定 62000（kintone 上限 65535 の余裕）
 *
 * マーカー（いずれか 1 組を**この順**で本文に含める）:
 *   A: HTML コメント `<!-- JBIS_SPACE_HEALTH_AUTO_START -->` … `END`
 *   B: リッチテキストのみのとき用のプレーンマーカー `[[JBIS-SPACE-HEALTH-AUTO-START]]` … `END`
 *   C: kintone がコメントをエスケープして保存した場合の `&lt;!-- … --&gt;` 形式（A と同文言）
 */

import { healthReportMarkdownToHtml } from "./lib/health-report-md-to-html.mjs";

/** @param {string} s */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const SPACE_HEALTH_MARKER_START = "<!-- JBIS_SPACE_HEALTH_AUTO_START -->";
export const SPACE_HEALTH_MARKER_END = "<!-- JBIS_SPACE_HEALTH_AUTO_END -->";

/** リッチテキストのみ（HTML ソース切替がない）環境向け。画面上に短く表示される。 */
export const SPACE_HEALTH_MARKER_VISIBLE_START = "[[JBIS-SPACE-HEALTH-AUTO-START]]";
export const SPACE_HEALTH_MARKER_VISIBLE_END = "[[JBIS-SPACE-HEALTH-AUTO-END]]";

/** @param {string} s */
function escapeHtmlEntityMarkers(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * 本文に含まれるマーカー組を 1 つ選ぶ（先頭から優先）。
 * @param {string} body
 * @returns {{ start: string; end: string } | null}
 */
function resolveMarkerPair(body) {
  const candidates = [
    { start: SPACE_HEALTH_MARKER_START, end: SPACE_HEALTH_MARKER_END },
    {
      start: escapeHtmlEntityMarkers(SPACE_HEALTH_MARKER_START),
      end: escapeHtmlEntityMarkers(SPACE_HEALTH_MARKER_END),
    },
    {
      start: SPACE_HEALTH_MARKER_VISIBLE_START,
      end: SPACE_HEALTH_MARKER_VISIBLE_END,
    },
  ];
  for (const { start, end } of candidates) {
    const i0 = body.indexOf(start);
    const i1 = body.indexOf(end);
    if (i0 !== -1 && i1 !== -1 && i0 < i1) return { start, end };
  }
  return null;
}

/** @param {string} domain */
function spaceApiOrigin(domain) {
  return `https://${domain}`;
}

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ retries?: number; baseDelayMs?: number; label?: string }} opts
 */
async function withRetry(fn, opts = {}) {
  const envN = Number(process.env.SPACE_HEALTH_KINTONE_PUSH_RETRIES ?? "3");
  const retries = opts.retries ?? (Number.isFinite(envN) && envN > 0 ? envN : 3);
  const base = opts.baseDelayMs ?? 1500;
  const label = opts.label ?? "request";
  let lastErr = /** @type {unknown} */ (null);
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < retries - 1) {
        const d = base * 2 ** attempt;
        console.warn(`[space-health-push-space-body] ${label} retry ${attempt + 1}/${retries} after ${d}ms`, e);
        await new Promise((r) => setTimeout(r, d));
      }
    }
  }
  throw lastErr;
}

/**
 * @param {string} domain
 * @param {Record<string, string>} headers
 * @param {string|number} spaceId
 */
async function getSpace(domain, headers, spaceId) {
  return withRetry(async () => {
    const url = `${spaceApiOrigin(domain)}/k/v1/space.json?id=${encodeURIComponent(String(spaceId))}`;
    const res = await fetch(url, { method: "GET", headers: { ...headers } });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* noop */
    }
    if (!res.ok && (res.status === 429 || res.status >= 500)) {
      throw new Error(`getSpace HTTP ${res.status}`);
    }
    return { ok: res.ok, status: res.status, json, text: text.slice(0, 500) };
  }, { label: "getSpace" });
}

/**
 * @param {string} domain
 * @param {Record<string, string>} headers
 * @param {string|number} threadId
 */
async function getThread(domain, headers, threadId) {
  return withRetry(async () => {
    const url = `${spaceApiOrigin(domain)}/k/v1/space/thread.json?id=${encodeURIComponent(String(threadId))}`;
    const res = await fetch(url, { method: "GET", headers: { ...headers } });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* noop */
    }
    if (!res.ok && (res.status === 429 || res.status >= 500)) {
      throw new Error(`getThread HTTP ${res.status}`);
    }
    return { ok: res.ok, status: res.status, json, text: text.slice(0, 500) };
  }, { label: "getThread" });
}

/**
 * @param {string} domain
 * @param {Record<string, string>} headers
 * @param {string|number} spaceId
 * @param {string} bodyHtml
 */
async function putSpaceBody(domain, headers, spaceId, bodyHtml) {
  return withRetry(async () => {
    const url = `${spaceApiOrigin(domain)}/k/v1/space/body.json`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ id: spaceId, body: bodyHtml }),
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* noop */
    }
    if (!res.ok && (res.status === 429 || res.status >= 500)) {
      throw new Error(`putSpaceBody HTTP ${res.status}`);
    }
    return { ok: res.ok, status: res.status, json, text: text.slice(0, 800) };
  }, { label: "putSpaceBody" });
}

/**
 * @param {string} domain
 * @param {Record<string, string>} headers
 * @param {string|number} threadId
 * @param {string} bodyHtml
 */
async function putThreadBody(domain, headers, threadId, bodyHtml) {
  return withRetry(async () => {
    const url = `${spaceApiOrigin(domain)}/k/v1/space/thread.json`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ id: threadId, body: bodyHtml }),
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* noop */
    }
    if (!res.ok && (res.status === 429 || res.status >= 500)) {
      throw new Error(`putThreadBody HTTP ${res.status}`);
    }
    return { ok: res.ok, status: res.status, json, text: text.slice(0, 800) };
  }, { label: "putThreadBody" });
}

/**
 * @param {string} reportMd
 * @param {string} jstLabel
 */
function buildAutoBlockHtml(reportMd, jstLabel) {
  const reportHtml = healthReportMarkdownToHtml(reportMd);
  return (
    `<div class="jbis-space-health-auto" style="font-family:system-ui,'Segoe UI',sans-serif;max-width:100%;line-height:1.45">` +
    `<h2 style="font-size:18px;margin:0 0 10px">kintoneアプリ稼働確認用</h2>` +
    `<p style="font-size:14px;color:#334155;margin:0 0 6px">🤖 <strong>AI自動更新セクション</strong>（GitHub Actions <code>space-health-report</code>）</p>` +
    `<p style="font-size:14px;margin:0 0 12px"><strong>🤖 デイリーヘルスチェック</strong> <span style="color:#64748b">（更新: ${escapeHtml(jstLabel)}）</span></p>` +
    `<h3 style="font-size:16px;margin:16px 0 8px">📊 システムヘルスチェックレポート</h3>` +
    reportHtml +
    `<p style="font-size:11px;color:#94a3b8;margin:12px 0 0">このブロックは CI により上書きされます。手編集はマーカー外で行ってください。</p>` +
    `</div>`
  );
}

/**
 * @param {string} html
 * @param {number} maxChars
 */
function truncateReportInBlock(html, maxChars) {
  if (html.length <= maxChars) return html;
  const note =
    `<p style="color:#b45309;font-size:12px">（レポートが長いため ${maxChars} 文字で切り詰めました。全文は GitHub Actions のジョブサマリーを参照してください。）</p>`;
  return html.slice(0, Math.max(0, maxChars - note.length)) + note;
}

/**
 * @param {object} opts
 * @param {string} opts.domain
 * @param {Record<string, string> | null} opts.pwHeaders
 * @param {string} opts.reportMd
 * @param {string | undefined} opts.summaryPath
 * @returns {Promise<{ ok: boolean; skipped: boolean; message: string }>}
 */
export async function pushReportToSpacePortal(opts) {
  const rawId = process.env.KINTONE_SPACE_HEALTH_SPACE_ID?.trim();
  if (!rawId) {
    return { ok: true, skipped: true, message: "KINTONE_SPACE_HEALTH_SPACE_ID 未設定のためスキップ" };
  }
  if (!opts.pwHeaders) {
    const msg =
      "スペース本文の自動反映をスキップ: パスワード認証（KINTONE_USERNAME / KINTONE_PASSWORD）が必要です。";
    console.warn("[space-health-push-space-body]", msg);
    return { ok: true, skipped: true, message: msg };
  }

  const spaceId = rawId;
  const headers = opts.pwHeaders;
  const maxChars = Number(process.env.SPACE_HEALTH_KINTONE_BODY_MAX_CHARS ?? "62000") || 62000;

  let gs;
  try {
    gs = await getSpace(opts.domain, headers, spaceId);
  } catch (e) {
    const msg = `スペース取得が再試行後も失敗: ${e instanceof Error ? e.message : String(e)}`;
    console.error("[space-health-push-space-body]", msg);
    return { ok: false, skipped: false, message: msg };
  }
  if (!gs.ok || !gs.json) {
    const msg = `スペース取得に失敗: HTTP ${gs.status} ${gs.text || ""}`;
    console.error("[space-health-push-space-body]", msg);
    return { ok: false, skipped: false, message: msg };
  }

  const useMulti = gs.json.useMultiThread === true;
  const threadId = gs.json.defaultThread != null ? String(gs.json.defaultThread) : "";

  /** @type {"space"|"thread"} */
  let mode = "space";
  let oldBody = "";
  /** @type {((html: string) => Promise<{ ok: boolean; status: number; json: any; text: string }>) | null} */
  let doPut = null;

  if (useMulti) {
    oldBody = typeof gs.json.body === "string" ? gs.json.body : "";
    mode = "space";
    doPut = (html) => putSpaceBody(opts.domain, headers, spaceId, html);
  } else {
    if (!threadId) {
      const msg = "シングルスレッドスペースですが defaultThread が取得できませんでした。";
      console.error("[space-health-push-space-body]", msg);
      return { ok: false, skipped: false, message: msg };
    }
    let gt;
    try {
      gt = await getThread(opts.domain, headers, threadId);
    } catch (e) {
      const msg = `スレッド取得が再試行後も失敗: ${e instanceof Error ? e.message : String(e)}`;
      console.error("[space-health-push-space-body]", msg);
      return { ok: false, skipped: false, message: msg };
    }
    if (!gt.ok || !gt.json || typeof gt.json.body !== "string") {
      const msg = `シングルスレッド: スレッド本文を取得できません (HTTP ${gt.status})。threadId=${threadId}。GET /k/v1/space/thread.json が利用できないテナントの場合は別途相談ください。`;
      console.error("[space-health-push-space-body]", msg);
      return { ok: false, skipped: false, message: msg };
    }
    oldBody = gt.json.body;
    mode = "thread";
    doPut = (html) => putThreadBody(opts.domain, headers, threadId, html);
  }

  if (!doPut) {
    return { ok: false, skipped: false, message: "内部エラー: PUT ハンドラが未設定です。" };
  }

  const pair = resolveMarkerPair(oldBody);
  if (!pair) {
    const msg =
      "スペース／スレッド本文にマーカーが見つかりません。編集画面に次のいずれかを**この順**で挿入してください（間は空でも可）。\n" +
      `A) ${SPACE_HEALTH_MARKER_START}\n${SPACE_HEALTH_MARKER_END}\n` +
      `B) ${SPACE_HEALTH_MARKER_VISIBLE_START}\n${SPACE_HEALTH_MARKER_VISIBLE_END}\n` +
      `C) （HTML がエスケープされた保存）${escapeHtmlEntityMarkers(SPACE_HEALTH_MARKER_START)} … ${escapeHtmlEntityMarkers(SPACE_HEALTH_MARKER_END)}`;
    console.warn("[space-health-push-space-body]", msg);
    const hint =
      "\n### kintone スペースへの自動反映\n" +
      "HTML で編集できない場合は **B の [[…]] マーカー**を本文末尾に貼り付けて保存してください。次回 CI から置換されます。\n";
    if (opts.summaryPath) {
      try {
        const { appendFileSync } = await import("node:fs");
        appendFileSync(opts.summaryPath, hint, "utf8");
      } catch {
        /* noop */
      }
    }
    return { ok: true, skipped: true, message: msg };
  }

  const jstLabel = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const maxMdChars = Number(process.env.SPACE_HEALTH_REPORT_MD_MAX_CHARS ?? "48000") || 48000;
  let reportMd = opts.reportMd;
  if (reportMd.length > maxMdChars) {
    reportMd =
      reportMd.slice(0, maxMdChars) +
      "\n\n…（レポートが長いため省略。全文は GitHub Actions のジョブサマリー参照）…\n";
  }

  let inner = buildAutoBlockHtml(reportMd, jstLabel);
  inner = truncateReportInBlock(inner, maxChars);

  const { start, end } = pair;
  const escStart = start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escEnd = end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escStart}[\\s\\S]*?${escEnd}`, "m");
  if (!re.test(oldBody)) {
    const msg = "マーカーは存在しますが置換パターンに一致しませんでした（順序・重複を確認してください）。";
    console.error("[space-health-push-space-body]", msg);
    return { ok: false, skipped: false, message: msg };
  }
  let newBody = oldBody.replace(re, `${start}\n${inner}\n${end}`);
  newBody = truncateReportInBlock(newBody, 65500);

  let put;
  try {
    put = await doPut(newBody);
  } catch (e) {
    const msg = `本文更新が再試行後も失敗: ${e instanceof Error ? e.message : String(e)}`;
    console.error("[space-health-push-space-body]", msg);
    return { ok: false, skipped: false, message: msg };
  }

  if (!put.ok) {
    const msg = `本文の更新に失敗 (${mode}): HTTP ${put.status} ${put.json?.message || put.text || ""}`;
    console.error("[space-health-push-space-body]", msg);
    return { ok: false, skipped: false, message: msg };
  }

  console.log("[space-health-push-space-body] kintone 更新完了", { spaceId, mode, threadId: mode === "thread" ? threadId : undefined });
  return { ok: true, skipped: false, message: `スペース本文を更新しました（${mode === "thread" ? "スレッド" : "ポータル"}）` };
}
