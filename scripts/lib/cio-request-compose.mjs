/**
 * 依頼効率化 — チャット貼付ブロック生成（正本ロジック）
 * @see data/cio-request-compose-templates.json
 * @see docs/runbooks/cio-request-compose.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildRoutePlan, loadToolRoutingManifest } from './cio-tool-routing.mjs';

export const TEMPLATES_REL = 'data/cio-request-compose-templates.json';
export const CEO_BASELINE_REL = 'chat-sessions/CEO-MINIMUM-ABSOLUTE-BASELINE.txt';
export const COMPOSE_LOG_DIR_REL = 'chat-sessions/request-compose-logs';

/** @param {string} root */
export function loadRequestComposeTemplates(root) {
  const p = path.join(root, TEMPLATES_REL);
  if (!fs.existsSync(p)) {
    throw new Error(`missing ${TEMPLATES_REL}`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/**
 * @param {object} templates
 * @returns {{ ok: boolean, issues: string[] }}
 */
export function validateRequestComposeTemplates(templates) {
  const issues = [];
  if (!templates.version) issues.push('missing version');
  if (!Array.isArray(templates.defaultNoTouch) || templates.defaultNoTouch.length === 0) {
    issues.push('defaultNoTouch empty');
  }
  const lanes = templates.lanes || {};
  const ids = Object.keys(lanes);
  if (ids.length < 5) issues.push(`lanes < 5 (got ${ids.length})`);
  for (const id of ids) {
    const lane = lanes[id];
    if (!lane.label) issues.push(`lane ${id}: missing label`);
    if (!lane.aiHint) issues.push(`lane ${id}: missing aiHint`);
    if (typeof lane.ceoBaselineDefault !== 'boolean') {
      issues.push(`lane ${id}: ceoBaselineDefault must be boolean`);
    }
    if (lane.ceoBaselineHint != null && typeof lane.ceoBaselineHint !== 'string') {
      issues.push(`lane ${id}: ceoBaselineHint must be string|null`);
    }
  }
  return { ok: issues.length === 0, issues };
}

/**
 * @param {object} templates
 * @param {string} laneId
 * @param {{ app?: string|null, noTouch?: string[], goWait?: string|null, intent: string }} opts
 */
export function validateComposeInput(templates, laneId, opts) {
  const issues = [];
  const lane = templates.lanes?.[laneId];
  if (!lane) {
    return { ok: false, issues: [`unknown lane: ${laneId}`] };
  }
  if (!opts.intent?.trim()) {
    issues.push('intent required');
  }
  if (lane.requiredApp && !opts.app) {
    issues.push(`lane ${laneId} requires --app`);
  }
  return { ok: issues.length === 0, issues, lane };
}

/**
 * @param {string} root
 * @param {object} templates
 * @param {object} lane
 * @param {string} laneId
 * @param {{ intent: string, app?: string|null, noTouch?: string[], goWait?: string|null, phase?: string }} opts
 */
export function buildAiHintLine(root, templates, lane, laneId, opts) {
  const phase = opts.phase === 'investigate' ? 'investigate' : 'implement';
  let hint =
    phase === 'investigate' && lane.aiHintInvestigate
      ? lane.aiHintInvestigate
      : lane.aiHint || '';
  if (phase === 'implement' && opts.app) {
    hint = hint.replace(/<APP>/g, String(opts.app));
  }
  if (phase === 'implement') {
    try {
      const manifest = loadToolRoutingManifest(root);
      const routeIntent = `${opts.intent} ${(lane.routeKeywords || []).join(' ')}`;
      const plan = buildRoutePlan(manifest, routeIntent, {
        phase: 'WORK',
        appId: opts.app || null,
      });
      if (plan.npm.length) {
        const npmShort = plan.npm
          .slice(0, 3)
          .map((c) => c.replace(/:preflight:<APP_ID>/, `:preflight:${opts.app}`).replace(/deploy:<APP_ID>/, `deploy:${opts.app}`))
          .join(' → ');
        hint = `${hint} | route: ${npmShort}`;
      }
    } catch {
      /* routing manifest optional at compose time */
    }
  }
  return hint;
}

/**
 * @param {string} root
 * @param {object} opts
 * @param {string} opts.laneId
 * @param {string} opts.intent
 * @param {string} [opts.app]
 * @param {string[]} [opts.noTouch]
 * @param {string} [opts.goWait]
 * @param {boolean} [opts.withCeoBaseline]
 * @param {'investigate'|'implement'} [opts.phase]
 */
export function buildComposeBlock(root, opts) {
  const templates = loadRequestComposeTemplates(root);
  const phase = opts.phase === 'investigate' ? 'investigate' : 'implement';
  const validation = validateComposeInput(templates, opts.laneId, opts);
  if (!validation.ok) {
    const err = new Error(validation.issues.join('; '));
    err.issues = validation.issues;
    throw err;
  }
  const lane = validation.lane;
  const noTouch = [
    ...new Set([
      ...(templates.defaultNoTouch || []),
      ...(lane.extraNoTouch || []),
      ...(opts.noTouch || []),
    ]),
  ];
  const phaseMeta = templates.phases?.[phase];
  const goWait =
    opts.goWait?.trim() ||
    (phase === 'investigate' && phaseMeta?.goWaitOverride) ||
    lane.defaultGoWait ||
    '—';
  const laneLine = opts.app ? `${lane.label} · app ${opts.app}` : lane.label;
  const aiHint = buildAiHintLine(root, templates, lane, opts.laneId, { ...opts, phase });
  const stageLine =
    phase === 'investigate'
      ? '確認A（このOK≠実装GO）· 生成phase=investigate（調査向けヒント）'
      : '確認A（このOK≠実装GO）· 生成phase=implement（実装GO後の手順ヒント）';

  const lines = [
    `【段階】${stageLine}`,
    `【レーン】${laneLine}`,
    `【やりたいこと】${opts.intent.trim()}`,
    `【触らない】${noTouch.join(' / ')}`,
    `【GO待ち】${goWait}`,
    `【AIへ】${aiHint}`,
  ];

  // V2-3: レーン既定 + 明示フラグ。全レーン default=false（締め軽量化維持）
  const attachCeo =
    opts.withCeoBaseline === true || lane.ceoBaselineDefault === true;
  let ceoBaseline = null;
  if (attachCeo) {
    const ceoPath = path.join(root, CEO_BASELINE_REL);
    if (fs.existsSync(ceoPath)) {
      ceoBaseline = fs.readFileSync(ceoPath, 'utf8').trim();
    }
  }
  const ceoBaselineHint =
    !attachCeo && typeof lane.ceoBaselineHint === 'string' && lane.ceoBaselineHint.trim()
      ? lane.ceoBaselineHint.trim()
      : null;

  return {
    laneId: opts.laneId,
    phase,
    block: lines.join('\n'),
    lines,
    ceoBaseline,
    ceoBaselineAttached: Boolean(ceoBaseline),
    ceoBaselineHint,
    pasteText: ceoBaseline ? `${lines.join('\n')}\n\n${ceoBaseline}` : lines.join('\n'),
  };
}

/** @param {object} templates */
export function listLaneIds(templates) {
  return Object.keys(templates.lanes || {}).sort();
}

/**
 * compose 実行ログ（監査・観測用 · 確認Aの記録。実装着手の証拠にはしない）
 * @param {string} root
 * @param {object} result buildComposeBlock の戻り
 * @param {{ laneId: string, intent: string, app?: string|null, phase?: string, goWait?: string|null, noTouch?: string[] }} input
 * @returns {string} repo-relative log path
 */
export function writeComposeLog(root, result, input = {}) {
  const dir = path.join(root, COMPOSE_LOG_DIR_REL);
  fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const laneSafe = String(result.laneId || input.laneId || 'unknown').replace(/[^\w-]/g, '_');
  const appPart = result.app || input.app ? `_app${String(result.app || input.app).replace(/[^\w-]/g, '')}` : '';
  const filename = `${ts}_${laneSafe}${appPart}.json`;
  const payload = {
    timestamp: new Date().toISOString(),
    schema: 'cio-request-compose-log/v1',
    note: '確認A用ブロック生成の記録。このファイルの存在は実装GOではない。',
    laneId: result.laneId,
    phase: result.phase,
    intent: String(input.intent || '').trim(),
    app: input.app || null,
    goWait: input.goWait || null,
    noTouch: input.noTouch || [],
    block: result.block,
    lines: result.lines,
  };
  fs.writeFileSync(path.join(dir, filename), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return path.join(COMPOSE_LOG_DIR_REL, filename).replace(/\\/g, '/');
}
