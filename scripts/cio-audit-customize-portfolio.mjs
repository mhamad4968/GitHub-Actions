#!/usr/bin/env node
/**
 * ポートフォリオ customize の BUILD 整合監査（リポ ↔ 台帳 JSON ↔ kintone 本番ファイル）。
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/cio-audit-customize-portfolio.mjs
 *   ... --strict   # 不一致で exit 2
 *   ... --skip-kintone  # API 照合スキップ（オフライン）
 */
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import {
  extractBuildFromSource,
  readLiveBuildRegistry,
  getRegistryPath,
} from "./cio-live-build-registry.mjs";
import { PORTFOLIO_CUSTOMIZE as PORTFOLIO } from "./cio-portfolio-apps.mjs";

const strict = process.argv.includes("--strict");
const skipKintone = process.argv.includes("--skip-kintone");

function kintoneBase() {
  let base = String(process.env.KINTONE_BASE_URL || "").trim().replace(/\/+$/, "");
  if (!base && process.env.KINTONE_DOMAIN) {
    const d = String(process.env.KINTONE_DOMAIN).trim().replace(/^https?:\/\//, "");
    base = `https://${d}`;
  }
  base = base.replace(/\/k$/, "");
  if (!base) throw new Error("KINTONE_BASE_URL or KINTONE_DOMAIN required");
  return base;
}

function authHeaders() {
  const user = process.env.KINTONE_USERNAME;
  const pass = process.env.KINTONE_PASSWORD;
  if (!user || !pass) throw new Error("KINTONE_USERNAME / KINTONE_PASSWORD required for kintone fetch");
  const h = {
    "X-Cybozu-Authorization": Buffer.from(`${user}:${pass}`, "utf8").toString("base64"),
  };
  if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
    h.Authorization = `Basic ${Buffer.from(
      `${process.env.KINTONE_BASIC_AUTH_USERNAME}:${process.env.KINTONE_BASIC_AUTH_PASSWORD}`,
      "utf8",
    ).toString("base64")}`;
  }
  return h;
}

async function fetchLiveDesktopFileKey(appId) {
  const url = new URL(`${kintoneBase()}/k/v1/preview/app/customize.json`);
  url.searchParams.set("app", String(appId));
  const res = await fetch(url, { method: "GET", headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`customize GET ${appId}: ${json?.code || res.status} ${json?.message || ""}`);
  }
  const js = json?.desktop?.js;
  if (!Array.isArray(js) || !js[0]?.file?.fileKey) return { fileKey: null, revision: json?.revision };
  return { fileKey: js[0].file.fileKey, revision: json?.revision };
}

async function downloadFileText(fileKey) {
  const url = new URL(`${kintoneBase()}/k/v1/file.json`);
  url.searchParams.set("fileKey", fileKey);
  const res = await fetch(url, { method: "GET", headers: authHeaders() });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`file download ${fileKey}: HTTP ${res.status} ${t.slice(0, 200)}`);
  }
  return res.text();
}

function readRepoBuild(rel) {
  const abs = path.join(process.cwd(), rel);
  if (!existsSync(abs)) return { ok: false, error: "missing file" };
  const src = readFileSync(abs, "utf8");
  const build = extractBuildFromSource(src);
  if (!build) return { ok: false, error: "BUILD not found in repo" };
  return { ok: true, build };
}

async function main() {
  const reg = readLiveBuildRegistry();
  const rows = [];
  let ng = 0;

  console.log(`[cio-audit-portfolio] registry: ${getRegistryPath()}`);
  console.log(`[cio-audit-portfolio] kintone: ${skipKintone ? "skip" : "on"}`);

  for (const { id, rel } of PORTFOLIO) {
    const repo = readRepoBuild(rel);
    const ledger = reg.apps?.[id] || null;
    let live = { build: null, fileKey: null, revision: null };

    if (!skipKintone && repo.ok) {
      try {
        const meta = await fetchLiveDesktopFileKey(id);
        live.fileKey = meta.fileKey;
        live.revision = meta.revision;
        if (meta.fileKey) {
          const text = await downloadFileText(meta.fileKey);
          live.build = extractBuildFromSource(text);
        }
      } catch (e) {
        live.error = String(e.message || e);
      }
    }

    const issues = [];
    if (!repo.ok) issues.push(`repo: ${repo.error}`);
    if (!ledger) issues.push("registry: missing (deploy after registry introduced?)");
    else if (repo.ok && ledger.build && repo.build !== ledger.build) {
      issues.push(`registry≠repo (${ledger.build} vs ${repo.build})`);
    }
    if (!skipKintone) {
      if (live.error) issues.push(`kintone: ${live.error}`);
      else if (!live.build) issues.push("kintone: BUILD not in live file");
      else if (repo.ok && live.build !== repo.build) {
        issues.push(`kintone≠repo (${live.build} vs ${repo.build})`);
      }
    }

    const status = issues.length ? "NG" : "OK";
    if (status === "NG") ng++;
    rows.push({ id, rel, status, repoBuild: repo.build, ledgerBuild: ledger?.build, liveBuild: live.build, issues });
    console.log(
      `[${status}] app=${id} repo=${repo.build || "-"} registry=${ledger?.build || "-"} live=${live.build || "-"}${issues.length ? " → " + issues.join("; ") : ""}`,
    );
  }

  if (ng > 0) {
    console.error(`[cio-audit-portfolio] NG ${ng}/${PORTFOLIO.length}`);
    if (strict) process.exit(2);
    process.exit(1);
  }
  console.log(`[cio-audit-portfolio] OK ${PORTFOLIO.length}/${PORTFOLIO.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
