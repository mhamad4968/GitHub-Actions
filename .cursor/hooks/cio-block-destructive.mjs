#!/usr/bin/env node
// =============================================================================
// cio-block-destructive.mjs — Cursor beforeShellExecution Hook
// 制定: 2026-05-10 (Run Everything 採用に伴う構造的緩和策 b)
// 役割: PC 初期化で救えない致命的リスク（API キー exfil / kintone 本番破壊 /
//       GitHub 履歴破壊 / ネットワーク経由機密データ持出）に直結するコマンドを
//       Run Everything 下でも CEO §41 GO なしで絶対 block する。
// 設計方針:
//   - 既存 .cursor/hooks/l3-guard.mjs (§47 L3 ガード, permission:'ask') は触らない
//   - 本 hook は permission:'deny' + exit code 2 で Run Everything 下でも確実 block
//   - false positive を最小化するため、本当に致命的（PC 初期化で救えない）パターンのみ
// 依存: Node.js のみ (jq 不要)
// 関連: docs/cio-permissions-guide.md / AGENTS.md §41-8
// =============================================================================

const FATAL_PATTERNS = [
  // === 1. API キー / mcp.json / permissions.json / .env 持出 ===
  {
    pattern: /\b(?:cat|type|tail|head|less|more|xxd|base64|hexdump|od)\s+[^|;&]*\.cursor[\\\/](?:mcp|permissions|sandbox)\.json[^|;&]*\|\s*(?:curl|wget|nc|netcat|ncat|python|python3|node|powershell|pwsh|iwr|invoke-)/i,
    label: 'API key/secret exfiltration via shell pipe (.cursor/*.json)',
  },
  {
    pattern: /\b(?:cat|type|tail|head|less)\s+[^|;&]*\.env[^|;&]*\|\s*(?:curl|wget|nc|netcat|python|python3|node|iwr|invoke-)/i,
    label: '.env exfiltration via shell pipe',
  },
  {
    pattern: /\b(?:curl|wget|iwr|invoke-webrequest)\s+(?:[^;|&]*\s)?(?:-T|--upload-file|-d\s*@|--data-binary\s*@|-F\s*[^=]+=@|--form\s+[^=]+=@)\s*[^;|&\s]*(?:\.cursor|\.env|mcp\.json|permissions\.json|sandbox\.json|secrets|credentials|id_rsa|id_ed25519)/i,
    label: 'Secret file upload via curl/wget/iwr',
  },
  {
    pattern: /\btar\s+[^;|&]*(?:czf|cf|cjf|cJf)\s+-\s+[^;|&]*\.cursor[^;|&]*\|\s*(?:curl|wget|nc|netcat)/i,
    label: 'Secret directory tar+pipe exfiltration',
  },
  {
    pattern: /\bzip\s+[^;|&]*-r?\s+-?\s+[^;|&]*\.cursor[^;|&]*\|\s*(?:curl|wget|nc)/i,
    label: 'Secret directory zip+pipe exfiltration',
  },

  // === 2. GitHub 履歴破壊（main/master への force push のみ・Run Everything 下では §41 GO 必須） ===
  {
    pattern: /\bgit\s+push\s+(?:[^;|&]+\s)?(?:--force|-f|--force-with-lease)\b(?:[^;|&]*)\s+(?:origin\s+)?(?:main|master|trunk|production|prod|release\/[\w.-]+)\b/i,
    label: 'git push --force to main/master/production branch (history destruction)',
  },
  {
    pattern: /\bgit\s+push\s+(?:[^;|&]+\s)?(?:origin\s+)?[+]\s*(?:main|master|trunk|production)\b/i,
    label: 'git push +main/master (forced ref update)',
  },
  {
    pattern: /\bgh\s+repo\s+delete\b/i,
    label: 'gh repo delete (repository destruction)',
  },
  {
    pattern: /\bgh\s+release\s+delete\s+[^;|&]*--yes\b/i,
    label: 'gh release delete --yes (release destruction)',
  },

  // === 3. ローカルシステム壊滅 ===
  {
    pattern: /\brm\s+-[rR]f?\s+\/(?:\s|$)/,
    label: 'rm -rf / (root filesystem destruction)',
  },
  {
    pattern: /\brm\s+-[rR]f?\s+--no-preserve-root\b/i,
    label: 'rm -rf --no-preserve-root',
  },
  {
    pattern: /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;?\s*:/,
    label: 'fork bomb',
  },
  {
    pattern: /\bdd\s+(?:[^;|&]+\s)?if=\S+\s+(?:[^;|&]+\s)?of=\/dev\/(?:sd[a-z]|nvme|hd[a-z])/i,
    label: 'dd to raw disk device',
  },
  {
    pattern: /\b(?:mkfs(?:\.\w+)?|fdisk|wipefs|shred\s+-[a-z]*\s*\/dev)\b/i,
    label: 'disk format/wipe (mkfs/fdisk/wipefs/shred /dev)',
  },

  // === 4. kintone 本番破壊（明示的な bulk delete のみ；通常 update/add は通す） ===
  {
    pattern: /\bcurl\s+[^;|&]*-X\s+DELETE[^;|&]*\/k\/v1\/records\.json/i,
    label: 'kintone bulk DELETE /k/v1/records.json (production data destruction)',
  },
  {
    pattern: /\bcurl\s+[^;|&]*-X\s+DELETE[^;|&]*\/k\/v1\/apps\.json/i,
    label: 'kintone DELETE /k/v1/apps.json (production app destruction)',
  },

  // === 5. システム認証情報・SSH 鍵改変 ===
  {
    pattern: /\b(?:cat|type)\s+[^|;&]*\b(?:id_rsa|id_ed25519|id_ecdsa|id_dsa)\b[^|;&]*\|\s*(?:curl|wget|nc|python|node)/i,
    label: 'SSH private key exfiltration',
  },
  {
    pattern: /\bchmod\s+(?:777|-R\s+777)\s+\/(?:\s|$|etc|root|home|var)/i,
    label: 'chmod 777 on system directory',
  },
];

function blockResponse(label, command) {
  return {
    permission: 'deny',
    user_message:
      '[BLOCK] CIO 致命防衛ガード（cio-block-destructive.mjs）が block しました\n' +
      '  検知: ' + label + '\n' +
      '  コマンド: ' + command.slice(0, 200) + (command.length > 200 ? '...' : '') + '\n\n' +
      'このコマンドは Run Everything モード下でも **CEO §41 GO なしでは絶対実行されません**。\n' +
      '本当に実行が必要な場合:\n' +
      '  1) CEO §41 で GO を取得\n' +
      '  2) 一時的に .cursor/hooks.json で当 hook を disable（CEO 操作）\n' +
      '  3) 完了後に必ず hook を再有効化\n' +
      '関連: AGENTS.md §41-8 / docs/cio-permissions-guide.md',
    agent_message:
      'Blocked by CIO 致命防衛ガード (cio-block-destructive.mjs) — pattern: ' + label + '. ' +
      'Run Everything 下でも block 維持。CEO §41 GO + 一時 hook disable が必要。',
  };
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw || '{}');
  } catch (e) {
    console.error('cio-block-destructive: JSON parse failed:', e.message);
    process.exit(1);
  }

  const command = String(input.command || '');
  if (!command) {
    console.log(JSON.stringify({ permission: 'allow' }));
    process.exit(0);
  }

  for (const { pattern, label } of FATAL_PATTERNS) {
    if (pattern.test(command)) {
      console.log(JSON.stringify(blockResponse(label, command)));
      process.exit(2);
    }
  }

  console.log(JSON.stringify({ permission: 'allow' }));
  process.exit(0);
});
