#!/usr/bin/env node
/**
 * 683 ダッシュ用 Ollama 中継（社内・Node 標準ライブラリのみ）。
 * kintone（HTTPS）から呼ぶ場合は本プロセスの前段で **HTTPS 終端**を置くこと
 * （ブラウザの混在コンテンツ制約のため HTTP 直では失敗しやすい）。
 *
 *   OLLAMA_HOST=http://127.0.0.1:11434 OLLAMA_MODEL=llama3.2 USER683_RELAY_PORT=17883 node scripts/user683-ollama-relay.mjs
 *
 * npm: `npm run user683:ollama-relay`（`.env` / `.env.proxy` を dotenv で読み込み → `OLLAMA_MODEL` 等が有効）
 * 単体 `node …/user683-ollama-relay.mjs` のときは **カレントの `.env`** も読む（`import dotenv/config`）。
 */
import 'dotenv/config';
import http from 'node:http';
import { URL } from 'node:url';

/** 起動ログ・`X-Relay-Build`・エラー末尾と突合する（どの中継が応答したかの判別用） */
const RELAY_BUILD = '2026-05-16-user683-ollama-relay-weeks6';
const MAX_WEEK_BATCH = 6;

const PORT = Number(process.env.USER683_RELAY_PORT || 17883);
const OLLAMA = (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434').replace(/\/$/, '');
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const ALLOW_ORIGIN = process.env.USER683_CORS_ORIGIN || '*';
const OLLAMA_GEN_MS = Number(process.env.USER683_OLLAMA_TIMEOUT_MS || 120000);
const MAX_BODY = 2 * 1024 * 1024;

function cors() {
  return {
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Expose-Headers': 'X-Relay-Build',
  };
}

async function ollamaOnce(prompt) {
  const p = (prompt || '').trim();
  if (!p) {
    return '（集計対象の要約元テキストがありません）';
  }
  const ac = new AbortController();
  const t = setTimeout(function () {
    ac.abort();
  }, OLLAMA_GEN_MS);
  try {
    const url = OLLAMA + '/api/generate';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ac.signal,
      body: JSON.stringify({
        model: MODEL,
        prompt:
          '以下は社内ユーザサポートの日次対応メモの抜粋です。日本語で、箇条書き3点以内・合計200字以内で要約してください。余計な前置きは不要。\n\n' +
          p,
        stream: false,
      }),
    });
    const rawText = await res.text();
    if (!res.ok) {
      let hint404 = '';
      if (res.status === 404) {
        hint404 =
          '（404: **OLLAMA_HOST 先**で `ollama list` の NAME を `.env` の `OLLAMA_MODEL=` に**書き**、**この中継だけ**再起動。未 pull ならその NAME で `ollama pull`。body の model 名と末尾 **実際に送った model** が違えば **別プロセスの中継**に当たっている。URL: ' +
          url +
          '）';
      }
      const tail = rawText.replace(/\s+/g, ' ').trim().slice(0, 180);
      const who = ' [ollama-relay build=' + RELAY_BUILD + ' model=' + MODEL + ' ollama=' + OLLAMA + ']';
      return '（Ollama HTTP ' + res.status + hint404 + (tail ? ' body: ' + tail : '') + '）' + who;
    }
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e2) {
      return rawText.trim().slice(0, 500);
    }
    return data && data.response ? String(data.response).trim() : '';
  } catch (e) {
    const name = e && e.name === 'AbortError' ? 'timeout' : String((e && e.message) || e);
    return '（Ollama エラー: ' + name + '） [ollama-relay build=' + RELAY_BUILD + ' model=' + MODEL + ' ollama=' + OLLAMA + ']';
  } finally {
    clearTimeout(t);
  }
}

const server = http.createServer(function (req, res) {
  const host = req.headers.host || 'localhost';
  const u = new URL(req.url || '/', 'http://' + host);
  if (u.pathname !== '/user683/summarize') {
    res.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Relay-Build': RELAY_BUILD,
    });
    res.end('not found');
    return;
  }

  const baseHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Relay-Build': RELAY_BUILD,
    ...cors(),
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, baseHeaders);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, baseHeaders);
    res.end(JSON.stringify({ error: 'method' }));
    return;
  }

  let size = 0;
  const chunks = [];
  req.on('data', function (c) {
    size += c.length;
    if (size > MAX_BODY) {
      req.destroy();
    } else {
      chunks.push(c);
    }
  });
  req.on('end', async function () {
    if (size > MAX_BODY) {
      return;
    }
    let payload;
    try {
      payload = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    } catch {
      res.writeHead(400, baseHeaders);
      res.end(JSON.stringify({ error: 'json' }));
      return;
    }

    const peer = (req.socket && req.socket.remoteAddress) || '';
    const hdrHost = req.headers.host || '';
    console.log(
      '[user683-ollama-relay] POST client=' +
        peer +
        ' Host=' +
        hdrHost +
        ' -> Ollama model=' +
        MODEL +
        ' ollama=' +
        OLLAMA +
        ' env.OLLAMA_MODEL=' +
        JSON.stringify(process.env.OLLAMA_MODEL || ''),
    );

    const rawWeeks = payload.weeks && Array.isArray(payload.weeks) ? payload.weeks : [];
    const nWeek = Math.min(MAX_WEEK_BATCH, rawWeeks.length);

    const weekSummaries = [];
    for (let i = 0; i < nWeek; i += 1) {
      const c = rawWeeks[i] && rawWeeks[i].corpus != null ? String(rawWeeks[i].corpus) : '';
      weekSummaries.push(await ollamaOnce(c));
    }
    const mc = payload.month && payload.month.corpus != null ? String(payload.month.corpus) : '';
    const monthSummary = await ollamaOnce(mc);

    res.writeHead(200, baseHeaders);
    res.end(JSON.stringify({ weekSummaries: weekSummaries, monthSummary: monthSummary }));
  });
  req.on('error', function () {
    try {
      res.writeHead(400, baseHeaders);
      res.end(JSON.stringify({ error: 'request' }));
    } catch {
      /* ignore */
    }
  });
});

server.listen(PORT, '0.0.0.0', function () {
  console.log(
    '[user683-ollama-relay] RELAY_BUILD=' +
      RELAY_BUILD +
      '  http://0.0.0.0:' +
      PORT +
      '  POST /user683/summarize  ->  ' +
      OLLAMA +
      '  model=' +
      MODEL +
      '  env.OLLAMA_MODEL=' +
      JSON.stringify(process.env.OLLAMA_MODEL || ''),
  );
});
