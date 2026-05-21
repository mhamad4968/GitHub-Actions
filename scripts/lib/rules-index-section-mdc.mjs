/**
 * § ↔ .mdc 双方向マップ構築（RULES-INDEX + AGENTS パース）
 */
import fs from 'node:fs';
import path from 'node:path';

const RE_SECTION = /§[\d]+(?:-[\d]+)*(?:-[a-z0-9]+)?/gi;
const RE_MDC = /`?([a-z][a-z0-9-]*\.mdc)`?/gi;

/** 正規化: §50-3-8 形式 */
export function normalizeSection(raw) {
  return String(raw || '')
    .trim()
    .replace(/^§/, '§')
    .replace(/\s+/g, '');
}

export function extractSections(text) {
  const set = new Set();
  for (const m of String(text || '').matchAll(RE_SECTION)) {
    set.add(normalizeSection(m[0]));
  }
  return [...set];
}

export function extractMdc(text) {
  const set = new Set();
  for (const m of String(text || '').matchAll(RE_MDC)) {
    const name = m[1];
    if (name && !name.includes('/')) set.add(name);
  }
  return [...set];
}

/** RULES-INDEX「タスク開始時」表など | 行から §↔mdc を抽出 */
export function parseRulesIndexTables(rulesIndexText) {
  const sectionToMdc = new Map();
  const mdcToSection = new Map();

  const add = (sections, mdcs, source) => {
    for (const s of sections) {
      if (!sectionToMdc.has(s)) sectionToMdc.set(s, new Set());
      for (const m of mdcs) sectionToMdc.get(s).add(m);
    }
    for (const m of mdcs) {
      if (!mdcToSection.has(m)) mdcToSection.set(m, new Set());
      for (const s of sections) mdcToSection.get(m).add(s);
    }
  };

  const lines = rulesIndexText.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim().startsWith('|')) continue;
    if (/^\|\s*[-:]+\s*\|/.test(line)) continue;
    const sections = extractSections(line);
    const mdcs = extractMdc(line);
    if (sections.length && mdcs.length) add(sections, mdcs, 'rules-index-row');
    else if (mdcs.length && /（Cursor）|constitutional-focus|\.mdc/.test(line)) {
      add(['§(RULES-INDEX行)'], mdcs, 'rules-index-mdc-only');
    }
  }

  return { sectionToMdc, mdcToSection };
}

/** AGENTS.md — .mdc 言及行の前後から § を拾う */
export function parseAgentsMdcRefs(agentsText) {
  const sectionToMdc = new Map();
  const mdcToSection = new Map();
  const lines = agentsText.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const mdcs = extractMdc(lines[i]);
    if (!mdcs.length) continue;
    const window = lines.slice(Math.max(0, i - 2), i + 3).join('\n');
    const sections = extractSections(window);
    if (!sections.length) continue;
    for (const s of sections) {
      if (!sectionToMdc.has(s)) sectionToMdc.set(s, new Set());
      for (const m of mdcs) sectionToMdc.get(s).add(m);
    }
    for (const m of mdcs) {
      if (!mdcToSection.has(m)) mdcToSection.set(m, new Set());
      for (const s of sections) mdcToSection.get(m).add(s);
    }
  }
  return { sectionToMdc, mdcToSection };
}

export function loadOverrides(root) {
  const p = path.join(root, 'data', 'rules-index-section-mdc-overrides.json');
  if (!fs.existsSync(p)) return { sectionToMdc: {}, mdcToSection: {} };
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  return {
    sectionToMdc: j.sectionToMdc || {},
    mdcToSection: j.mdcToSection || {},
  };
}

export function mergeMaps(...maps) {
  const sectionToMdc = new Map();
  const mdcToSection = new Map();

  const ingest = (src) => {
    for (const [s, mdcs] of src.sectionToMdc.entries()) {
      if (!sectionToMdc.has(s)) sectionToMdc.set(s, new Set());
      for (const m of mdcs) sectionToMdc.get(s).add(m);
    }
    for (const [m, secs] of src.mdcToSection.entries()) {
      if (!mdcToSection.has(m)) mdcToSection.set(m, new Set());
      for (const s of secs) mdcToSection.get(m).add(s);
    }
  };

  for (const m of maps) ingest(m);
  return { sectionToMdc, mdcToSection };
}

export function applyOverrides(map, overrides) {
  const { sectionToMdc, mdcToSection } = map;
  for (const [s, arr] of Object.entries(overrides.sectionToMdc || {})) {
    const key = normalizeSection(s);
    if (!sectionToMdc.has(key)) sectionToMdc.set(key, new Set());
    for (const name of arr) {
      const m = name.endsWith('.mdc') ? name : `${name}.mdc`;
      sectionToMdc.get(key).add(m);
      if (!mdcToSection.has(m)) mdcToSection.set(m, new Set());
      mdcToSection.get(m).add(key);
    }
  }
  for (const [m, arr] of Object.entries(overrides.mdcToSection || {})) {
    const name = m.endsWith('.mdc') ? m : `${m}.mdc`;
    if (!mdcToSection.has(name)) mdcToSection.set(name, new Set());
    for (const s of arr) {
      const key = normalizeSection(s);
      mdcToSection.get(name).add(key);
      if (!sectionToMdc.has(key)) sectionToMdc.set(key, new Set());
      sectionToMdc.get(key).add(name);
    }
  }
  return map;
}

export function buildMergedMap(root) {
  const rulesIndex = fs.readFileSync(path.join(root, 'RULES-INDEX.md'), 'utf8');
  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  const ov = loadOverrides(root);
  const merged = mergeMaps(
    parseRulesIndexTables(rulesIndex),
    parseAgentsMdcRefs(agents),
  );
  return applyOverrides(merged, ov);
}

export function toJsonSerializable({ sectionToMdc, mdcToSection }) {
  const s2m = {};
  for (const [s, set] of [...sectionToMdc.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (s === '§(RULES-INDEX行)') continue;
    s2m[s] = [...set].sort();
  }
  const m2s = {};
  for (const [m, set] of [...mdcToSection.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    m2s[m] = [...set].sort();
  }
  return { generatedAt: new Date().toISOString(), sectionToMdc: s2m, mdcToSection: m2s };
}
