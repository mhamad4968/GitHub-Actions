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
 * @param {{ intent: string, app?: string|null, noTouch?: string[], goWait?: string|null }} opts
 */
export function buildAiHintLine(root, templates, lane, laneId, opts) {
  let hint = lane.aiHint || '';
  if (opts.app) {
    hint = hint.replace(/<APP>/g, String(opts.app));
  }
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
 */
export function buildComposeBlock(root, opts) {
  const templates = loadRequestComposeTemplates(root);
  const validation = validateComposeInput(templates, opts.laneId, opts);
  if (!validation.ok) {
    const err = new Error(validation.issues.join('; '));
    err.issues = validation.issues;
    throw err;
  }
  const lane = validation.lane;
  const noTouch = [...new Set([...(templates.defaultNoTouch || []), ...(opts.noTouch || [])])];
  const goWait = opts.goWait?.trim() || lane.defaultGoWait || '—';
  const laneLine = opts.app ? `${lane.label} · app ${opts.app}` : lane.label;
  const aiHint = buildAiHintLine(root, templates, lane, opts.laneId, opts);

  const lines = [
    `【レーン】${laneLine}`,
    `【やりたいこと】${opts.intent.trim()}`,
    `【触らない】${noTouch.join(' / ')}`,
    `【GO待ち】${goWait}`,
    `【AIへ】${aiHint}`,
  ];

  let ceoBaseline = null;
  if (opts.withCeoBaseline) {
    const ceoPath = path.join(root, CEO_BASELINE_REL);
    if (fs.existsSync(ceoPath)) {
      ceoBaseline = fs.readFileSync(ceoPath, 'utf8').trim();
    }
  }

  return {
    laneId: opts.laneId,
    block: lines.join('\n'),
    lines,
    ceoBaseline,
    pasteText: ceoBaseline ? `${lines.join('\n')}\n\n${ceoBaseline}` : lines.join('\n'),
  };
}

/** @param {object} templates */
export function listLaneIds(templates) {
  return Object.keys(templates.lanes || {}).sort();
}
