#!/usr/bin/env node
/**
 * §50-3-11 第4ステップ — Composer MCP 監査スタンプ（eslint-mcp / repo-tree）
 * @see .cursor/rules/composer-mcp-audit-gate.mdc
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STAMP_DIR = path.join(root, 'logs', 'cio-four-ai-governance');
const STAMP_FILE = path.join(STAMP_DIR, 'composer-mcp-audit-stamp.json');
const TTL_MS = 45 * 60 * 1000;

function parseArgs() {
  const args = process.argv.slice(2);
  let stamp = false;
  let skip = '';
  let text = '';
  let liveSchemaOk = false;
  let liveSchemaApp = '';
  let strictLiveSchema = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--stamp') stamp = true;
    else if (args[i] === '--skip' && args[i + 1]) skip = args[++i];
    else if (args[i] === '--text' && args[i + 1]) text = args[++i];
    else if (args[i] === '--live-schema-ok') liveSchemaOk = true;
    else if (args[i] === '--live-schema-app' && args[i + 1]) liveSchemaApp = args[++i];
    else if (args[i] === '--strict-live-schema') strictLiveSchema = true;
  }
  return { stamp, skip, text, liveSchemaOk, liveSchemaApp, strictLiveSchema };
}

function loadRegistry() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const paths = [path.join(home, '.cursor', 'mcp.json'), path.join(root, '.cursor', 'mcp.json')];
  const names = new Set();
  for (const p of paths) {
    if (!fs.existsSync(p)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      for (const [k, v] of Object.entries(j.mcpServers || {})) {
        if (v && v.disabled !== true) names.add(k);
      }
    } catch {
      /* skip */
    }
  }
  return names;
}

function hasCustomizeDiff() {
  const unstaged = spawnSync('git', ['diff', '--name-only', 'HEAD', '--', 'customize/'], {
    cwd: root,
    encoding: 'utf8',
  });
  const staged = spawnSync('git', ['diff', '--name-only', '--cached', '--', 'customize/'], {
    cwd: root,
    encoding: 'utf8',
  });
  return Boolean((unstaged.stdout || '').trim() || (staged.stdout || '').trim());
}

function main() {
  const { stamp, skip, text, liveSchemaOk, liveSchemaApp, strictLiveSchema } = parseArgs();
  const reg = loadRegistry();
  const missing = ['eslint-mcp', 'repo-tree'].filter((n) => !reg.has(n));

  if (missing.length) {
    console.error('[cio-guard-composer-mcp-audit] NG registry missing:', missing.join(', '));
    process.exit(2);
  }

  if (skip) {
    if (skip.trim().length < 8) {
      console.error('[cio-guard-composer-mcp-audit] NG --skip reason too short (具体1行必須)');
      process.exit(1);
    }
    console.log('[cio-guard-composer-mcp-audit] SKIP', skip);
    process.exit(0);
  }

  if (stamp) {
    if (!text || text.trim().length < 10) {
      console.error('[cio-guard-composer-mcp-audit] NG --stamp requires --text "eslint=0 warnings / repo-tree=OK …"');
      process.exit(1);
    }
    if (liveSchemaOk && !/^\d{3}$/.test(String(liveSchemaApp || ''))) {
      console.error(
        '[cio-guard-composer-mcp-audit] NG customize 変更時 --live-schema-ok には --live-schema-app <3桁ID> 必須',
      );
      process.exit(1);
    }
    const payload = {
      at: new Date().toISOString(),
      text: text.trim(),
      ttlMs: TTL_MS,
    };
    if (liveSchemaOk) {
      payload.liveSchemaOk = true;
      payload.liveSchemaApp = String(liveSchemaApp);
    }
    fs.mkdirSync(STAMP_DIR, { recursive: true });
    fs.writeFileSync(STAMP_FILE, JSON.stringify(payload, null, 2) + '\n');
    console.log('[cio-guard-composer-mcp-audit] OK stamp written');
    process.exit(0);
  }

  if (fs.existsSync(STAMP_FILE)) {
    const j = JSON.parse(fs.readFileSync(STAMP_FILE, 'utf8'));
    const age = Date.now() - new Date(j.at).getTime();
    if (age <= TTL_MS) {
      const live = j.liveSchemaOk ? ` liveSchema=${j.liveSchemaApp}` : '';
      if (!j.liveSchemaOk && hasCustomizeDiff()) {
        const msg =
          '[cio-guard-composer-mcp-audit] customize/** 変更あり — --stamp に --live-schema-ok --live-schema-app <id> 推奨（deploy 前段 guard でも機械検証）';
        if (strictLiveSchema) {
          console.error(`${msg} (--strict-live-schema)`);
          process.exit(1);
        }
        console.warn(msg);
      }
      console.log('[cio-guard-composer-mcp-audit] OK valid stamp', `${j.text?.slice(0, 80)}${live}`);
      process.exit(0);
    }
  }

  console.error('[cio-guard-composer-mcp-audit] NG no valid stamp — run --stamp after eslint-mcp + repo-tree');
  process.exit(1);
}

main();
