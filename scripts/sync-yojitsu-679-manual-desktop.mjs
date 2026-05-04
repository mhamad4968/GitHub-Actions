#!/usr/bin/env node
/**
 * templates/yojitsu-budget-lite/docs/yojitsu-quick-manual.html の <body> 内を取り込み、
 * customize/679/desktop.js（専用マニュアルアプリの一覧カスタマイズ）を再生成する。
 *
 *   node scripts/sync-yojitsu-679-manual-desktop.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const htmlPath = resolve(root, 'templates/yojitsu-budget-lite/docs/yojitsu-quick-manual.html');
const outDir = resolve(root, 'customize/679');
const outPath = resolve(outDir, 'desktop.js');

const html = readFileSync(htmlPath, 'utf8');
const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
if (!m) throw new Error('yojitsu-quick-manual.html: <body> not found');
const inner = m[1].trim();
const wrap =
  '<div class="y679-manual-root" style="font-size:14px;line-height:1.45;color:#1c3a26;max-width:920px;margin:0 auto;padding:8px 4px 24px;">' +
  '<style type="text/css">' +
  '.y679-manual-root table{border-collapse:collapse;width:100%;max-width:720px;background:#fff;border:1px solid #c5d8c9;font-size:13px;margin:8px 0;}' +
  '.y679-manual-root th,.y679-manual-root td{border:1px solid #dee8e0;padding:8px 10px;vertical-align:top;text-align:left;}' +
  '.y679-manual-root th{background:#e8f2ea;font-weight:600;color:#1a4030;}' +
  '.y679-manual-root h1{font-size:1.25rem;margin:0 0 12px;color:#0f3a22;}' +
  '.y679-manual-root h2{font-size:1.05rem;margin:22px 0 8px;color:#164a30;border-bottom:1px solid #b9d6bd;padding-bottom:4px;}' +
  '.y679-manual-root a{color:#1f6e3f;font-weight:600;text-decoration:none;}' +
  '.y679-manual-root a:hover{text-decoration:underline;}' +
  '.y679-manual-root .lead{margin:0 0 14px;font-size:13px;color:#3e514a;}' +
  '.y679-manual-root ul{margin:8px 0 0 1.1em;padding:0;}' +
  '.y679-manual-root footer{margin-top:28px;font-size:12px;color:#5b6d62;}' +
  '</style>' +
  inner +
  '</div>';
const esc = JSON.stringify(wrap);

const src = `(function () {
  "use strict";
  var BUILD = "2026-05-04-679-yojitsu-quick-manual-page";
  var MANUAL_HTML = ${esc};

  function injectCss() {
    if (document.querySelector("[data-y679-manual-css]")) return;
    var st = document.createElement("style");
    st.setAttribute("data-y679-manual-css", "1");
    st.textContent =
      ".gaia-argoui-app-index-recordlist,.gaia-argoui-app-index-norecord,.recordlist-gaia,.recordlist-norecord-gaia," +
      ".gaia-argoui-list-norecord,.recordlist-paging-gaia,div[class*=\\"recordlist-norecord\\"]{display:none !important;}" +
      ".gaia-argoui-app-index-paging,.gaia-argoui-app-index-recordcount,.gaia-argoui-app-recordcount,.gaia-argoui-paging," +
      "div[class*=\\"paging-gaia\\"],div[class*=\\"recordlist-paging\\"],div[class*=\\"recordcount-gaia\\"]{display:none !important;}";
    document.head.appendChild(st);
  }

  function mount() {
    if (document.querySelector("[data-y679-manual-shell]")) return;
    injectCss();
    var host =
      document.querySelector(".ocean-ui-app-index-body") ||
      document.querySelector("#recordlist-gaia") ||
      document.querySelector(".recordlist-gaia") ||
      document.body;
    if (!host) return;
    var origin = typeof location !== "undefined" && location.origin ? location.origin : "";
    var shell = document.createElement("div");
    shell.setAttribute("data-y679-manual-shell", "1");
    shell.style.padding = "12px 16px";
    shell.style.background = "#f4f7f5";
    shell.style.borderTop = "1px solid #dee5e0";
    var nav =
      '<div style="margin-bottom:10px;font-size:12px;color:#355a42;">' +
      '<strong>部署予実クイックマニュアル</strong> · ' +
      '<a href="' +
      origin +
      '/k/679/">679 トップ</a> · ' +
      '<a href="' +
      origin +
      '/k/678/">678 ダッシュ</a> · ' +
      '<a href="' +
      origin +
      '/k/677/">677 入力</a>' +
      "</div>";
    shell.innerHTML = nav + MANUAL_HTML;
    host.insertBefore(shell, host.firstChild);
  }

  kintone.events.on("app.record.index.show", function (e) {
    try {
      mount();
    } catch (err) {
      console.error("[679 manual]", err);
    }
    return e;
  });
})();
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, src, 'utf8');
console.log('Wrote', outPath, '(' + src.length + ' bytes)');
