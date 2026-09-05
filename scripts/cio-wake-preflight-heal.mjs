#!/usr/bin/env node
/**
 * WAKE bootstrap 前の残件予防（#S-WAKE-ORDER-01）
 *
 *   npm run cio:wake:preflight-heal
 *
 * 1) tmp-close(-report)?-YYYY-MM-DD.md を削除（締め済残骸・命名揺れ再発防止）
 * 2) rag-mirror 不一致なら 1 回 Self-Heal + stage（quick-health と同趣旨）
 * 3) Part C「今やってる主タスク」を checkpoint に合わせて同期（D-PARTC-01）
 * 4) phantom git dirty（hash=HEAD なのに M）と空白のみ .gitkeep を解消（B1 偽陽性）
 *
 * cold-start: Phase 5e（stamps 後・bootstrap 前）→ 続けて early wake-handoff-commit
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SESSION_STARTER_EVENING_UPDATE_REL } from './lib/session-starter-parts.mjs';
import { jstYmdIso } from './lib/repo-node-env.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runNode(script, args = []) {
  const r = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: 'utf8',
  });
  return {
    ok: r.status === 0,
    status: r.status ?? 1,
    out: (r.stdout || '').trim(),
    err: (r.stderr || '').trim(),
  };
}

function git(args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}

/**
 * 締め後に残る tmp-close 下書きを掃除。
 * 許容名: tmp-close-YYYY-MM-DD.md / tmp-close-report-YYYY-MM-DD.md
 * （SESSION-CLOSE-REPORT_*.txt 正本は対象外）
 */
const TMP_CLOSE_PURGE_RE = /^tmp-close(?:-report)?-\d{4}-\d{2}-\d{2}\.md$/i;

function purgeTmpCloseReports() {
  const dir = path.join(root, 'chat-sessions');
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const name of fs.readdirSync(dir)) {
    if (!TMP_CLOSE_PURGE_RE.test(name)) continue;
    fs.unlinkSync(path.join(dir, name));
    console.log(`[cio:wake:preflight-heal] purged chat-sessions/${name}`);
    n += 1;
  }
  return n;
}

/** rag 不一致 → 1 回 mirror + stage（無限ループ禁止） */
function healRagMirrorOnce() {
  const check = runNode('scripts/rag-mirror-canonical-docs.mjs', ['--check']);
  if (check.ok) {
    console.log('[cio:wake:preflight-heal] rag-mirror OK（heal 不要）');
    return false;
  }
  console.log('[cio:wake:preflight-heal] INFO rag-mirror drift → Self-Heal 1 回');
  if (check.err) console.log(check.err);
  if (check.out) console.log(check.out);
  const heal = runNode('scripts/rag-mirror-canonical-docs.mjs');
  if (!heal.ok) {
    console.error('[cio:wake:preflight-heal] ❌ rag:mirror:canonical-docs 失敗');
    if (heal.err) console.error(heal.err);
    if (heal.out) console.error(heal.out);
    process.exit(heal.status || 2);
  }
  const re = runNode('scripts/rag-mirror-canonical-docs.mjs', ['--check']);
  if (!re.ok) {
    console.error('[cio:wake:preflight-heal] ❌ Self-Heal 後も rag-mirror NG');
    if (re.err) console.error(re.err);
    process.exit(re.status || 2);
  }
  const add = git([
    'add',
    '--',
    '.rag/extra-docs/',
    'kintone-apps.md',
    'RULES-INDEX.md',
    'AGENTS.md',
    'WORKFLOW.md',
  ]);
  if (!add.ok) {
    console.warn('[cio:wake:preflight-heal] ⚠ rag stage 失敗（手動 git add .rag/extra-docs/）', add.err);
  } else {
    console.log('[cio:wake:preflight-heal] ✅ rag-mirror Self-Heal + staged');
  }
  return true;
}

/**
 * Windows 等で内容ハッシュが HEAD と同一なのに status=M になる phantom dirty を解消。
 * また request-compose-logs/.gitkeep が空白のみなら空ファイルへ戻す（B1 偽陽性防止）。
 */
function healPhantomGitDirty() {
  const st = git(['status', '--porcelain']);
  if (!st.ok || !st.out) return 0;
  let n = 0;
  for (const line of st.out.split('\n')) {
    const m = line.match(/^([ MADRCU?]{2})\s+(.+)$/);
    if (!m) continue;
    const code = m[1];
    const rel = m[2].replace(/^"|"$/g, '').replace(/\\/g, '/');
    if (!code.includes('M') && code.trim() !== 'M') continue;
    if (code[0] === '?' || code[1] === '?') continue;

    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;

    // .gitkeep が空白のみ → 空に戻して phantom/ノイズを止める
    if (/(^|\/)\.gitkeep$/.test(rel)) {
      const raw = fs.readFileSync(abs);
      if (raw.length > 0 && /^\s*$/.test(raw.toString('utf8'))) {
        fs.writeFileSync(abs, '');
        console.log(`[cio:wake:preflight-heal] .gitkeep 空白→空に復元 ${rel}`);
        n += 1;
      }
    }

    const work = git(['hash-object', '--', rel]);
    const head = git(['rev-parse', `HEAD:${rel}`]);
    if (!work.ok || !head.ok) continue;
    if (work.out && head.out && work.out === head.out) {
      const co = git(['checkout', '--', rel]);
      if (co.ok) {
        console.log(`[cio:wake:preflight-heal] phantom dirty 解消（hash一致） ${rel}`);
        n += 1;
      }
    }
  }
  if (n === 0) {
    console.log('[cio:wake:preflight-heal] phantom dirty なし');
  }
  return n;
}

/**
 * 前日以前の closeStatus=closing を closed へ戻す（途中締めの見た目を残さない）。
 * 日付 #D-CLOSE-02 の WAKE スキップは freshness --wake-context（open 含む）側。
 * 当日の締め途中（最終更新=当日）は触らない。
 */
function healStuckClosingStatus() {
  const cpPath = path.join(root, 'chat-sessions', 'checkpoint-latest.md');
  if (!fs.existsSync(cpPath)) return false;
  let text = fs.readFileSync(cpPath, 'utf8');
  const updatedM = text.match(/\*\*最終更新\*\*\s*:\s*(\d{4}-\d{2}-\d{2})/);
  const statusM = text.match(/\*\*closeStatus\*\*\s*:\s*(\S+)/i);
  if (!updatedM || !statusM) return false;
  const updatedYmd = updatedM[1];
  const statusRaw = statusM[1].trim();
  const status = statusRaw.toLowerCase().replace(/[,;.]+$/, '');
  const today = jstYmdIso();
  if (status !== 'closing') return false;
  if (!(updatedYmd < today)) {
    console.log(
      `[cio:wake:preflight-heal] closeStatus=closing だが最終更新=${updatedYmd}（当日）— 締め途中として不触`,
    );
    return false;
  }
  text = text.replace(
    /(\*\*closeStatus\*\*\s*:\s*)closing\b/i,
    '$1closed',
  );
  fs.writeFileSync(cpPath, text, 'utf8');
  console.log(
    `[cio:wake:preflight-heal] ✅ stuck closing→closed（最終更新=${updatedYmd} < ${today} · reason=auto-heal-stuck-closing）`,
  );
  return true;
}

/**
 * Part C 主タスクを checkpoint の「次の1手」「最終更新」に同期。
 * evening-reflect の代替ではない（夕反省ブロックは触らない）— WAKE 誤誘導だけ防ぐ。
 */
function syncPartCFromCheckpoint() {
  const partRel = SESSION_STARTER_EVENING_UPDATE_REL;
  const partPath = path.join(root, partRel);
  const cpPath = path.join(root, 'chat-sessions', 'checkpoint-latest.md');
  if (!fs.existsSync(partPath) || !fs.existsSync(cpPath)) {
    console.warn('[cio:wake:preflight-heal] Part C / checkpoint 欠落 — sync スキップ');
    return false;
  }
  const cpTxt = fs.readFileSync(cpPath, 'utf8');
  const partTxt = fs.readFileSync(partPath, 'utf8');
  const updated = cpTxt.match(/\*\*最終更新\*\*:\s*(.+)/);
  const next = cpTxt.match(/\*\*次の1手\*\*:\s*(.+)/);
  if (!updated || !next) {
    console.warn('[cio:wake:preflight-heal] checkpoint 最終更新/次の1手 欠落 — Part C sync スキップ');
    return false;
  }
  const ymdMatch = updated[1].match(/(20\d{2}-\d{2}-\d{2})/);
  const ymd = ymdMatch ? ymdMatch[1] : jstYmdIso();
  const wakeYmd = jstYmdIso();
  const nextLine = next[1].trim();
  const newBlock =
    `【今やってる主タスク（${ymd} 反映・${wakeYmd} WAKE同期）】\n` +
    `- 本日レーン: ${nextLine}\n` +
    `- checkpoint: ${updated[1].trim()}\n` +
    `- 正本: \`chat-sessions/checkpoint-latest.md\` · closures は同ファイルのクローズ表\n` +
    `- 触らない: checkpoint「保留・その他の制約」表を正（688 / 677–679 / SKYSEA実配信 / 712 / 736 等）\n` +
    `- 詳細 BUILD/rev: checkpoint「本日アクティブ」表を正（本ブロックは要約のみ）\n`;

  if (!/【今やってる主タスク[^】]*】/.test(partTxt)) {
    console.warn('[cio:wake:preflight-heal] Part C に主タスクブロック無し — sync スキップ');
    return false;
  }
  const nextTxt = partTxt.replace(
    /【今やってる主タスク[^】]*】[\s\S]*?(?=\n\n【|\n\n##|\n```|$)/,
    newBlock.trimEnd() + '\n',
  );
  if (nextTxt === partTxt) {
    console.log('[cio:wake:preflight-heal] Part C 既に同期相当（書込なし）');
    return false;
  }
  fs.writeFileSync(partPath, nextTxt, 'utf8');
  console.log(`[cio:wake:preflight-heal] ✅ Part C 主タスクを checkpoint に同期 → ${partRel}`);
  const fresh = runNode('scripts/verify-part-c-main-task-freshness.mjs');
  if (!fresh.ok) {
    console.warn('[cio:wake:preflight-heal] ⚠ verify:part-c なお NG:', fresh.err || fresh.out);
  }
  return true;
}

function main() {
  console.log('[cio:wake:preflight-heal] start (#S-WAKE-ORDER-01)');
  const purged = purgeTmpCloseReports();
  const ragHealed = healRagMirrorOnce();
  const phantom = healPhantomGitDirty();
  const closingHealed = healStuckClosingStatus();
  const partSynced = syncPartCFromCheckpoint();
  console.log(
    `[cio:wake:preflight-heal] OK purged=${purged} ragHealed=${ragHealed} phantom=${phantom} closingHeal=${closingHealed} partC=${partSynced}`,
  );
}

main();
