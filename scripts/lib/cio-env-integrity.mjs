/**
 * 改善案1 — 環境変数・MCP env セルフ監査（値は出力しない）
 */
import fs from 'node:fs';
import path from 'node:path';

export function loadEnvFile(envPath) {
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

export function loadMcpEnvKeys(mcpPath) {
  const keys = new Set();
  if (!mcpPath || !fs.existsSync(mcpPath)) return keys;
  try {
    const j = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
    for (const srv of Object.values(j.mcpServers || {})) {
      if (!srv || srv.disabled) continue;
      for (const k of Object.keys(srv.env || {})) keys.add(k);
    }
  } catch {
    /* noop */
  }
  return keys;
}

export function scanCustomizeEnvRefs(root) {
  const refs = new Set();
  const customizeDir = path.join(root, 'customize');
  if (!fs.existsSync(customizeDir)) return refs;
  const re = /process\.env\.([A-Z0-9_]+)/g;
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (/\.(js|mjs|ts|tsx)$/.test(name)) {
        const text = fs.readFileSync(p, 'utf8');
        let m;
        while ((m = re.exec(text)) !== null) refs.add(m[1]);
      }
    }
  }
  walk(customizeDir);
  return refs;
}

export function hasValue(key, envMap, procEnv = process.env) {
  const v = envMap[key] ?? procEnv[key];
  return typeof v === 'string' && v.trim().length > 0;
}

export function auditEnvIntegrity(root, manifest) {
  const issues = [];
  const envPath = path.join(root, '.env');
  const envMap = loadEnvFile(envPath);
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const mcpPaths = [
    home ? path.join(home, '.cursor', 'mcp.json') : null,
    path.join(root, '.cursor', 'mcp.json'),
  ].filter(Boolean);

  if (!fs.existsSync(envPath)) {
    issues.push({ kind: 'repo', key: '.env', label: 'リポジトリ .env ファイル自体が未作成' });
  }

  for (const { key, label } of manifest.repoEnvRequired || []) {
    if (!hasValue(key, envMap)) {
      issues.push({ kind: 'repo', key, label });
    }
  }

  for (const mcpPath of mcpPaths) {
    if (!fs.existsSync(mcpPath)) continue;
    let srv = {};
    try {
      srv = JSON.parse(fs.readFileSync(mcpPath, 'utf8')).mcpServers || {};
    } catch {
      continue;
    }
    for (const [serverName, items] of Object.entries(manifest.mcpServerEnv || {})) {
      if (!srv[serverName] || srv[serverName].disabled) continue;
      for (const item of items) {
        if (item.optional) continue;
        const inline = srv[serverName]?.env?.[item.key];
        if (typeof inline === 'string' && inline.trim()) continue;
        if (!hasValue(item.key, envMap)) {
          issues.push({
            kind: 'mcp',
            key: item.key,
            label: `${item.label}（MCP: ${serverName}）`,
            mcpFile: mcpPath,
          });
        }
      }
    }
  }

  for (const key of scanCustomizeEnvRefs(root)) {
    if (!hasValue(key, envMap)) {
      issues.push({ kind: 'customize', key, label: `customize/** が参照する ${key}` });
    }
  }

  return issues;
}

export function formatEnvWarning(issues) {
  const lines = ['【警告】環境変数に不足があります。'];
  for (const i of issues) {
    lines.push(`  - ${i.label || i.key} が未配備`);
  }
  lines.push('  → .env または ~/.cursor/mcp.json の env を整備後、再実行');
  return lines.join('\n');
}
