/**
 * 本番 customize の BUILD / revision / fileKey を機械可読で保持（kintone-apps.md 補完）。
 * deploy-customization.js 成功時に更新。監査: cio-audit-customize-portfolio.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const REG_PATH = path.join(process.cwd(), "data", "cio-live-builds.json");

export function extractBuildFromSource(source) {
  const m = source.match(/(?:var|const)\s+BUILD\s*=\s*["']([^"']+)["']/);
  if (m) return m[1];
  const m2 = source.match(/BUILD:\s*([^\s\n*]+)/);
  return m2 ? m2[1].trim() : null;
}

export function readLiveBuildRegistry() {
  if (!existsSync(REG_PATH)) return { version: 1, apps: {} };
  try {
    return JSON.parse(readFileSync(REG_PATH, "utf8"));
  } catch {
    return { version: 1, apps: {} };
  }
}

export function recordLiveBuild({ appId, build, fileKey, revision, relPath, note }) {
  const reg = readLiveBuildRegistry();
  reg.version = 1;
  reg.apps = reg.apps || {};
  let rel = relPath || null;
  if (rel) {
    try {
      rel = path.relative(process.cwd(), path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel));
    } catch {
      /* keep as-is */
    }
    rel = String(rel).replace(/\\/g, "/");
  }
  reg.apps[String(appId)] = {
    build: build || null,
    fileKey: fileKey || null,
    revision: revision != null ? String(revision) : null,
    relPath: rel,
    deployedAt: new Date().toISOString(),
    note: note || null,
  };
  mkdirSync(path.dirname(REG_PATH), { recursive: true });
  writeFileSync(REG_PATH, JSON.stringify(reg, null, 2) + "\n", "utf8");
  return reg.apps[String(appId)];
}

export function getRegistryPath() {
  return REG_PATH;
}
