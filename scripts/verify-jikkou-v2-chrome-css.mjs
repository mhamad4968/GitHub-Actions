#!/usr/bin/env node
/**
 * #S-UI-01 / #S-UI-02 — Ver.02 App1 chrome CSS 再発防止
 *
 * - sticky / fixed メニュー祖先に overflow-x:hidden 禁止（#R-UI-01）
 * - th/td 自体の display:flex|grid 禁止（#R-UI-02）
 *
 * Usage: node scripts/verify-jikkou-v2-chrome-css.mjs
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uiPath = path.join(root, "customize/jikkou-yosan-v2-app1/desktop.ui.js");

const STICKY_ANCESTOR_SELECTORS = [
  "#jy2-host",
  ".jy2-shell",
  ".gaia-argoui-app-show-contents",
  ".contents-gaia",
  ".record-detail-gaia",
  ".record-edit-gaia",
  ".record-create-gaia",
  "body.jy2-detail-shell",
  "body.jy2-detail-shell .container-gaia",
  "body.jy2-detail-shell #jy2-host",
];

function extractCssStringLiterals(source) {
  const out = [];
  const re = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
  let m;
  while ((m = re.exec(source))) {
    const s = m[1];
    if (s.includes("{") && (s.includes("overflow") || s.includes("display"))) {
      out.push(s.replace(/\\n/g, "\n").replace(/\\"/g, '"'));
    }
  }
  return out.join("\n");
}

function splitRules(css) {
  const rules = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) break;
    const close = css.indexOf("}", open + 1);
    if (close < 0) break;
    const selector = css.slice(i, open).replace(/^[\s;]+/, "").trim();
    const body = css.slice(open + 1, close);
    if (selector) rules.push({ selector, body });
    i = close + 1;
  }
  return rules;
}

function selectorHitsAncestor(selector, ancestor) {
  // exact or compound that includes the ancestor token
  const esc = ancestor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[,\\s])${esc}(?=[,\\s:{.]|$)`);
  return re.test(selector) || selector === ancestor;
}

function checkOverflowHidden(css) {
  const issues = [];
  for (const { selector, body } of splitRules(css)) {
    if (!/overflow-x\s*:\s*hidden/i.test(body)) continue;
    for (const anc of STICKY_ANCESTOR_SELECTORS) {
      if (selectorHitsAncestor(selector, anc)) {
        issues.push(
          `#R-UI-01/#S-UI-01: ${anc} 系セレクタに overflow-x:hidden — sticky 祖先で禁止（clip を使う）\n  selector=${selector.slice(0, 120)}`,
        );
      }
    }
  }
  return issues;
}

function isThTdSelector(selector) {
  // th / td as element, but not class names like .jy2-th-stack alone
  return /(^|[,>\s+~])(th|td)([\s.#[:>+~,|]|$)/.test(selector);
}

function checkThDisplay(css) {
  const issues = [];
  for (const { selector, body } of splitRules(css)) {
    if (!isThTdSelector(selector)) continue;
    if (/\.jy2-th-stack\b/.test(selector) && !/(^|[,>\s+~])(th|td)([\s.#[:>+~,|]|$)/.test(selector.replace(/\.jy2-th-stack\b/g, ""))) {
      continue;
    }
    if (/display\s*:\s*(flex|grid)\b/i.test(body)) {
      issues.push(
        `#R-UI-02/#S-UI-02: th/td に display:flex|grid 禁止（内側 .jy2-th-stack のみ）\n  selector=${selector.slice(0, 120)}`,
      );
    }
  }
  return issues;
}

function main() {
  if (!fs.existsSync(uiPath)) {
    console.error(`[verify-jikkou-v2-chrome-css] NG missing ${uiPath}`);
    process.exit(1);
  }
  const source = fs.readFileSync(uiPath, "utf8");
  const css = extractCssStringLiterals(source);
  const issues = [...checkOverflowHidden(css), ...checkThDisplay(css)];

  // #R-UI-01 also: require clip (or visible) on shell/host as positive signal
  if (!/#jy2-host\{[^}]*overflow-x:\s*clip/i.test(css) && !/#jy2-host\{[^}]*overflow-x:\s*visible/i.test(css)) {
    issues.push("#R-UI-01: #jy2-host に overflow-x:clip（または visible）が必要");
  }
  if (!/\.jy2-shell\{[^}]*overflow-x:\s*clip/i.test(css) && !/\.jy2-shell\{[^}]*overflow-x:\s*visible/i.test(css)) {
    issues.push("#R-UI-01: .jy2-shell に overflow-x:clip（または visible）が必要");
  }

  if (issues.length) {
    console.error("[verify-jikkou-v2-chrome-css] NG");
    for (const issue of issues) console.error(`  - ${issue}`);
    process.exit(1);
  }
  console.log("[verify-jikkou-v2-chrome-css] OK #S-UI-01/#S-UI-02");
  process.exit(0);
}

main();
