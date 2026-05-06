#!/usr/bin/env node
/**
 * WSL 正本 ~/.cursor/mcp.json から、Windows Cursor が読む
 * C:\Users\<user>\.cursor\mcp.json を再生成する（単一ソース運用）。
 *
 * 背景: Windows 側だけ古い／誤生成されると Cursor MCP が赤になる（TSB-028）。
 * 正本は WSL の ~/.cursor/mcp.json とし、Windows は本スクリプトの出力に限定する。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const wslMcp = path.join(os.homedir(), '.cursor', 'mcp.json');
const winMcp =
  process.env.CURSOR_MCP_WINDOWS_JSON ||
  '/mnt/c/Users/mhamada202408224/.cursor/mcp.json';

function escSh(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$');
}

function winPathFromMnt(p) {
  if (typeof p !== 'string') return p;
  if (p.startsWith('/mnt/c/')) {
    return `C:\\\\${p.slice(7).replace(/\//g, '\\\\')}`;
  }
  if (p.startsWith('/home/')) {
    const segs = p.split('/').filter(Boolean);
    const user = segs[1] || 'mhamada202408224';
    const rest = segs.slice(2).join('\\\\');
    return `C:\\\\Users\\\\${user}\\\\${rest}`;
  }
  return p;
}

const wslExe = 'C:\\\\Windows\\\\System32\\\\wsl.exe';

function wslBash(lc) {
  return { command: wslExe, args: ['-d', 'Ubuntu', '-e', 'bash', '-lc', lc] };
}

function buildWindowsMcp(S) {
  const out = { mcpServers: {} };

  out.mcpServers.github = {
    command: 'powershell',
    args: [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      'C:\\\\Users\\\\mhamada202408224\\\\.cursor\\\\mcp-github-wrapper.ps1',
    ],
    ...(S.github?._meta ? { _meta: S.github._meta } : {}),
  };

  out.mcpServers['cyber-news'] = {
    command: 'node',
    args: ['C:\\\\Users\\\\mhamada202408224\\\\.cursor\\\\CyberNewsMCP\\\\dist\\\\index.js'],
    cwd: 'C:\\\\Users\\\\mhamada202408224\\\\.cursor\\\\CyberNewsMCP',
  };

  out.mcpServers['office-powerpoint'] = {
    command:
      'C:\\\\Users\\\\mhamada202408224\\\\.cursor\\\\Office-PowerPoint-MCP-Server\\\\.venv\\\\Scripts\\\\python.exe',
    args: [
      'C:\\\\Users\\\\mhamada202408224\\\\.cursor\\\\Office-PowerPoint-MCP-Server\\\\ppt_mcp_server.py',
    ],
    cwd: 'C:\\\\Users\\\\mhamada202408224\\\\.cursor\\\\Office-PowerPoint-MCP-Server',
    ...(S['office-powerpoint']?._meta ? { _meta: S['office-powerpoint']._meta } : {}),
  };

  const fsSrv = S.filesystem;
  if (fsSrv && typeof fsSrv.command === 'string' && Array.isArray(fsSrv.args) && fsSrv.args.length >= 2) {
    const fsArgs = fsSrv.args;
    out.mcpServers.filesystem = {
      command: fsSrv.command,
      args: [
        fsArgs[0],
        fsArgs[1],
        ...fsArgs.slice(2).map((p) => winPathFromMnt(p)),
      ],
    };
  }

  out.mcpServers.memory = { ...S.memory };
  if (S.fetch && typeof S.fetch.command === 'string') {
    out.mcpServers.fetch = { command: 'python', args: ['-m', 'mcp_server_fetch'] };
  }
  out.mcpServers['sequential-thinking'] = { ...S['sequential-thinking'] };
  out.mcpServers.kintone = { ...S.kintone };

  out.mcpServers['kintone-dev'] = {
    command: wslExe,
    args: ['-d', 'Ubuntu', '-e', 'node', '/home/mhamada202408224/.cursor/kntn-dev-mcp/mcp-entry.mjs'],
  };

  const ks = S['kintone-space'];
  const kb = ks?.env?.KINTONE_BASE_URL || '';
  const ku = ks?.env?.KINTONE_USERNAME || '';
  const kp = String(ks?.env?.KINTONE_PASSWORD || '');
  const ksp = kp.replace(/'/g, "'\\''");
  out.mcpServers['kintone-space'] = {
    ...wslBash(
      `export KINTONE_BASE_URL="${escSh(kb)}" KINTONE_USERNAME="${escSh(
        ku,
      )}" KINTONE_PASSWORD='${ksp}' && exec node /home/mhamada202408224/.cursor/kintone-space-mcp/index.mjs`,
    ),
    ...(ks?.env ? { env: { ...ks.env } } : {}),
  };

  out.mcpServers.playwright = { ...S.playwright };

  out.mcpServers['cve-search'] = wslBash(
    'cd /home/mhamada202408224/.cursor/cve-search_mcp && exec uv run main.py',
  );

  out.mcpServers.rag = wslBash(
    'export PATH=/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin:$PATH ' +
      'DB_PATH=/home/mhamada202408224/kintone-ai-lab/.rag/lancedb ' +
      'CACHE_DIR=/home/mhamada202408224/kintone-ai-lab/.rag/models ' +
      'BASE_DIR=/home/mhamada202408224/kintone-ai-lab && exec npx -y mcp-local-rag',
  );

  out.mcpServers['accessibility-scanner'] = wslBash(
    'export PATH=/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin:$PATH && exec npx -y mcp-accessibility-scanner',
  );

  out.mcpServers['duckduckgo-search'] = wslBash(
    'export DDG_REGION=jp-ja PATH=/home/mhamada202408224/.local/bin:$PATH && exec /home/mhamada202408224/.local/bin/uvx duckduckgo-mcp-server',
  );

  const mk = S.kimi?.env?.MOONSHOT_API_KEY ?? '';
  const dk = S.deepseek?.env?.DEEPSEEK_API_KEY ?? '';
  const ok = S.openrouter?.env?.OPENROUTER_API_KEY ?? '';

  out.mcpServers.kimi = {
    ...wslBash(
      `export PATH=/home/mhamada202408224/.nvm/versions/node/v25.8.2/bin:$PATH MOONSHOT_API_KEY="${escSh(
        mk,
      )}" && exec npx -y kimi-api-mcp@latest`,
    ),
    ...(S.kimi?.env ? { env: { ...S.kimi.env } } : {}),
  };
  out.mcpServers.deepseek = {
    ...wslBash(
      `export PATH=/home/mhamada202408224/.nvm/versions/node/v25.8.2/bin:$PATH DEEPSEEK_API_KEY="${escSh(
        dk,
      )}" && exec npx -y mcp-deepseek@latest`,
    ),
    ...(S.deepseek?.env ? { env: { ...S.deepseek.env } } : {}),
  };
  out.mcpServers.openrouter = {
    ...wslBash(
      `export PATH=/home/mhamada202408224/.nvm/versions/node/v25.8.2/bin:$PATH OPENROUTER_API_KEY="${escSh(
        ok,
      )}" && exec npx -y @mcpservers/openrouterai@latest`,
    ),
    ...(S.openrouter?.env ? { env: { ...S.openrouter.env } } : {}),
  };

  // TSB-029: @iflow-mcp/markdownify-mcp は npx 経由だと preinstall 欠落 tarball で即死しうる。
  // WSL では `npm install -g --ignore-scripts @iflow-mcp/markdownify-mcp@0.0.2` のうえ node 直起動（NVM 替え時はパス更新）。
  out.mcpServers.markdownify = wslBash(
    'exec env -i HOME=/home/mhamada202408224 PATH=/home/mhamada202408224/.local/bin:/usr/bin:/bin UV_PATH=/home/mhamada202408224/.local/bin/uv /home/mhamada202408224/.nvm/versions/node/v24.14.1/bin/node /home/mhamada202408224/.nvm/versions/node/v24.14.1/lib/node_modules/@iflow-mcp/markdownify-mcp/dist/index.js',
  );

  return out;
}

if (!fs.existsSync(wslMcp)) {
  console.error('[sync-cursor-mcp-windows] SKIP: missing WSL canonical', wslMcp);
  process.exit(0);
}

if (!fs.existsSync(path.dirname(winMcp))) {
  console.error('[sync-cursor-mcp-windows] SKIP: Windows .cursor path not mounted:', winMcp);
  process.exit(0);
}

const src = JSON.parse(fs.readFileSync(wslMcp, 'utf8'));
const built = buildWindowsMcp(src.mcpServers || {});

const bak = `${winMcp}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
if (fs.existsSync(winMcp)) {
  fs.copyFileSync(winMcp, bak);
}

fs.writeFileSync(winMcp, `${JSON.stringify(built, null, 2)}\n`, 'utf8');
console.log('[sync-cursor-mcp-windows] OK', winMcp, 'backup', bak);
