#!/usr/bin/env node
/**
 * 第2者（DeepSeek / Kimi）スロットを JSON に残し、`verify` で機械判定する（＝「合意」の外部化）。
 * MCP を直接呼ばない — CIO が各ツールで得た要約を `--add` で刻む。
 *
 *   node scripts/cio-consensus-seal.mjs seal --topic "..." --cio "1行"
 *   node scripts/cio-consensus-seal.mjs add --who deepseek --text "1行以上"
 *   node scripts/cio-consensus-seal.mjs add --who kimi --text "1行以上"
 *   node scripts/cio-consensus-seal.mjs ceo --line "CEO承認1行（例: SLO方針GO）"
 *   node scripts/cio-consensus-seal.mjs verify
 *   node scripts/cio-consensus-seal.mjs verify --if-present   # ファイル無し／topic 空なら exit 0（CI 用）
 *   node scripts/cio-consensus-seal.mjs clear
 *
 * verify: (deepseek+kimi 両方 non-empty) OR ceoLine non-empty → exit 0
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const statePath = path.join(root, 'chat-sessions', 'cio-consensus-seal.json');
const logPath = path.join(root, 'logs', 'cio-consensus-seal.log');

function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '';
      o[k] = v;
    } else o._.push(a);
  }
  return o;
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeState(obj) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `${JSON.stringify({ ts: new Date().toISOString(), ...obj })}\n`, 'utf8');
}

function main() {
  const a = parseArgs(process.argv);
  const cmd = a._[0] || 'help';

  if (cmd === 'seal') {
    const topic = String(a.topic || '').trim();
    const cio = String(a.cio || '').trim();
    if (!topic || !cio) {
      // eslint-disable-next-line no-console
      console.error('need --topic and --cio');
      process.exit(2);
    }
    const rec = {
      topic: topic,
      cioHypothesis: cio,
      deepseek: '',
      kimi: '',
      ceoLine: '',
      updatedAt: new Date().toISOString(),
    };
    writeState(rec);
    // eslint-disable-next-line no-console
    console.log(`OK ${path.relative(root, statePath)}`);
    process.exit(0);
  }

  if (cmd === 'add') {
    const who = String(a.who || '').toLowerCase();
    const text = String(a.text || '').trim();
    if (!text || (who !== 'deepseek' && who !== 'kimi')) {
      // eslint-disable-next-line no-console
      console.error('need --who deepseek|kimi --text "..."');
      process.exit(2);
    }
    const st = readState();
    if (!st || !st.topic) {
      // eslint-disable-next-line no-console
      console.error('no active seal; run seal first');
      process.exit(2);
    }
    st[who] = text;
    st.updatedAt = new Date().toISOString();
    writeState(st);
    // eslint-disable-next-line no-console
    console.log(`OK appended ${who}`);
    process.exit(0);
  }

  if (cmd === 'ceo') {
    const line = String(a.line || '').trim();
    if (!line) {
      // eslint-disable-next-line no-console
      console.error('need --line "..."');
      process.exit(2);
    }
    const st = readState() || {};
    st.ceoLine = line;
    st.updatedAt = new Date().toISOString();
    writeState(st);
    // eslint-disable-next-line no-console
    console.log('OK ceo line');
    process.exit(0);
  }

  if (cmd === 'verify') {
    const ifPresent = process.argv.includes('--if-present');
    const st = readState();
    if (!st) {
      if (ifPresent) {
        // eslint-disable-next-line no-console
        console.log('OK (no seal file, verify skipped)');
        process.exit(0);
      }
      // eslint-disable-next-line no-console
      console.error('NO_SEAL_FILE');
      process.exit(2);
    }
    const topic = String(st.topic || '').trim();
    if (!topic) {
      if (ifPresent) {
        // eslint-disable-next-line no-console
        console.log('OK (inactive seal / empty topic, verify skipped)');
        process.exit(0);
      }
      // eslint-disable-next-line no-console
      console.error('NO_ACTIVE_TOPIC');
      process.exit(2);
    }
    const ds = String(st.deepseek || '').trim();
    const km = String(st.kimi || '').trim();
    const ceo = String(st.ceoLine || '').trim();
    const ok = (ds && km) || ceo;
    if (!ok) {
      // eslint-disable-next-line no-console
      console.error('CONSENSUS_INCOMPLETE need deepseek+kimi or ceo --line');
      process.exit(1);
    }
    // eslint-disable-next-line no-console
    console.log('OK consensus verified');
    process.exit(0);
  }

  if (cmd === 'clear') {
    try {
      fs.unlinkSync(statePath);
    } catch {
      /* noop */
    }
    // eslint-disable-next-line no-console
    console.log('cleared');
    process.exit(0);
  }

  // eslint-disable-next-line no-console
  console.error('commands: seal | add | ceo | verify [--if-present] | clear');
  process.exit(2);
}

main();
