#!/usr/bin/env node
/**
 * Hooks 自動検証 NG 時の **厳格回復ゲート**（CEO 指示: 失敗扱い・最初からやり直し・Desktop AI緊急用 全件再Read 必須）。
 * - 状態: `.cursor/hooks/state/ng-require-full-restart.json`
 * - 解除: `report-checksheet-validate.mjs` が **SUCCESS** したとき `clearNgGate()`／手動 `npm run hooks:gate-clear`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stateDir = path.join(root, '.cursor/hooks/state');
const gatePath = path.join(stateDir, 'ng-require-full-restart.json');

/** Desktop 側 AI緊急用（浜田 PC 既定・正本と同旨） */
export const DESKTOP_AI_EMERGENCY_WIN = 'C:\\Users\\mhamada202408224\\Desktop\\AI緊急用';

/** リポ相対: 細分化ルールの **読む順** 正本 */
export const CONSTITUTION_FIRST_READ_ORDER_REL = 'chat-sessions/constitution-first-read-pack/00-ORDER.txt';

export function setNgGate(reason, detail = {}) {
  try {
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(
      gatePath,
      JSON.stringify(
        {
          ts: Date.now(),
          iso: new Date().toISOString(),
          reason: String(reason || 'UNKNOWN'),
          ...detail,
        },
        null,
        2
      ),
      'utf8'
    );
  } catch {
    /* noop */
  }
}

export function clearNgGate() {
  try {
    fs.unlinkSync(gatePath);
  } catch {
    /* noop */
  }
}

export function readNgGate() {
  try {
    if (fs.existsSync(gatePath)) {
      return JSON.parse(fs.readFileSync(gatePath, 'utf8'));
    }
  } catch {
    /* noop */
  }
  return null;
}

/** フォロー文・追加コンテキスト末尾に付ける **同一文言**（重複防止の単一ソース） */
export function buildNgRecoverySuffix() {
  const desk = DESKTOP_AI_EMERGENCY_WIN.replace(/\\/g, '/');
  return (
    '\n\n【NG厳格・CEO指示】自動検証は**不合格＝失敗**です。**不合格ターンの応答を続けて積み増ししない**でください。\n' +
    '**必須（順不同ではなく、下記 1→2 の順）**:\n' +
    `1) \`${desk}\` 配下を **名前昇順** で **全ファイル** Read（**漏れ禁止**。各ファイルの Read 完了後、\`[ルール確認]\` 行に **フルパスを列挙**）。フォルダが無いときはチャットに **「AI緊急用フォルダ不在」** とパスを 1 行。\n` +
    `2) リポの \`${CONSTITUTION_FIRST_READ_ORDER_REL}\` に従い、**細分化パックを番号順に** Read（憲法・最重要ルールの先読み）。\n` +
    '3) 上記を**すべて**終えたら、**新規のユーザメッセージ**から要件を**最初から**送り直す（前ターンの「続き」は無効）。\n' +
    '**ゲート解除**: 次のエージェント応答が **検証 SUCCESS** した時点で自動消去。手動のみ: `npm run hooks:gate-clear`（浜田承認下）。'
  );
}

/** sessionStart 用: セッション初手の先読み指示（細分化・順序固定） */
/** beforeSubmitPrompt 用: NG ゲートが active のとき毎ターン先頭に注入 */
export function buildNgGateActivePendingPrefix() {
  const g = readNgGate();
  if (!g) return '';
  const reason = typeof g.reason === 'string' ? g.reason : 'UNKNOWN';
  const iso = typeof g.iso === 'string' ? g.iso : '';
  return `【Hooks NG 回復ゲート・active】前回失敗: **${reason}**（${iso}）\n${buildNgRecoverySuffix()}\n\n`;
}

export function buildSessionStartConstitutionReadBlock() {
  const absOrder = path.join(root, CONSTITUTION_FIRST_READ_ORDER_REL);
  let orderHint = '';
  try {
    if (fs.existsSync(absOrder)) {
      const lines = fs
        .readFileSync(absOrder, 'utf8')
        .split(/\r?\n/)
        .filter((l) => l.trim() !== '' && !l.trim().startsWith('#'))
        .slice(0, 12);
      orderHint = ` 順リスト先頭: ${lines.join(' → ')}`;
    }
  } catch {
    /* noop */
  }
  return (
    '\n\n【憲法・最重要ルール・先読み（CEO 指示・省略禁止）】\n' +
    '**本セッションで本題に入る前に**、次を **この順で** Read ツールで通読する（細分化・必ず最初）。\n' +
    `- 正本: \`${CONSTITUTION_FIRST_READ_ORDER_REL}\`（番号順に列挙された各ファイルを **1 件ずつ** Read）。${orderHint}\n` +
    '- 併せて `chat-sessions/checkpoint-latest.md` があれば **先頭 200 行**を Read（長い場合は要約方針に従い分割）。\n' +
    '完了後、`[ルール確認]` に **実際に Read したパス**を列挙する。'
  );
}

function cliClear() {
  clearNgGate();
  console.log('[hooks:gate-clear] ng-require-full-restart.json を削除しました（手動解除）。');
}

const selfPath = fileURLToPath(import.meta.url);
const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entryPath && path.resolve(entryPath) === path.resolve(selfPath)) {
  if (process.argv.includes('--clear')) {
    cliClear();
    process.exit(0);
  }
  console.log('Usage: node .cursor/hooks/ng-recovery-gate.mjs --clear');
  process.exit(2);
}
