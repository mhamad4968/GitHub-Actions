#!/usr/bin/env node
/**
 * 674 専用 BUILD 整合監査（リポ ↔ registry ↔ kintone 本番ファイル）。
 * ポートフォリオ監査（cio-audit-customize-portfolio.mjs）の対象外のため単独実行。
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { extractBuildFromSource, readLiveBuildRegistry } from "./cio-live-build-registry.mjs";

const APP = "674";
const REL = "customize/new-pc-ledger-v1/desktop.js";

const MARKERS = [
  "list-create-modal-clear-btn",
  "npl674InventoryPeriodActive674",
  "リスト一覧を作成",
  "未棚卸一覧",
  "転用PC",
  "JBIS674_PRINT_LAYOUT",
  "purchase_vendor",
  "リスト作成の条件をクリア",
];

function kintoneBase() {
  let base = String(process.env.KINTONE_BASE_URL || "").trim().replace(/\/+$/, "");
  if (!base && process.env.KINTONE_DOMAIN) {
    const d = String(process.env.KINTONE_DOMAIN).trim().replace(/^https?:\/\//, "");
    base = `https://${d}`;
  }
  return base.replace(/\/k$/, "");
}

function authHeaders() {
  const user = process.env.KINTONE_USERNAME;
  const pass = process.env.KINTONE_PASSWORD;
  if (!user || !pass) throw new Error("KINTONE_USERNAME / KINTONE_PASSWORD required");
  return {
    "X-Cybozu-Authorization": Buffer.from(`${user}:${pass}`, "utf8").toString("base64"),
  };
}

async function fetchLive() {
  const url = new URL(`${kintoneBase()}/k/v1/preview/app/customize.json`);
  url.searchParams.set("app", APP);
  const res = await fetch(url, { method: "GET", headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(`customize GET: ${json?.message || res.status}`);
  const fileKey = json?.desktop?.js?.[0]?.file?.fileKey;
  if (!fileKey) return { revision: json?.revision, fileKey: null, src: null, build: null };
  const furl = new URL(`${kintoneBase()}/k/v1/file.json`);
  furl.searchParams.set("fileKey", fileKey);
  const fres = await fetch(furl, { headers: authHeaders() });
  if (!fres.ok) throw new Error(`file download HTTP ${fres.status}`);
  const src = await fres.text();
  return {
    revision: json?.revision,
    fileKey,
    src,
    build: extractBuildFromSource(src),
  };
}

function markerReport(label, src) {
  if (!src) {
    console.log(`  ${label}: (no source)`);
    return 0;
  }
  let miss = 0;
  for (const m of MARKERS) {
    const ok = src.includes(m);
    if (!ok) miss++;
    console.log(`  ${ok ? "[OK]" : "[MISS]"} ${m}`);
  }
  return miss;
}

async function main() {
  const repoSrc = readFileSync(REL, "utf8");
  const repoBuild = extractBuildFromSource(repoSrc);
  const ledger = readLiveBuildRegistry().apps?.[APP] || null;
  const live = await fetchLive();

  console.log("[cio-audit-674] === BUILD 3点照合 ===");
  console.log(`  repo:     ${repoBuild}`);
  console.log(`  registry: ${ledger?.build || "-"} (rev ${ledger?.revision ?? "-"})`);
  console.log(`  live:     ${live.build || "-"} (rev ${live.revision ?? "-"})`);

  const issues = [];
  if (!repoBuild) issues.push("repo: BUILD not found");
  if (!ledger) issues.push("registry: missing entry for 674");
  else if (repoBuild && ledger.build !== repoBuild) {
    issues.push(`registry≠repo (${ledger.build} vs ${repoBuild})`);
  }
  if (!live.build) issues.push("kintone: BUILD not in live file");
  else if (repoBuild && live.build !== repoBuild) {
    issues.push(`kintone≠repo (${live.build} vs ${repoBuild}) — 先祖返りの疑い`);
  }
  // deploy 応答の UUID と customize.json の fileKey 文字列は形式が異なることがある（BUILD 一致なら先祖返りではない）
  if (ledger?.fileKey && live.fileKey && ledger.fileKey !== live.fileKey) {
    console.log(
      `[cio-audit-674] note: fileKey 表記差（registry UUID vs customize API）。BUILD 一致のため問題なし。`,
    );
    console.log(`  registry: ${ledger.fileKey}`);
    console.log(`  kintone:  ${live.fileKey}`);
  }

  console.log(`[cio-audit-674] 整合: ${issues.length ? "NG" : "OK"}`);
  if (issues.length) {
    for (const i of issues) console.log(`  → ${i}`);
  }

  console.log("[cio-audit-674] === 機能マーカー（live JS）===");
  const liveMiss = markerReport("live", live.src);
  if (repoBuild !== live.build && live.src && repoSrc) {
    console.log("[cio-audit-674] === repo にあって live に無いマーカー ===");
    for (const m of MARKERS) {
      if (repoSrc.includes(m) && !live.src.includes(m)) console.log(`  [REGRESSION?] ${m}`);
    }
  }

  if (issues.length || liveMiss > 0) process.exit(2);
  console.log("[cio-audit-674] 先祖返りなし（BUILD一致・マーカー全て live に存在）");
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
