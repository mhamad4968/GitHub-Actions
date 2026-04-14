/**
 * faq-portal-full.html 用 BFF (v2):
 *   - kintone REST API への中継（APIトークン認証）
 *   - 画像/ファイルアップロード → kintone ファイルAPI
 *   - kintone ファイルダウンロード中継 (GET /api/file/:fileKey)
 *   - 添付ファイル + 本文画像の保存対応
 *   - 静的ファイル配信（HTML ポータル本体を HTTP_PORT で配信）
 */
import "dotenv/config";
import express from "express";
import multer from "multer";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";

const DOMAIN = process.env.KINTONE_DOMAIN?.trim();
const APP = process.env.KINTONE_FAQ_APP_ID?.trim();
const TOKEN = process.env.KINTONE_API_TOKEN?.trim();
const KT_USER = process.env.KINTONE_USERNAME?.trim();
const KT_PASS = process.env.KINTONE_PASSWORD?.trim();
const PORT = Number(process.env.PORT || "3847");
const BIND = process.env.BIND_HOST?.trim() || "0.0.0.0";

function authHeaders() {
  if (TOKEN) return { "X-Cybozu-API-Token": TOKEN };
  if (KT_USER && KT_PASS) return { "X-Cybozu-Authorization": Buffer.from(`${KT_USER}:${KT_PASS}`).toString("base64") };
  return {};
}

const F = {
  recordType: process.env.FIELD_RECORD_TYPE || "record_type",
  question: process.env.FIELD_QUESTION || "question",
  answer: process.env.FIELD_ANSWER || "answer",
  category: process.env.FIELD_CATEGORY || "category",
  important: process.env.FIELD_IMPORTANT || "important",
  published: process.env.FIELD_PUBLISHED || "published",
  tags: process.env.FIELD_TAGS || "tags",
  attachment: "attachment",
  inlineImages: "inline_images",
};
const RT_FAQ = process.env.RECORD_TYPE_FAQ || "faq";
const RT_META = process.env.RECORD_TYPE_META || "meta";
const CB_YES = process.env.CHECKBOX_YES || "yes";
const CLIENT_ID_THRESHOLD = Number(process.env.CLIENT_ID_THRESHOLD || "10000000000");

const corsOrigins = (process.env.CORS_ORIGINS || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

function kintoneBase() {
  return `https://${DOMAIN}`;
}

async function kintoneGet(path, searchParams) {
  const u = new URL(kintoneBase() + path);
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (v != null && v !== "") u.searchParams.set(k, v);
    }
  }
  const res = await fetch(u.toString(), { headers: authHeaders() });
  const text = await res.text();
  if (!res.ok) throw new Error(`kintone HTTP ${res.status}: ${text.slice(0, 300)}`);
  try { return text ? JSON.parse(text) : {}; } catch { return { raw: text }; }
}

async function kintonePostJson(path, payload) {
  const res = await fetch(kintoneBase() + path, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`kintone HTTP ${res.status}: ${text.slice(0, 300)}`);
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

async function kintonePutJson(path, payload) {
  const res = await fetch(kintoneBase() + path, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`kintone HTTP ${res.status}: ${text.slice(0, 300)}`);
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

async function kintoneDeleteRecord(id) {
  const res = await fetch(
    `${kintoneBase()}/k/v1/records.json?app=${APP}&ids[0]=${id}`,
    { method: "DELETE", headers: authHeaders() }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`kintone DELETE ${res.status}: ${text.slice(0, 200)}`);
  }
}

async function kintoneUploadFile(buffer, filename, contentType) {
  const blob = new Blob([buffer], { type: contentType || "application/octet-stream" });
  const form = new FormData();
  form.append("file", blob, filename);
  const res = await fetch(`${kintoneBase()}/k/v1/file.json`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`kintone file upload ${res.status}: ${text.slice(0, 300)}`);
  const data = JSON.parse(text);
  return data.fileKey;
}

async function kintoneDownloadFile(fileKey) {
  const res = await fetch(
    `${kintoneBase()}/k/v1/file.json?fileKey=${encodeURIComponent(fileKey)}`,
    { headers: authHeaders() }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`kintone file download ${res.status}: ${text.slice(0, 200)}`);
  }
  return {
    contentType: res.headers.get("content-type") || "application/octet-stream",
    contentDisposition: res.headers.get("content-disposition") || "",
    body: res.body,
    buffer: Buffer.from(await res.arrayBuffer()),
  };
}

function normalizeTagsString(s) {
  if (s == null || s === "") return "";
  return String(s).split(",").map((t) => t.trim()).filter(Boolean).join(", ");
}

function parseCategoryField(raw) {
  if (!raw || !raw.includes("|")) return raw || "";
  const parts = raw.split("|").map((s) => s.trim());
  for (let i = parts.length - 1; i >= 1; i--) {
    if (parts[i]) return parts[i];
  }
  return parts[1] || "";
}

/** kintone の file.name が UTF-8 バイト列を Latin-1 として解釈した文字化けのとき修復 */
function repairKintoneFilename(name) {
  if (name == null || name === "") return name;
  const s = String(name);
  if (/[\u3040-\u309F\u30A0-\u30FF\u3005-\u9FFF\uFF66-\uFF9F]/.test(s)) return s;
  try {
    const t = Buffer.from(s, "latin1").toString("utf8");
    if (t !== s && /[\u3040-\u309F\u30A0-\u30FF\u3005-\u9FFF]/.test(t) && !t.includes("\uFFFD")) return t;
  } catch { /* noop */ }
  return s;
}

function addFilenameAliases(map, rawName, fileKey) {
  if (!fileKey) return;
  const rep = rawName ? repairKintoneFilename(rawName) : "";
  for (const nm of new Set([rawName, rep].filter(Boolean))) {
    if (!map[nm]) map[nm] = [];
    if (!map[nm].includes(fileKey)) map[nm].push(fileKey);
  }
}

const IMG_MARKER_RE_INLINE = /!\[([^\]]*)\]\(file:([^)\s]+)\)/g;

function recordToFaq(rec) {
  const r = rec.record || rec;
  const id = Number(r.$id?.value);
  const impField = r[F.important]?.value;
  const pubField = r[F.published]?.value;
  const imp = Array.isArray(impField) ? impField.includes(CB_YES) : impField === CB_YES;
  const published = Array.isArray(pubField) ? pubField.includes(CB_YES) : pubField !== false && pubField !== "";
  const created = r.Created_datetime?.value ? new Date(r.Created_datetime.value).getTime() : id;
  const updated = r.Updated_datetime?.value ? new Date(r.Updated_datetime.value).getTime() : created;

  const rawInline = r[F.inlineImages]?.value || [];
  const rawAttach = r[F.attachment]?.value || [];
  const attachFiles = rawAttach.map((f) => ({
    fileKey: f.fileKey, name: repairKintoneFilename(f.name), size: f.size, contentType: f.contentType,
  }));
  const inlineFiles = rawInline.map((f) => ({
    fileKey: f.fileKey, name: repairKintoneFilename(f.name), size: f.size, contentType: f.contentType,
  }));

  const permKeySet = new Set(rawInline.map((f) => f.fileKey).concat(rawAttach.map((f) => f.fileKey)));
  const nameToPermKeys = {};
  for (const f of [...rawInline, ...rawAttach]) addFilenameAliases(nameToPermKeys, f.name, f.fileKey);

  let answer = r[F.answer]?.value || "";
  let needsFix = false;
  const markerCheck = new RegExp(IMG_MARKER_RE_INLINE.source, "g");
  let mc;
  while ((mc = markerCheck.exec(answer)) !== null) {
    const k = String(mc[2]).trim();
    if (!permKeySet.has(k)) needsFix = true;
  }
  if (needsFix) {
    IMG_MARKER_RE_INLINE.lastIndex = 0;
    const consumed = {};
    let posIdx = 0;
    answer = answer.replace(IMG_MARKER_RE_INLINE, (match, altText, keyRaw) => {
      const key = String(keyRaw).trim();
      if (permKeySet.has(key)) return match;
      const candidates = nameToPermKeys[altText || ""];
      if (candidates && candidates.length) {
        const idx = consumed[altText] || 0;
        const permKey = candidates[idx < candidates.length ? idx : candidates.length - 1];
        consumed[altText] = idx + 1;
        return `![${altText}](file:${permKey})`;
      }
      if (rawInline.length > 0 && posIdx < rawInline.length) {
        const permKey = rawInline[posIdx].fileKey;
        posIdx++;
        return `![${altText}](file:${permKey})`;
      }
      return match;
    });
    console.log(`[auto-fix] repaired record ${id}`);
    kintonePutJson("/k/v1/record.json", {
      app: APP, id, record: { [F.answer]: { value: answer } },
    }).catch((e) => console.error(`[auto-fix] PUT failed for record ${id}:`, e.message));
  }

  return {
    id, q: r[F.question]?.value || "", a: answer,
    cat: parseCategoryField(r[F.category]?.value), tags: r[F.tags]?.value || "",
    imp: !!imp, published: published !== false,
    createdAt: created, updatedAt: updated,
    attachments: attachFiles, inlineImages: inlineFiles,
  };
}

function faqToRecordBody(clientFaq) {
  const impVal = clientFaq.imp ? [CB_YES] : [];
  const pubVal = clientFaq.published !== false ? [CB_YES] : [];
  const record = {
    [F.recordType]: { value: RT_FAQ },
    [F.question]: { value: clientFaq.q || "" },
    [F.answer]: { value: clientFaq.a || "" },
    [F.category]: { value: clientFaq.cat || "" },
    [F.tags]: { value: normalizeTagsString(clientFaq.tags) },
    [F.important]: { value: impVal },
    [F.published]: { value: pubVal },
  };

  if (Array.isArray(clientFaq.attachmentKeys)) {
    record[F.attachment] = { value: clientFaq.attachmentKeys.map((k) => ({ fileKey: k })) };
  }
  if (Array.isArray(clientFaq.inlineImageKeys)) {
    record[F.inlineImages] = { value: clientFaq.inlineImageKeys.map((k) => ({ fileKey: k })) };
  }

  return record;
}

function metaToRecordBody(jsonStr) {
  return {
    [F.recordType]: { value: RT_META },
    [F.question]: { value: "__PORTAL_META__" },
    [F.answer]: { value: jsonStr },
    [F.category]: { value: "" },
    [F.tags]: { value: "" },
    [F.important]: { value: [] },
    [F.published]: { value: [] },
  };
}

function isClientGeneratedId(id) {
  if (typeof id !== "number" || !Number.isFinite(id)) return true;
  return id >= CLIENT_ID_THRESHOLD;
}

const app = express();
app.use(express.json({ limit: "8mb" }));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || corsOrigins.includes("*")) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  } else if (corsOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/* ------------------------------------------------------------------ */
/*  Health check                                                       */
/* ------------------------------------------------------------------ */

app.get("/health", (_req, res) => {
  const hasAuth = Boolean(TOKEN) || Boolean(KT_USER && KT_PASS);
  res.json({ ok: true, version: "2.1", hasDomain: Boolean(DOMAIN), hasApp: Boolean(APP), hasAuth, authMode: TOKEN ? "apiToken" : (KT_USER ? "basic" : "none") });
});

/* ------------------------------------------------------------------ */
/*  File upload → kintone file API                                     */
/* ------------------------------------------------------------------ */

app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!DOMAIN || !(TOKEN || (KT_USER && KT_PASS))) return res.status(500).json({ ok: false, error: "kintone設定が未設定です" });
  if (!req.file) return res.status(400).json({ ok: false, error: "ファイルがありません" });
  try {
    const fileKey = await kintoneUploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    return res.json({ ok: true, fileKey, name: req.file.originalname, size: req.file.size, contentType: req.file.mimetype });
  } catch (e) {
    console.error("upload error:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* ------------------------------------------------------------------ */
/*  File download proxy (kintone → browser)                            */
/* ------------------------------------------------------------------ */

app.get("/api/file/:fileKey", async (req, res) => {
  if (!DOMAIN || !(TOKEN || (KT_USER && KT_PASS))) return res.status(500).json({ ok: false, error: "kintone設定が未設定です" });
  try {
    const { contentType, buffer, contentDisposition } = await kintoneDownloadFile(req.params.fileKey);
    res.setHeader("Content-Type", contentType);
    if (contentDisposition) res.setHeader("Content-Disposition", contentDisposition);
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.send(buffer);
  } catch (e) {
    console.error("file proxy error:", e);
    return res.status(404).json({ ok: false, error: e.message });
  }
});

/* ------------------------------------------------------------------ */
/*  Dynamic file resolve: fetch by record ID + image index             */
/*  Fourth layer of defense against stale/temp fileKeys                */
/* ------------------------------------------------------------------ */

app.get("/api/resolve-file/:recordId/:index", async (req, res) => {
  if (!DOMAIN || !APP || !(TOKEN || (KT_USER && KT_PASS))) return res.status(500).json({ ok: false, error: "kintone設定が未設定です" });
  try {
    const recId = req.params.recordId;
    const idx = Number(req.params.index) || 0;
    const saved = await kintoneGet("/k/v1/record.json", { app: APP, id: recId });
    const rec = saved.record || {};
    const inlineFiles = rec[F.inlineImages]?.value || [];
    const target = inlineFiles[idx];
    if (!target || !target.fileKey) return res.status(404).json({ ok: false, error: "image not found at index " + idx });
    const { contentType, buffer, contentDisposition } = await kintoneDownloadFile(target.fileKey);
    res.setHeader("Content-Type", contentType);
    if (contentDisposition) res.setHeader("Content-Disposition", contentDisposition);
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.send(buffer);
  } catch (e) {
    console.error("resolve-file error:", e.message);
    return res.status(404).json({ ok: false, error: e.message });
  }
});

/* ------------------------------------------------------------------ */
/*  Bootstrap (GET all records)                                        */
/* ------------------------------------------------------------------ */

app.get("/api/bootstrap", async (_req, res) => {
  if (!DOMAIN || !APP || !(TOKEN || (KT_USER && KT_PASS))) return res.status(500).json({ ok: false, error: "kintone設定が未設定です" });
  try {
    const q = `${F.recordType} in ("${RT_FAQ}", "${RT_META}")`;
    const fields = [
      "$id", F.recordType, F.question, F.answer, F.category, F.tags,
      F.important, F.published, F.attachment, F.inlineImages,
      "Created_datetime", "Updated_datetime",
    ];
    const data = await kintoneGet("/k/v1/records.json", {
      app: APP, query: q, totalCount: "true",
      fields: fields.join(","),
    });
    const recs = data.records || [];
    let settings = { name: "FAQ Portal", sub: "Knowledge Sharing Platform", editPin: "" };
    let hierarchy = {};
    const faqs = [];
    for (const rec of recs) {
      const rt = rec[F.recordType]?.value;
      if (rt === RT_META) {
        try {
          const meta = JSON.parse(rec[F.answer]?.value || "{}");
          if (meta.settings) settings = { ...settings, ...meta.settings };
          if (meta.hierarchy) hierarchy = meta.hierarchy;
        } catch { /* ignore */ }
      } else if (rt === RT_FAQ) {
        faqs.push(recordToFaq(rec));
      }
    }
    return res.json({ ok: true, settings, hierarchy, faqs });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* ------------------------------------------------------------------ */
/*  Save single FAQ (POST = new, PUT = update)                         */
/*  保存後に kintone が割り当てる永続 fileKey を取得し、               */
/*  回答テキスト中の一時 fileKey を永続 fileKey に置換して再保存する。  */
/* ------------------------------------------------------------------ */

async function resolveFileKeys(recordId, answerText) {
  const saved = await kintoneGet("/k/v1/record.json", { app: APP, id: String(recordId) });
  const rec = saved.record || {};
  const permInline = (rec[F.inlineImages]?.value || []);
  const permAttach = (rec[F.attachment]?.value || []);

  const permKeySet = new Set(permInline.map((f) => f.fileKey));

  const nameToPermKeys = {};
  for (const f of [...permInline, ...permAttach]) addFilenameAliases(nameToPermKeys, f.name, f.fileKey);

  let unclaimedIdx = 0;
  const nameConsumed = {};

  let newAnswer = answerText || "";
  let changed = false;
  IMG_MARKER_RE_INLINE.lastIndex = 0;
  newAnswer = newAnswer.replace(IMG_MARKER_RE_INLINE, (match, altText, keyRaw) => {
    const key = String(keyRaw).trim();
    if (permKeySet.has(key)) return match;
    const fileName = altText || "";
    const candidates = nameToPermKeys[fileName];
    if (candidates && candidates.length) {
      const idx = nameConsumed[fileName] || 0;
      const permKey = candidates[idx < candidates.length ? idx : candidates.length - 1];
      nameConsumed[fileName] = idx + 1;
      changed = true;
      return `![${altText}](file:${permKey})`;
    }
    if (permInline.length > 0 && unclaimedIdx < permInline.length) {
      const permKey = permInline[unclaimedIdx].fileKey;
      unclaimedIdx++;
      changed = true;
      return `![${altText}](file:${permKey})`;
    }
    return match;
  });

  if (changed) {
    await kintonePutJson("/k/v1/record.json", {
      app: APP, id: recordId,
      record: { [F.answer]: { value: newAnswer } },
    });
  }

  return {
    answer: newAnswer,
    inlineImages: permInline.map((f) => ({ fileKey: f.fileKey, name: repairKintoneFilename(f.name), size: f.size, contentType: f.contentType })),
    attachments: permAttach.map((f) => ({ fileKey: f.fileKey, name: repairKintoneFilename(f.name), size: f.size, contentType: f.contentType })),
  };
}

app.post("/api/faq", async (req, res) => {
  if (!DOMAIN || !APP || !(TOKEN || (KT_USER && KT_PASS))) return res.status(500).json({ ok: false, error: "kintone設定が未設定です" });
  try {
    const record = faqToRecordBody(req.body);
    const result = await kintonePostJson("/k/v1/record.json", { app: APP, record });
    const newId = Number(result.id);
    const resolved = await resolveFileKeys(newId, req.body.a || "");
    return res.json({ ok: true, id: newId, ...resolved });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.put("/api/faq/:id", async (req, res) => {
  if (!DOMAIN || !APP || !(TOKEN || (KT_USER && KT_PASS))) return res.status(500).json({ ok: false, error: "kintone設定が未設定です" });
  try {
    const record = faqToRecordBody(req.body);
    await kintonePutJson("/k/v1/record.json", { app: APP, id: req.params.id, record });
    const resolved = await resolveFileKeys(Number(req.params.id), req.body.a || "");
    return res.json({ ok: true, ...resolved });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.delete("/api/faq/:id", async (req, res) => {
  if (!DOMAIN || !APP || !(TOKEN || (KT_USER && KT_PASS))) return res.status(500).json({ ok: false, error: "kintone設定が未設定です" });
  try {
    await kintoneDeleteRecord(req.params.id);
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* ------------------------------------------------------------------ */
/*  Portal sync (legacy + meta save)                                   */
/* ------------------------------------------------------------------ */

app.post("/api/portal-sync", async (req, res) => {
  if (!DOMAIN || !APP || !(TOKEN || (KT_USER && KT_PASS))) return res.status(500).json({ ok: false, error: "kintone設定が未設定です" });
  const body = req.body || {};
  const { settings, hierarchy, faqs } = body;
  if (!settings || !hierarchy || !Array.isArray(faqs)) {
    return res.status(400).json({ ok: false, error: "settings / hierarchy / faqs が必要です" });
  }

  try {
    const q = `${F.recordType} in ("${RT_FAQ}", "${RT_META}")`;
    const existing = await kintoneGet("/k/v1/records.json", { app: APP, query: q, size: "500" });
    const recs = existing.records || [];
    let metaId = null;
    const existingFaqIds = new Set();
    for (const rec of recs) {
      const rt = rec[F.recordType]?.value;
      if (rt === RT_META && metaId == null) metaId = Number(rec.$id.value);
      if (rt === RT_FAQ) existingFaqIds.add(Number(rec.$id.value));
    }

    const metaPayload = JSON.stringify({ settings, hierarchy });
    if (metaId != null) {
      await kintonePutJson("/k/v1/record.json", { app: APP, id: metaId, record: metaToRecordBody(metaPayload) });
    } else {
      await kintonePostJson("/k/v1/record.json", { app: APP, record: metaToRecordBody(metaPayload) });
    }

    const idMap = {};
    const wanted = new Set();

    for (const f of faqs) {
      if (!isClientGeneratedId(f.id) && existingFaqIds.has(f.id)) {
        await kintonePutJson("/k/v1/record.json", { app: APP, id: f.id, record: faqToRecordBody(f) });
        wanted.add(f.id);
      } else {
        const oldId = f.id;
        const created = await kintonePostJson("/k/v1/record.json", { app: APP, record: faqToRecordBody(f) });
        const newId = Number(created.id);
        if (Number.isFinite(newId)) { idMap[String(oldId)] = newId; wanted.add(newId); }
      }
    }

    for (const kid of existingFaqIds) {
      if (!wanted.has(kid)) await kintoneDeleteRecord(kid);
    }

    return res.json({ ok: true, idMap });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* ------------------------------------------------------------------ */
/*  Static file serving (same port = no CORS needed)                   */
/* ------------------------------------------------------------------ */

const HTTP_PORT = Number(process.env.HTTP_PORT || "8080");
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PUBLIC_DIR = process.env.PUBLIC_DIR
  ? resolve(process.env.PUBLIC_DIR)
  : resolve(__dirname, "..");

app.use(express.static(PUBLIC_DIR, { index: "faq-portal-full.html" }));

/* ------------------------------------------------------------------ */
/*  Start                                                              */
/* ------------------------------------------------------------------ */

app.listen(HTTP_PORT, BIND, () => {
  const htmlPath = join(PUBLIC_DIR, "faq-portal-full.html");
  const found = existsSync(htmlPath);
  console.log(`[SERVER] http://${BIND}:${HTTP_PORT} → API + HTML 統合`);
  console.log(`  API  → kintone app ${APP || "(未設定)"}`);
  console.log(`  HTML → ${PUBLIC_DIR}`);
  if (!found) console.warn(`  ⚠ faq-portal-full.html が ${PUBLIC_DIR} に見つかりません`);
  else console.log(`  ✓ faq-portal-full.html 検出済み`);
});
