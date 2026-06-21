/**
 * 依頼意図 → MCP / npm ルーティング
 * @see data/cio-ai-team-tool-routing.json
 * @see docs/runbooks/ai-team-tool-routing-v2.md
 */
import fs from 'node:fs';
import path from 'node:path';

export const ROUTING_MANIFEST_REL = 'data/cio-ai-team-tool-routing.json';
export const ROUTING_LOG_DIR_REL = 'chat-sessions/tool-routing-logs';

/** @returns {object} */
export function loadToolRoutingManifest(root) {
  const p = path.join(root, ROUTING_MANIFEST_REL);
  if (!fs.existsSync(p)) {
    throw new Error(`missing ${ROUTING_MANIFEST_REL}`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/** @param {string} haystack @param {string[]} keywords */
export function scoreIntent(haystack, keywords) {
  const lower = haystack.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    const k = kw.toLowerCase();
    if (lower.includes(k)) score += k.length >= 4 ? 2 : 1;
  }
  return score;
}

/**
 * @param {object} manifest
 * @param {string} intentText
 * @param {{ phase?: string, limit?: number }} [opts]
 */
export function matchIntents(manifest, intentText, opts = {}) {
  const { phase, limit = 5 } = opts;
  const ranked = (manifest.intents || [])
    .filter((item) => !phase || (item.phase || []).includes(phase))
    .map((item) => ({
      item,
      score: scoreIntent(intentText, item.keywords || []),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.item.priority ?? 100) - (b.item.priority ?? 100);
    });

  return ranked.slice(0, limit);
}

/** MCP entries sorted by priority (lower first) */
export function sortMcpEntries(mcpList) {
  return [...(mcpList || [])].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
}

/**
 * @param {object} rootManifest
 * @param {string} intentText
 * @param {{ phase?: string, appId?: string }} [opts]
 */
export function buildRoutePlan(rootManifest, intentText, opts = {}) {
  const matches = matchIntents(rootManifest, intentText, { phase: opts.phase, limit: 3 });
  const primary = matches[0]?.item ?? null;
  const matchedRules = matches.map(({ item, score }) => ({ id: item.id, score, priority: item.priority }));

  const substituteApp = (cmd) =>
    opts.appId ? cmd.replace(/<APP_ID>/g, String(opts.appId)) : cmd;

  const npm = primary
    ? [...new Set((primary.npm || []).map(substituteApp))]
    : [...(rootManifest.fallback?.defaultNpm || [])];

  const mcpSorted = sortMcpEntries(primary?.mcp);
  const selectedMcp = mcpSorted[0] ?? null;

  return {
    intent: intentText,
    phase: opts.phase ?? null,
    appId: opts.appId ?? null,
    matchedRules,
    primaryIntentId: primary?.id ?? null,
    category: primary?.category ?? null,
    selectedMcp,
    mcpChain: mcpSorted,
    npm,
    skill: primary?.skill ?? null,
    runbook: primary?.runbook ?? rootManifest.canonicalRunbook,
    rule: primary?.rule ?? null,
    secondReviewer: primary?.secondReviewer ?? null,
    verify: primary?.verify ?? [],
    lane: primary?.lane ?? null,
    reason:
      primary && selectedMcp
        ? `intent=${primary.id} score=${matches[0].score} mcp priority=${selectedMcp.priority}`
        : primary
          ? `intent=${primary.id} score=${matches[0].score} npm-only`
          : 'no keyword match — fallback npm',
  };
}

/** @param {string} root @param {object} plan @param {{ writeLog?: boolean }} [opts] */
export function formatRoutePlan(plan, opts = {}) {
  const lines = [];
  lines.push(`[cio:tool:route] intent="${plan.intent}"`);
  if (plan.primaryIntentId) {
    lines.push(`  category: ${plan.category} | id: ${plan.primaryIntentId} | ${plan.reason}`);
  } else {
    lines.push(`  ${plan.reason}`);
  }
  if (plan.matchedRules.length > 1) {
    lines.push(
      `  alternates: ${plan.matchedRules
        .slice(1)
        .map((r) => `${r.id}(${r.score})`)
        .join(', ')}`
    );
  }
  if (plan.selectedMcp) {
    lines.push(
      `  MCP primary: ${plan.selectedMcp.server} → ${(plan.selectedMcp.tools || []).join(', ') || '(descriptor 必読)'}`
    );
    if (plan.mcpChain.length > 1) {
      lines.push(
        `  MCP fallbacks: ${plan.mcpChain
          .slice(1)
          .map((m) => `${m.server}(p${m.priority})`)
          .join(' → ')}`
      );
    }
  }
  if (plan.npm.length) lines.push(`  npm: ${plan.npm.join(' → ')}`);
  if (plan.secondReviewer) lines.push(`  §50-3-8: ${plan.secondReviewer}`);
  if (plan.skill) lines.push(`  skill: ${plan.skill}`);
  if (plan.runbook) lines.push(`  runbook: ${plan.runbook}`);
  if (plan.verify.length) lines.push(`  verify: ${plan.verify.join(', ')}`);
  return lines.join('\n');
}

/** @param {string} root @param {object} plan */
export function writeRouteLog(root, plan) {
  const dir = path.join(root, ROUTING_LOG_DIR_REL);
  fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const safe = (plan.primaryIntentId || 'fallback').replace(/[^\w-]/g, '_');
  const filename = `${ts}_${safe}.json`;
  const payload = {
    timestamp: new Date().toISOString(),
    ...plan,
  };
  fs.writeFileSync(path.join(dir, filename), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return path.join(ROUTING_LOG_DIR_REL, filename);
}

/** @param {object} manifest */
export function validateRoutingManifest(manifest) {
  const issues = [];
  if (!manifest.version) issues.push('missing version');
  if (!Array.isArray(manifest.intents) || manifest.intents.length === 0) {
    issues.push('intents empty');
  }
  const ids = new Set();
  for (const intent of manifest.intents || []) {
    if (!intent.id) issues.push('intent missing id');
    else if (ids.has(intent.id)) issues.push(`duplicate intent id: ${intent.id}`);
    else ids.add(intent.id);
    if (!intent.category) issues.push(`intent ${intent.id}: missing category`);
    else if (!(manifest.categories || []).includes(intent.category)) {
      issues.push(`intent ${intent.id}: unknown category ${intent.category}`);
    }
    if (intent.priority == null) issues.push(`intent ${intent.id}: missing priority`);
    if (!Array.isArray(intent.keywords) || intent.keywords.length === 0) {
      issues.push(`intent ${intent.id}: keywords empty`);
    }
  }
  return { ok: issues.length === 0, issues };
}
