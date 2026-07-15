#!/usr/bin/env node
/**
 * MCP プロファイル適用 — Cold ON/OFF（spec §6.3 O3 · Tier B は --apply 時のみ）
 *
 *   npm run cio:mcp:profile -- --list
 *   npm run cio:mcp:profile -- --profile governance --dry-run
 *   npm run cio:mcp:profile -- --intent frontend-ui --apply
 *
 * 禁止: --dry-run と --apply の同時指定（exit 2 · 書込拒否 / △18）
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROFILES_PATH = path.join(root, 'data/cio-mcp-profiles.json');

function parseArgs(argv) {
  const out = { apply: false, dryRun: false, list: false, profile: null, intent: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--apply') out.apply = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--list') out.list = true;
    else if (a === '--profile') out.profile = argv[++i];
    else if (a === '--intent') out.intent = argv[++i];
  }
  if (!out.apply && !out.dryRun && !out.list) out.dryRun = true;
  return out;
}

function userMcpPath() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  if (!home) throw new Error('USERPROFILE/HOME not set');
  return path.join(home, '.cursor', 'mcp.json');
}

function loadProfiles() {
  if (!fs.existsSync(PROFILES_PATH)) throw new Error(`missing ${PROFILES_PATH}`);
  return JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf8'));
}

function resolveProfileName(profilesDoc, args) {
  if (args.profile) return args.profile;
  if (args.intent) {
    const mapped = profilesDoc.intentToProfile?.[args.intent];
    if (mapped) return mapped;
    throw new Error(`intent "${args.intent}" has no profile mapping`);
  }
  return profilesDoc.defaultProfile || 'governance';
}

function planChanges(cfg, profileDef, neverDisable) {
  const changes = [];
  const servers = cfg.mcpServers || {};
  const never = new Set(neverDisable || []);

  for (const name of profileDef.disable || []) {
    if (never.has(name)) continue;
    if (!servers[name]) continue;
    if (servers[name].disabled === true) continue;
    changes.push({ name, action: 'disable' });
  }
  for (const name of profileDef.enable || []) {
    if (!servers[name]) continue;
    if (servers[name].disabled !== true) continue;
    changes.push({ name, action: 'enable' });
  }
  return changes;
}

function applyChanges(cfg, changes) {
  for (const { name, action } of changes) {
    if (!cfg.mcpServers[name]) continue;
    if (action === 'disable') cfg.mcpServers[name].disabled = true;
    else delete cfg.mcpServers[name].disabled;
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const profilesDoc = loadProfiles();

  if (args.list) {
    console.log('[cio:mcp:profile] profiles:', Object.keys(profilesDoc.profiles || {}).join(', '));
    console.log('[cio:mcp:profile] default:', profilesDoc.defaultProfile);
    process.exit(0);
  }

  const profileName = resolveProfileName(profilesDoc, args);
  const profileDef = profilesDoc.profiles?.[profileName];
  if (!profileDef) {
    console.error('[cio:mcp:profile] NG unknown profile:', profileName);
    process.exit(2);
  }

  const mcpPath = userMcpPath();
  if (!fs.existsSync(mcpPath)) {
    console.error('[cio:mcp:profile] NG missing', mcpPath);
    process.exit(2);
  }

  const cfg = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
  const changes = planChanges(cfg, profileDef, profilesDoc.neverDisable);

  console.log(`[cio:mcp:profile] profile=${profileName} (${profileDef.label || ''})`);
  console.log(`[cio:mcp:profile] path=${mcpPath}`);
  if (!changes.length) {
    console.log('[cio:mcp:profile] OK no changes needed');
    process.exit(0);
  }

  for (const c of changes) console.log(`  · ${c.action}: ${c.name}`);

  // 2026-07-15 事故対策: --dry-run と --apply 同時指定時は書込を拒否（apply 優先だと誤本番化）
  if (args.dryRun && args.apply) {
    console.error('[cio:mcp:profile] NG --dry-run と --apply の同時指定は禁止（書込拒否）— どちらか一方のみ');
    process.exit(2);
  }

  if (args.dryRun) {
    console.log('[cio:mcp:profile] dry-run only — add --apply for Tier B write');
    process.exit(0);
  }

  if (!args.apply) {
    console.error('[cio:mcp:profile] NG --apply が無いため書込しません（既定は dry-run）');
    process.exit(2);
  }

  const iso = new Date().toISOString().replace(/[:.]/g, '-');
  const bak = `${mcpPath}.bak.${iso}`;
  fs.copyFileSync(mcpPath, bak);
  applyChanges(cfg, changes);
  fs.writeFileSync(mcpPath, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
  console.log(`[cio:mcp:profile] OK applied ${changes.length} change(s) backup=${bak}`);
  console.log('[cio:mcp:profile] Reload Window 後 npm run cio:mcp:gate');
  process.exit(0);
}

main();
