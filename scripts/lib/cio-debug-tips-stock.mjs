/**
 * 15ターン解体時デバッグ知恵自動ストック（第9層・拡張案3 / Kimi 職分）
 */
import fs from 'node:fs';
import path from 'node:path';

const TIPS_REL = 'docs/knowledge/debug-tips.md';
const MARKER = '<!-- CIO-DEBUG-TIPS:AUTO -->';

const SOURCE_FILES = [
  'chat-sessions/handoff-log.md',
  'chat-sessions/checkpoint-latest.md',
  'docs/issues/bug-latest.md',
  'logs/cio-composer-escalation.log',
  'logs/report-checksheet-violations.log',
];

function readTail(root, rel, max = 4000) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return '';
  return fs.readFileSync(p, 'utf8').slice(-max);
}

function extractErrors(text) {
  const patterns = [
    /\[.*?\]\s*NG[^\n]*/gi,
    /exit\s*1[^\n]*/gi,
    /Error[^\n]*/gi,
    /\[verify:[^\]]+\][^\n]*/gi,
    /npm run [^\n]+/gi,
  ];
  const found = new Set();
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const s = m[0].trim().slice(0, 200);
      if (s.length > 8) found.add(s);
    }
  }
  return [...found].slice(0, 8);
}

function extractCommands(text) {
  const cmds = new Set();
  for (const m of text.matchAll(/npm run [a-z0-9:_-]+(?:\s+--[^\n]*)?/gi)) {
    cmds.add(m[0].trim());
  }
  return [...cmds].slice(0, 6);
}

function buildTipBlock(root, exportedAt) {
  const chunks = SOURCE_FILES.map((rel) => readTail(root, rel)).join('\n---\n');
  const errors = extractErrors(chunks);
  const commands = extractCommands(chunks);

  if (errors.length === 0 && commands.length === 0) {
    return null;
  }

  const ymd = exportedAt.slice(0, 10);
  const title = 'セッション解体時知恵ストック';
  const cmdLine = commands.length
    ? commands.slice(0, 3).map((c) => `\`${c.slice(0, 120)}\``).join(' → ')
    : '（該当コマンドなし — 次セッションで verify 群を再実行）';
  const errorNote = errors.length
    ? `<!-- errors: ${errors.slice(0, 3).map((e) => e.slice(0, 80)).join(' | ')} -->`
    : '';

  return [
    '',
    `## [${ymd}] ${title}`,
    '',
    '**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出',
    `**手順**: ${cmdLine}`,
    '**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結',
    `**exit**: ${commands.some((c) => c.includes('verify:cio-four-ai-governance')) ? 'verify:cio-four-ai-governance exit 0 で合格' : 'npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線'}`,
    '',
    errorNote,
  ].join('\n');
}

function fingerprint(block) {
  return block.replace(/\d{4}-\d{2}-\d{2}/g, 'DATE').slice(0, 200);
}

export function stockDebugTips(root, { exportedAt = new Date().toISOString() } = {}) {
  const tipsPath = path.join(root, TIPS_REL);
  fs.mkdirSync(path.dirname(tipsPath), { recursive: true });

  if (!fs.existsSync(tipsPath)) {
    fs.writeFileSync(tipsPath, `# デバッグ知恵ナレッジベース\n\n${MARKER}\n`, 'utf8');
  }

  const block = buildTipBlock(root, exportedAt);
  if (!block) {
    return { merged: false, reason: 'no-extractable-knowledge' };
  }

  let body = fs.readFileSync(tipsPath, 'utf8');
  const fp = fingerprint(block);
  if (body.includes(fp.slice(0, 80))) {
    return { merged: false, reason: 'duplicate-fingerprint' };
  }

  const idx = body.indexOf(MARKER);
  if (idx >= 0) {
    body = body.slice(0, idx + MARKER.length) + block + '\n' + body.slice(idx + MARKER.length);
  } else {
    body += `\n${MARKER}${block}\n`;
  }

  fs.writeFileSync(tipsPath, body, 'utf8');
  return { merged: true, path: TIPS_REL, blockLines: block.split('\n').length };
}

export { TIPS_REL, MARKER };
