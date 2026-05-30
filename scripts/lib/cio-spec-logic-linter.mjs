/**
 * SPEC.md 日本語論理矛盾 Linter（第9層・拡張案2 / DeepSeek 職分）
 */
import fs from 'node:fs';
import path from 'node:path';

const RULES_REL = 'data/cio-spec-logic-rules.json';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

export function loadRules(root) {
  const p = path.join(root, RULES_REL);
  if (!fs.existsSync(p)) return { rules: [] };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function lineHits(text, pattern, flags = '') {
  const re = new RegExp(pattern, flags);
  const lines = text.split('\n');
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const full = lines[i];
    if (re.test(full)) hits.push({ line: i + 1, text: full.trim().slice(0, 120), fullText: full });
  }
  return hits;
}

function isNegationLine(fullText) {
  return /NG|禁止|使わない|誤記|非ゴール|廃止|除く|参考|拒否|event\.error|完全廃止|一本化|セル運用.*廃止/.test(fullText);
}

function checkInternalContradictions(text) {
  const issues = [];
  const hasRunningBan = /ラーニング.*(誤記|使わない|禁止)/.test(text);
  const hasLearningTypo = /(?<![ン])ラーニング/.test(text);
  if (hasRunningBan && hasLearningTypo) {
    const hits = lineHits(text, '(?<![ン])ラーニング');
    for (const h of hits) {
      if (isNegationLine(h.fullText)) continue;
      issues.push({
        line: h.line,
        constitutionRef: '§2 用語',
        message: '「ラーニング」誤記が残存（同一 SPEC 内で禁止と矛盾）',
        excerpt: h.text,
      });
    }
  }

  const pluginNg = /有償.*プラグイン.*NG|プラグイン.*(採用|導入).*NG/i.test(text);
  const pluginAllow = lineHits(text, '有償.*プラグイン.*(導入|採用)', 'i');
  if (pluginNg) {
    for (const h of pluginAllow) {
      if (isNegationLine(h.fullText)) continue;
      issues.push({
        line: h.line,
        constitutionRef: '§5 非ゴール',
        message: '有償プラグイン導入記述が NG 方針と矛盾',
        excerpt: h.text,
      });
    }
  }

  const excelBan = /Excel.*(完全廃止|使わない|継続運用.*廃止)/i.test(text);
  const excelDaily = lineHits(text, 'Excel.*(日常|継続).*(入力|集計|正)', 'i');
  if (excelBan) {
    for (const h of excelDaily) {
      if (isNegationLine(h.fullText)) continue;
      issues.push({
        line: h.line,
        constitutionRef: '§0・§3',
        message: 'Excel 日常運用が kintone 一本化と矛盾',
        excerpt: h.text,
      });
    }
  }

  return issues;
}

export function lintSpecLogic(root, specRel) {
  const cfg = loadRules(root);
  const rel = specRel || cfg.specPath || 'templates/yojitsu-budget-lite/SPEC.md';
  const specPath = path.join(root, rel);
  if (!fs.existsSync(specPath)) {
    return { ok: false, issues: [{ line: 0, constitutionRef: '—', message: `SPEC 未存在: ${rel}`, excerpt: '' }] };
  }

  const text = fs.readFileSync(specPath, 'utf8');
  const issues = [...checkInternalContradictions(text)];

  for (const rule of cfg.rules || []) {
    const hits = lineHits(text, rule.pattern, rule.flags || '');
    if (rule.negate) continue;
    for (const h of hits) {
      if (isNegationLine(h.fullText)) continue;
      if (issues.some((i) => i.line === h.line && i.message === rule.message)) continue;
      issues.push({
        line: h.line,
        constitutionRef: rule.constitutionRef,
        message: rule.message,
        excerpt: h.text,
        ruleId: rule.id,
      });
    }
  }

  return { ok: issues.length === 0, issues, specPath: rel };
}

export function formatSpecConflict(issue) {
  return `${RED}【仕様矛盾】SPEC.mdの${issue.line}行目の新要件は、既存の憲法${issue.constitutionRef}と論理的に衝突しています。設計を再調整してください${RESET} — ${issue.message}`;
}

export function printSpecConflicts(issues) {
  for (const issue of issues) {
    console.error(formatSpecConflict(issue));
    if (issue.excerpt) console.error(`  excerpt: ${issue.excerpt}`);
  }
}
