#!/usr/bin/env node
/**
 * parallel-session-detector.mjs — §51-4 並列セッション疑い 4 軸機械判定
 *
 * 4 軸 (各軸に重み付き点数):
 *   軸 1: watcher_pid 不一致 (+5)   = 副次 watcher が「十分な件数」で主 watcher と並立（再起動残骸のみは除外）
 *   軸 2: 同一ファイル過密編集 (+2) = 同一 file が 5 分以内に 5 件以上変化記録
 *   軸 3: session-lock 不在編集 (+3) = jsonl 変更ありかつ直近 10 分以内に lock acquire ログなし
 *   軸 4: 不審なバックアップ命名 (+4) = .b7-pre-* / .tsb-*-pre-* / .proposal-pre-* 等が出現
 *
 * 判定閾値:
 *   0-2 点: 🟢 静穏
 *   3-4 点: 🟡 注意 (朝報追記)
 *   5-6 点: 🟠 警報 (作業中断 + 浜田 GO 待ち)
 *   7+ 点: 🔴 確定 (即 abort + 段階 2 候補)
 *
 * 使い方:
 *   node scripts/parallel-session-detector.mjs            標準実行
 *   node scripts/parallel-session-detector.mjs --json     朝報・smoke-test 用
 *   node scripts/parallel-session-detector.mjs --explain  軸ごとの内訳詳細
 *   node scripts/parallel-session-detector.mjs --ignore-suspicion=<reason>  誤検知を一時 skip
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const JSONL_PATH = path.join(REPO_ROOT, 'logs', 'file-watcher', 'agents-md-changes.jsonl');
const LOCK_FILE_PATH = path.join(REPO_ROOT, '.session-state', 'ai-session.lock');
const SUSPICION_DIR = path.join(REPO_ROOT, 'logs', 'parallel-suspicion');
const FALSE_POSITIVE_LOG = path.join(SUSPICION_DIR, 'false-positive.jsonl');

/** 憲法 jsonl は無期限だと watcher 再起動の旧 pid が軸1に残り続けるため、直近のみ評価 */
const JSONL_LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000;

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function nowJstIso() {
  const now = new Date();
  return new Date(now.getTime() + JST_OFFSET_MS).toISOString().replace('Z', '+09:00');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadJsonlEntries() {
  if (!fs.existsSync(JSONL_PATH)) return [];
  try {
    const lines = fs.readFileSync(JSONL_PATH, 'utf8').trim().split('\n').filter(Boolean);
    return lines.map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

/** 軸 1: 副次 pid がこの件数未満なら「主 pid の取りこぼし」とみなし並列にしない */
const AXIS1_MIN_SECONDARY_EVENTS = 5;
/** 主 pid 件数に対する副次の最低比率（再起動で旧 pid が数件だけ残るパターンを除外） */
const AXIS1_MIN_SECONDARY_RATIO = 0.12;

/**
 * 軸 1: watcher_pid 不一致検知
 * **2 つ以上の pid がそれぞれ 3 件以上**あるうえで、**2 位の件数がしきい値以上**のときだけ +5。
 * しきい値 = max(AXIS1_MIN_SECONDARY_EVENTS, floor(主件数 × AXIS1_MIN_SECONDARY_RATIO))。
 * watcher 再起動で旧 pid が少数行だけ残る（例: 3 件 vs 99 件）は並列ではない（朝報 smoke 誤警報対策）。
 */
function axis1WatcherPidMismatch(entries) {
  const pidCounts = {};
  for (const e of entries) {
    if (e.watcher_pid) {
      pidCounts[e.watcher_pid] = (pidCounts[e.watcher_pid] || 0) + 1;
    }
  }
  const summary = Object.entries(pidCounts).map(([pid, n]) => `pid=${pid} (${n} 件)`);
  const sortedDesc = Object.entries(pidCounts).sort((a, b) => b[1] - a[1]);
  const withMin3 = sortedDesc.filter(([, n]) => n >= 3);
  let isMismatch = false;
  let secondaryFloor = 0;
  if (withMin3.length >= 2) {
    const primary = withMin3[0][1];
    const secondary = withMin3[1][1];
    secondaryFloor = Math.max(
      AXIS1_MIN_SECONDARY_EVENTS,
      Math.floor(AXIS1_MIN_SECONDARY_RATIO * primary),
    );
    isMismatch = secondary >= secondaryFloor;
  }
  const activePidsGe3 = Object.keys(pidCounts).filter((pid) => pidCounts[pid] >= 3);
  const evidence = [];
  if (summary.length === 0) {
    evidence.push('watcher_pid 記録なし');
  } else {
    evidence.push(...summary);
    if (isMismatch) {
      evidence.push(`（2 位の件数 >= ${secondaryFloor} → 並列疑い +5）`);
    } else if (activePidsGe3.length >= 2) {
      evidence.push(
        `（2 位の件数 < ${secondaryFloor} = max(${AXIS1_MIN_SECONDARY_EVENTS}, ${Math.round(AXIS1_MIN_SECONDARY_RATIO * 100)}%×主件数) → watcher 再起動残骸の可能性、並列疑いなし）`,
      );
    } else if (activePidsGe3.length === 0 && summary.length > 0) {
      evidence.push('（いずれの watcher_pid も 3 件未満 → 並列疑いなし）');
    } else {
      evidence.push('（3 件以上の記録がある watcher_pid が 1 種類のみ → 並列疑いなし）');
    }
  }
  return {
    score: isMismatch ? 5 : 0,
    evidence,
    pid_count: Object.keys(pidCounts).length,
    active_pid_count_3plus: activePidsGe3.length,
    secondary_floor: withMin3.length >= 2 ? secondaryFloor : null,
  };
}

/**
 * 軸 2: 同一ファイル過密編集（**複数 watcher_pid が同一 5 分窓に混在**するときのみ +2）
 * 単一 pid の連続保存は 1 セッションの憲法ファイル連続編集であり並列ではない。
 */
function axis2BurstEdit(entries) {
  const WINDOW_MS = 5 * 60 * 1000;
  const THRESHOLD = 5;
  const offenders = [];
  const byFile = {};
  for (const e of entries) {
    if (!e.file) continue;
    if (!byFile[e.file]) byFile[e.file] = [];
    byFile[e.file].push({
      t: new Date(e.time).getTime(),
      pid: e.watcher_pid,
    });
  }
  for (const [file, evs] of Object.entries(byFile)) {
    evs.sort((a, b) => a.t - b.t);
    for (let i = 0; i < evs.length; i++) {
      const pids = new Set();
      let j = i;
      for (; j < evs.length && evs[j].t - evs[i].t <= WINDOW_MS; j++) {
        if (evs[j].pid) pids.add(evs[j].pid);
      }
      const cnt = j - i;
      if (cnt >= THRESHOLD && pids.size >= 2) {
        offenders.push(`${file}: ${cnt} 件 / 5 分間 / watcher_pid=${[...pids].join(',')}`);
        break;
      }
    }
  }
  return {
    score: offenders.length > 0 ? 2 : 0,
    evidence: offenders.length ? offenders : ['同一 5 分窓に複数 pid で 5 件超の連続なし'],
    burst_count: offenders.length,
  };
}

/**
 * 軸 3: session-lock 不在編集
 * jsonl に直近 10 分の編集があるが、`.session-state/ai-session.lock` (有効 lock) がない = +3
 *
 * 有効 lock の判定:
 *   - is_manual=true → 常に有効 (release されるまで)
 *   - is_manual=false → pid が生きているかで判断 (本 detector は別 Node プロセスなので process.kill は使わず簡易チェック)
 *   - lock file が存在し JSON parse 成功すればまず「有効」とみなす (false positive 抑止寄り)
 */
function axis3NoLock(entries) {
  const WINDOW_MS = 10 * 60 * 1000;
  const cutoff = Date.now() - WINDOW_MS;
  const recentEdits = entries.filter((e) => new Date(e.time).getTime() >= cutoff);
  if (recentEdits.length === 0) {
    return { score: 0, evidence: ['直近 10 分に編集なし → 判定スキップ'], no_recent_edits: true };
  }
  if (!fs.existsSync(LOCK_FILE_PATH)) {
    return {
      score: 3,
      evidence: [`直近 10 分に ${recentEdits.length} 件の編集 / .session-state/ai-session.lock 不在 (L-1 違反疑い)`],
      lock_exists: false,
    };
  }
  let lock = null;
  try {
    lock = JSON.parse(fs.readFileSync(LOCK_FILE_PATH, 'utf8'));
  } catch (e) {
    return {
      score: 3,
      evidence: [`lock file 破損 (${e.message}) / 直近 10 分に ${recentEdits.length} 件の編集`],
      lock_corrupt: true,
    };
  }
  let alive = false;
  if (lock.is_manual === true) {
    alive = true;
  } else if (typeof lock.pid === 'number') {
    try {
      process.kill(lock.pid, 0);
      alive = true;
    } catch (e) {
      alive = e.code === 'EPERM';
    }
  }
  if (!alive) {
    return {
      score: 3,
      evidence: [`lock file 存在するが pid ${lock.pid} が dead / 直近 10 分に ${recentEdits.length} 件の編集 (stale lock)`],
      lock_stale: true,
      lock_holder: lock.holder,
    };
  }
  return {
    score: 0,
    evidence: [`直近 10 分: 編集 ${recentEdits.length} 件 / lock 保有 (holder=${lock.holder}, manual=${!!lock.is_manual}) → 整合`],
  };
}

/**
 * 軸 4: 不審なバックアップ命名
 * .b7-pre-* / .tsb-*-pre-* / .proposal-pre-* / .session-handoff-* が出現 = +4
 */
function axis4SuspiciousBackup() {
  const SUSPICIOUS_PATTERNS = [
    /\.b7-pre-/,
    /\.tsb-\d+-pre-/,
    /\.proposal-pre-/,
    /\.session-handoff-/,
    /\.parallel-takeover-/,
  ];
  const ALLOWED_PATTERNS = [
    /\.bak\.\d+/,
    /\.bak$/,
    /\.swp$/,
  ];
  const found = [];
  try {
    const entries = fs.readdirSync(REPO_ROOT, { withFileTypes: true });
    for (const e of entries) {
      const name = e.name;
      if (!name.startsWith('.')) continue;
      if (ALLOWED_PATTERNS.some((p) => p.test(name))) continue;
      if (SUSPICIOUS_PATTERNS.some((p) => p.test(name))) {
        found.push(name);
      }
    }
  } catch { /* ignore */ }
  return {
    score: found.length > 0 ? 4 : 0,
    evidence: found.length > 0 ? found : ['不審なバックアップ命名なし'],
    suspicious_count: found.length,
  };
}

function verdict(score) {
  if (score >= 7) return { level: 'RED_CONFIRMED', icon: '🔴', label: '確定 (即 abort + L-6 候補)' };
  if (score >= 5) return { level: 'ORANGE_ALERT', icon: '🟠', label: '警報 (作業中断 + 浜田 GO 待ち)' };
  if (score >= 3) return { level: 'YELLOW_NOTICE', icon: '🟡', label: '注意 (朝報追記)' };
  return { level: 'GREEN_CALM', icon: '🟢', label: '静穏 (通常運用継続)' };
}

function detectArgs(argv) {
  const out = { json: false, explain: false, ignoreReason: null };
  for (const a of argv) {
    if (a === '--json') out.json = true;
    else if (a === '--explain') out.explain = true;
    else if (a.startsWith('--ignore-suspicion=')) out.ignoreReason = a.split('=').slice(1).join('=');
  }
  return out;
}

function logFalsePositive(reason, result) {
  ensureDir(SUSPICION_DIR);
  const entry = {
    detected_at: nowJstIso(),
    skipped_with_reason: reason,
    score: result.score_total,
    verdict: result.verdict,
    axis_breakdown: result.axis_breakdown,
  };
  fs.appendFileSync(FALSE_POSITIVE_LOG, JSON.stringify(entry) + '\n', 'utf8');
}

function saveSuspicionSnapshot(result) {
  if (result.score_total < 5) return null;
  ensureDir(SUSPICION_DIR);
  const ts = nowJstIso().replace(/[:.+]/g, '-').slice(0, 16);
  const fn = path.join(SUSPICION_DIR, `${ts}-score${result.score_total}.json`);
  fs.writeFileSync(fn, JSON.stringify(result, null, 2) + '\n', 'utf8');
  return fn;
}

function filterEntriesByLookback(entries) {
  const cut = Date.now() - JSONL_LOOKBACK_MS;
  return entries.filter((e) => {
    const t = new Date(e.time).getTime();
    return Number.isFinite(t) && t >= cut;
  });
}

function main() {
  const args = detectArgs(process.argv.slice(2));
  const raw = loadJsonlEntries();
  const entries = filterEntriesByLookback(raw);
  const a1 = axis1WatcherPidMismatch(entries);
  const a2 = axis2BurstEdit(entries);
  const a3 = axis3NoLock(entries);
  const a4 = axis4SuspiciousBackup();
  const scoreTotal = a1.score + a2.score + a3.score + a4.score;
  const v = verdict(scoreTotal);

  const result = {
    detected_at: nowJstIso(),
    score_total: scoreTotal,
    verdict: v.level,
    verdict_icon: v.icon,
    verdict_label: v.label,
    jsonl_entries_examined: entries.length,
    jsonl_entries_raw: raw.length,
    jsonl_lookback_ms: JSONL_LOOKBACK_MS,
    axis_breakdown: {
      axis1_watcher_pid_mismatch: {
        score: a1.score,
        evidence: a1.evidence,
        pid_count: a1.pid_count,
        active_pid_count_3plus: a1.active_pid_count_3plus,
      },
      axis2_burst_edit: { score: a2.score, evidence: a2.evidence, burst_count: a2.burst_count },
      axis3_no_lock: { score: a3.score, evidence: a3.evidence },
      axis4_suspicious_backup: { score: a4.score, evidence: a4.evidence, suspicious_count: a4.suspicious_count },
    },
  };

  if (args.ignoreReason && scoreTotal >= 3) {
    logFalsePositive(args.ignoreReason, result);
    result.ignored = { reason: args.ignoreReason, logged_to: FALSE_POSITIVE_LOG };
  }

  if (scoreTotal >= 5 && !args.ignoreReason) {
    const fn = saveSuspicionSnapshot(result);
    if (fn) result.snapshot_saved_to = fn;
  }

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    return scoreTotal >= 5 ? 2 : (scoreTotal >= 3 ? 1 : 0);
  }

  console.log(`### §51-4 並列セッション疑い判定 (${nowJstIso()})`);
  console.log('');
  console.log(`**総合スコア**: ${scoreTotal} 点 / ${v.icon} ${v.label}`);
  console.log(`**jsonl 検査件数**: ${entries.length} 件（全 ${raw.length} 件中・直近 ${Math.round(JSONL_LOOKBACK_MS / 86400000)} 日）`);
  if (result.ignored) console.log(`**⚠️ ignore-suspicion 指定**: ${result.ignored.reason} (履歴: ${result.ignored.logged_to})`);
  if (result.snapshot_saved_to) console.log(`**🔴 スナップショット保全**: ${result.snapshot_saved_to}`);
  console.log('');

  if (args.explain || scoreTotal > 0) {
    console.log('| 軸 | スコア | 内訳 |');
    console.log('|---|---:|---|');
    console.log(`| 軸 1: watcher_pid 不一致 | ${a1.score} | ${a1.evidence.join(' / ')} |`);
    console.log(`| 軸 2: 同一ファイル過密編集 | ${a2.score} | ${a2.evidence.join(' / ') || '該当なし'} |`);
    console.log(`| 軸 3: session-lock 不在編集 | ${a3.score} | ${a3.evidence.join(' / ')} |`);
    console.log(`| 軸 4: 不審なバックアップ命名 | ${a4.score} | ${a4.evidence.join(' / ')} |`);
    console.log('');
  }

  if (scoreTotal >= 7) {
    console.log('🔴 **AI 動作**: 即座に session-lock を release + 自分側 abort してください。L-6 (段階 2 force kill) 候補に追加。');
  } else if (scoreTotal >= 5) {
    console.log('🟠 **AI 動作**: 作業を中断し、浜田に「§51-4 警報」として GO 待ち報告してください。');
  } else if (scoreTotal >= 3) {
    console.log('🟡 **AI 動作**: 朝報 §5-5 に追記 + AI 開口一番に報告してください。作業継続可。');
  } else {
    console.log('🟢 通常運用継続 OK');
  }

  return scoreTotal >= 5 ? 2 : (scoreTotal >= 3 ? 1 : 0);
}

const exitCode = main();
process.exit(exitCode);
