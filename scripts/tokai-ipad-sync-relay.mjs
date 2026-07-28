#!/usr/bin/env node
/**
 * 東海支店 iPad 管理台帳 (Dash 770) 用の同期中継 HTTP サーバ。
 *
 * tokai ユーザは 595(社員マスタ) / 674(PC台帳) に画面/API 直アクセス不可のため、
 * ブラウザからは本中継経由でのみ検索・同期を行う。
 *
 * - 127.0.0.1 のみ待受（社内・端末ローカルで運用する想定）
 * - 管理者資格情報は `getKintoneConfig()` から読む（.env に KINTONE_USERNAME/KINTONE_PASSWORD）
 * - 返却は "ヒットの有無/内容" のみ。パスワード等の生値以外の管理者情報は返さない。
 *
 * 起動:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/tokai-ipad-sync-relay.mjs
 *   TOKAI_IPAD_RELAY_PORT=17969 の変更で待受ポート変更可。
 */
import 'dotenv/config';
import http from 'node:http';
import { URL } from 'node:url';
import { getKintoneConfig, LOCATIONS } from './lib/tokai-ipad-kintone.mjs';

const RELAY_BUILD = '2026-07-28-tokai-ipad-sync-relay-v1';
const PORT = Number(process.env.TOKAI_IPAD_RELAY_PORT || 17969);
const HOST = process.env.TOKAI_IPAD_RELAY_HOST || '127.0.0.1';
const ALLOW_ORIGIN = process.env.TOKAI_IPAD_RELAY_CORS_ORIGIN || '*';
const MAX_BODY = 512 * 1024;
const APP_EMP_MASTER = Number(process.env.TOKAI_IPAD_EMP_APP || 595);
const APP_PC_LEDGER = Number(process.env.TOKAI_IPAD_PC_APP || 674);
const FETCH_TIMEOUT_MS = Number(process.env.TOKAI_IPAD_RELAY_TIMEOUT_MS || 15000);

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Expose-Headers': 'X-Relay-Build',
  };
}

function baseHeaders() {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Relay-Build': RELAY_BUILD,
    ...corsHeaders(),
  };
}

function respond(res, status, body) {
  res.writeHead(status, baseHeaders());
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise(function (resolve, reject) {
    let size = 0;
    const chunks = [];
    req.on('data', function (c) {
      size += c.length;
      if (size > MAX_BODY) {
        req.destroy();
        reject(new Error('body too large'));
        return;
      }
      chunks.push(c);
    });
    req.on('end', function () {
      const buf = Buffer.concat(chunks).toString('utf8');
      if (!buf) return resolve({});
      try {
        resolve(JSON.parse(buf));
      } catch {
        reject(new Error('invalid json'));
      }
    });
    req.on('error', reject);
  });
}

function escapeQueryValue(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

async function kintoneGet(path, params) {
  const { baseUrl, headers } = getKintoneConfig();
  const url = new URL(`${baseUrl}/k${path}`);
  Object.entries(params || {}).forEach(function (entry) {
    const k = entry[0];
    const v = entry[1];
    if (Array.isArray(v)) {
      v.forEach(function (item, i) {
        url.searchParams.set(`${k}[${i}]`, String(item));
      });
    } else if (v != null) {
      url.searchParams.set(k, String(v));
    }
  });
  const ac = new AbortController();
  const timer = setTimeout(function () { ac.abort(); }, FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { ...headers, 'Content-Type': undefined },
      signal: ac.signal,
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* noop */ }
    if (!res.ok) {
      const msg = json?.message || text.slice(0, 400);
      const err = new Error(`kintone HTTP ${res.status}: ${msg}`);
      err.status = res.status;
      err.upstream = json || text;
      throw err;
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

function safeString(v) {
  return v == null ? '' : String(v);
}

async function handleSearchEmployees(payload) {
  const keyword = safeString(payload.keyword).trim();
  if (!keyword) {
    return { status: 400, body: { ok: false, code: 'MISSING_KEYWORD', message: 'keyword required' } };
  }
  const limit = Math.min(Math.max(Number(payload.limit) || 15, 1), 30);
  const query =
    `user_name like "${escapeQueryValue(keyword)}" and employment_status not in ("退職") ` +
    `order by user_name asc limit ${limit}`;
  const resp = await kintoneGet('/v1/records.json', {
    app: APP_EMP_MASTER,
    query,
    fields: ['$id', 'user_name', 'dept_name', 'group_name', 'employment_status', 'mail'],
  });
  const records = (resp.records || []).map(function (r) {
    return {
      record_id: r.$id?.value ? String(r.$id.value) : '',
      user_name: safeString(r.user_name?.value).trim(),
      dept_name: safeString(r.dept_name?.value).trim(),
      group_name: safeString(r.group_name?.value).trim(),
      employment_status: safeString(r.employment_status?.value).trim(),
      mail: safeString(r.mail?.value).trim(),
    };
  });
  return { status: 200, body: { ok: true, records } };
}

async function handleSyncCredentials(payload) {
  const name = safeString(payload.user_name).trim();
  if (!name) {
    return { status: 400, body: { ok: false, code: 'MISSING_USER_NAME', message: '利用者が未指定です' } };
  }
  const query = `user_name = "${escapeQueryValue(name)}" order by $id asc limit 5`;
  const resp = await kintoneGet('/v1/records.json', {
    app: APP_PC_LEDGER,
    query,
    fields: ['$id', 'user_name', 'm365_id', 'm365_pw', 'vpn_id', 'vpn_pw'],
  });
  const rows = resp.records || [];
  if (!rows.length) {
    return {
      status: 200,
      body: {
        ok: false,
        code: 'NO_HIT',
        message: `674(PC台帳) に「${name}」がヒットしませんでした`,
      },
    };
  }
  if (rows.length > 1) {
    return {
      status: 200,
      body: {
        ok: false,
        code: 'MULTI_HIT',
        message: `674(PC台帳) に「${name}」が複数ヒット（${rows.length} 件）— 浜田相談`,
        count: rows.length,
      },
    };
  }
  const r = rows[0];
  return {
    status: 200,
    body: {
      ok: true,
      pc_ledger_record_id: safeString(r.$id?.value).trim(),
      m365_id: safeString(r.m365_id?.value),
      m365_pw: safeString(r.m365_pw?.value),
      vpn_id: safeString(r.vpn_id?.value),
      vpn_pw: safeString(r.vpn_pw?.value),
    },
  };
}

async function route(req, res) {
  const host = req.headers.host || 'localhost';
  const u = new URL(req.url || '/', `http://${host}`);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, baseHeaders());
    res.end();
    return;
  }
  if (u.pathname === '/tokai-ipad/health' && req.method === 'GET') {
    respond(res, 200, {
      ok: true,
      build: RELAY_BUILD,
      apps: { emp: APP_EMP_MASTER, pc: APP_PC_LEDGER },
      locations: LOCATIONS,
    });
    return;
  }
  if (req.method !== 'POST') {
    respond(res, 405, { ok: false, code: 'METHOD', message: 'POST only' });
    return;
  }
  let payload;
  try {
    payload = await readBody(req);
  } catch (e) {
    respond(res, 400, { ok: false, code: 'BAD_BODY', message: e.message || 'body error' });
    return;
  }
  try {
    if (u.pathname === '/tokai-ipad/search-employees') {
      const r = await handleSearchEmployees(payload);
      respond(res, r.status, r.body);
      return;
    }
    if (u.pathname === '/tokai-ipad/sync-credentials') {
      const r = await handleSyncCredentials(payload);
      respond(res, r.status, r.body);
      return;
    }
    respond(res, 404, { ok: false, code: 'NOT_FOUND', message: 'unknown path' });
  } catch (e) {
    console.error('[tokai-ipad-sync-relay] error', e);
    const status = e.status || 500;
    respond(res, status, {
      ok: false,
      code: status === 401 || status === 403 ? 'AUTH' : 'RELAY_ERROR',
      message: e.message || 'relay error',
    });
  }
}

const server = http.createServer(function (req, res) {
  route(req, res).catch(function (e) {
    console.error('[tokai-ipad-sync-relay] fatal', e);
    try {
      respond(res, 500, { ok: false, code: 'FATAL', message: e.message || 'fatal' });
    } catch { /* ignore */ }
  });
});

server.listen(PORT, HOST, function () {
  console.log(
    `[tokai-ipad-sync-relay] RELAY_BUILD=${RELAY_BUILD} http://${HOST}:${PORT}` +
      `  POST /tokai-ipad/search-employees  POST /tokai-ipad/sync-credentials  GET /tokai-ipad/health` +
      `  emp=${APP_EMP_MASTER} pc=${APP_PC_LEDGER}`,
  );
});
