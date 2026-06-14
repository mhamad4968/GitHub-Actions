#!/usr/bin/env node
/**
 * Fork software-ledger-dash/desktop.js → storage-media-ledger-dash/desktop.js
 * 正本: docs/plans/2026-06-13-storage-media-ledger-kintone-spec.md
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'customize/software-ledger-dash/desktop.js');
const dest = path.join(root, 'customize/storage-media-ledger-dash/desktop.js');

let s = readFileSync(src, 'utf8');

const replacements = [
  ['/** ソフトウエア管理台帳ver.1 — REST CRUD（694 型） */', '/** 記憶媒体等管理台帳ver.1 — REST CRUD（694 型） */'],
  ['var APP_DB = 714;', 'var APP_DB = 716; // updated after create — see storage-media-ledger-app-ids.json'],
  ['var BUILD = "2026-06-14-software-ledger-dash-sw-info-label";', 'var BUILD = "2026-06-14-storage-media-ledger-dash-v1";'],
  ['var LICENSE_VOLUME = "ボリュームライセンス";\n', ''],
  ['license_type: "license_type",\n    software_name: "software_name",\n    model_number: "model_number",', 'media_type: "media_type",\n    media_type_other: "media_type_other",\n    item_name: "item_name",\n    capacity: "capacity",'],
  ['FC.license_type,\n    FC.software_name,\n    FC.model_number,', 'FC.media_type,\n    FC.media_type_other,\n    FC.item_name,\n    FC.capacity,'],
  [
    `  var ID_KIND_OPTIONS = [
    "シリアル番号",
    "プロダクトID",
    "アカウントID",
    "製造番号",
    "その他",
  ];`,
    `  var ID_KIND_OPTIONS = [
    "シリアル番号",
    "製造番号",
    "管理番号",
    "型番",
    "その他",
  ];`,
  ],
  ['var LICENSE_OPTIONS = ["買い切り", "サブスク", LICENSE_VOLUME];', 'var MEDIA_TYPE_OPTIONS = ["USBメモリ", "外付けHDD/SSD", "光学ディスク", "SD/microSD", "その他"];'],
  ['var MEDIA_TYPE_OTHER = "その他";', ''],
  ['{ key: "license_type", label: "ライセンス", sort: true },\n    { key: "software_name", label: "製品名", sort: true },\n    { key: "model_number", label: "型番", sort: true },\n    { key: "ident", label: "ソフトウエアの情報", sort: false },', '{ key: "media_type_display", label: "種別", sort: true },\n    { key: "item_name", label: "名称", sort: true },\n    { key: "capacity", label: "容量", sort: true },\n    { key: "ident", label: "ハードウエア情報", sort: false },'],
  ['{ key: "software_name", label: "製品名" },\n    { key: "license_type", label: "ライセンス" },\n    { key: "ident", label: "ソフトウエアの情報" },', '{ key: "media_type_display", label: "種別" },\n    { key: "item_name", label: "名称" },\n    { key: "capacity", label: "容量" },\n    { key: "ident", label: "ハードウエア情報" },'],
  ['license_type: val(rec, FC.license_type),\n      software_name: val(rec, FC.software_name),\n      model_number: val(rec, FC.model_number),', 'media_type: val(rec, FC.media_type),\n      media_type_other: val(rec, FC.media_type_other),\n      item_name: val(rec, FC.item_name),\n      capacity: val(rec, FC.capacity),'],
  ['row.ident = formatIdentification(row);\n    return row;', 'row.ident = formatIdentification(row);\n    row.media_type_display = formatMediaTypeDisplay(row);\n    return row;'],
  ['if (!partial || partial.license_type) set(FC.license_type, row.license_type);\n    if (!partial || partial.software_name) set(FC.software_name, row.software_name);\n    if (!partial || partial.model_number) set(FC.model_number, row.model_number);', 'if (!partial || partial.media_type) set(FC.media_type, row.media_type);\n    if (!partial || partial.media_type_other) {\n      if (row.media_type_other) set(FC.media_type_other, row.media_type_other);\n      else clear(FC.media_type_other);\n    }\n    if (!partial || partial.item_name) set(FC.item_name, row.item_name);\n    if (!partial || partial.capacity) set(FC.capacity, row.capacity);'],
  ['function licenseOptionsHtml(selected) {', 'function formatMediaTypeDisplay(row) {\n    var mt = String(row.media_type || "").trim();\n    if (!mt) return "";\n    if (mt === "その他") {\n      var other = String(row.media_type_other || "").trim();\n      return other ? "その他（" + other + "）" : "その他";\n    }\n    return mt;\n  }\n\n  function mediaTypeOptionsHtml(selected) {'],
  ['return LICENSE_OPTIONS.map(function (opt) {', 'return MEDIA_TYPE_OPTIONS.map(function (opt) {'],
  ['return "ソフトウエアの情報1（種別・値）は必須です";', 'return "ハードウエア情報1（種別・値）は必須です";'],
  ['return "ソフトウエアの情報" + s.n + "は種別と値をセットで入力してください";', 'return "ハードウエア情報" + s.n + "は種別と値をセットで入力してください";'],
  ['function checkCrossRecordDuplicates(licenseType, slots, excludeId) {\n    if (licenseType === LICENSE_VOLUME) return Promise.resolve(false);', 'function checkCrossRecordDuplicates(slots, excludeId) {'],
  ['\'<label>ソフトウエアの情報\'', '\'\'<label>ハードウエア情報\''],
  ['" — 種別<select id=\\"swl-id-kind-"', '" — 種別<select id=\\"swl-id-kind-"'],
  ['\'</select></label><label>ソフトウエアの情報\'', '\'\'</select></label><label>ハードウエア情報\''],
  ['class=\\"kintoneplugin-button-normal\\">ソフトウエアの情報を追加</button>\';', 'class=\\"kintoneplugin-button-normal\\">ハードウエア情報を追加</button>\';'],
  ['var licenseEl = box.querySelector("#swl-license-type");\n    var licenseType = licenseEl ? licenseEl.value : "";\n    if (!licenseType) {\n      alert("ライセンス種別は必須です");\n      return;\n    }\n    var softwareName = (box.querySelector("#swl-software-name") || {}).value || "";\n    softwareName = softwareName.trim();\n    if (!softwareName) {\n      alert("製品名は必須です");\n      return;\n    }', 'var mediaTypeEl = box.querySelector("#swl-media-type");\n    var mediaType = mediaTypeEl ? mediaTypeEl.value : "";\n    if (!mediaType) {\n      alert("媒体種別は必須です");\n      return;\n    }\n    var mediaTypeOther = ((box.querySelector("#swl-media-type-other") || {}).value || "").trim();\n    if (mediaType === "その他" && !mediaTypeOther) {\n      alert("種別（その他）は必須です");\n      return;\n    }\n    if (mediaType !== "その他") mediaTypeOther = "";'],
  ['license_type: licenseType,\n      software_name: softwareName,\n      model_number: ((box.querySelector("#swl-model-number") || {}).value || "").trim(),', 'media_type: mediaType,\n      media_type_other: mediaTypeOther,\n      item_name: ((box.querySelector("#swl-item-name") || {}).value || "").trim(),\n      capacity: ((box.querySelector("#swl-capacity") || {}).value || "").trim(),'],
  ['checkCrossRecordDuplicates(licenseType, slots, isNew ? null : row.id)', 'checkCrossRecordDuplicates(slots, isNew ? null : row.id)'],
  ['"同一のソフトウエア情報（シリアル等）が既に登録されています。登録しますか？"', '"同一のハードウエア情報（シリアル等）が既に登録されています。登録しますか？"'],
  ['license_type: 1,\n            software_name: 1,\n            model_number: 1,', 'media_type: 1,\n            media_type_other: 1,\n            item_name: 1,\n            capacity: 1,'],
  ['r.software_name +\n        " " +\n        r.model_number +', 'r.item_name +\n        " " +\n        r.capacity +\n        " " +\n        r.media_type_display +'],
  ['esc(r.license_type) +\n          "</td><td>" +\n          esc(r.software_name) +\n          "</td><td>" +\n          esc(r.model_number) +', 'esc(r.media_type_display) +\n          "</td><td>" +\n          esc(r.item_name) +\n          "</td><td>" +\n          esc(r.capacity) +'],
  ['"<p>製品名: <strong>" +\n        esc(row.software_name) +', '"<p>種別: <strong>" +\n        esc(row.media_type_display) +\n        "</strong></p><p>名称: <strong>" +\n        esc(row.item_name) +'],
  ['"<p>製品名: <strong>" +\n        esc(row.software_name) +\n        "</strong></p><p>管理番号: "', '"<p>名称: <strong>" +\n        esc(row.item_name) +\n        "</strong></p><p>管理番号: "'],
  ['if (q) appendListLike(parts, FC.software_name, q);', 'if (q) {\n      appendListLike(parts, FC.item_name, q);\n      appendListLike(parts, FC.capacity, q);\n      appendListLike(parts, FC.media_type_other, q);\n    }'],
  ['appendListLike(parts, FC.software_name, opts.software_name);', 'appendListLike(parts, FC.item_name, opts.item_name);\n    appendListLike(parts, FC.media_type, opts.media_type);\n    appendListLike(parts, FC.media_type_other, opts.media_type_other);'],
  ['? " order by " + FC.software_name + " asc, " + FC.legacy_no + " asc"', '? " order by " + FC.media_type + " asc, " + FC.item_name + " asc, " + FC.legacy_no + " asc"'],
  ['<h1 style=\\"margin:0 0 8px;font-size:18px;\\">ソフトウエア管理台帳ver.1 — リスト一覧</h1>', '<h1 style=\\"margin:0 0 8px;font-size:18px;\\">記憶媒体等管理台帳ver.1 — リスト一覧</h1>'],
  ['["swl-list-dept", "swl-list-group", "swl-list-user", "swl-list-emp", "swl-list-sw"]', '["swl-list-dept", "swl-list-group", "swl-list-user", "swl-list-emp", "swl-list-item", "swl-list-media"]'],
  ['var sw = (document.getElementById("swl-list-sw") || {}).value || "";', 'var itemName = (document.getElementById("swl-list-item") || {}).value || "";\n    var mediaType = (document.getElementById("swl-list-media") || {}).value || "";'],
  ['software_name: sw,', 'item_name: itemName,\n      media_type: mediaType,'],
  ['\'<label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;">製品名（部分一致）</label>\' +\n        \'<input type="text" id="swl-list-sw"', '\'\'<label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;">媒体種別（部分一致）</label>\' +\n        \'<input type="text" id="swl-list-media" placeholder="例: USBメモリ / その他" style="width:100%;box-sizing:border-box;margin-bottom:10px;padding:8px;">\' +\n        \'<label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;">名称（部分一致）</label>\' +\n        \'<input type="text" id="swl-list-item"'],
  ['<strong style=\\"font-size:16px\\">ソフトウエア管理台帳ver.1</strong>', '<strong style=\\"font-size:16px\\">記憶媒体等管理台帳ver.1</strong>'],
  ['placeholder="製品名・型番・ソフトウエアの情報・氏名・所属…"', 'placeholder="種別・名称・容量・ハードウエア情報・氏名・所属…"'],
  ['\'<label>ライセンス種別<select id="swl-license-type">\' +\n        licenseOptionsHtml("") +\n        \'</select></label><label>製品名<input id="swl-software-name"></label>\' +\n        \'<label>型番<input id="swl-model-number"></label>\' +', 'buildMediaTypeFieldsHtml(null) +'],
  ['\'<label>ライセンス種別<select id="swl-license-type">\' +\n        licenseOptionsHtml(row.license_type) +\n        \'</select></label><label>製品名<input id="swl-software-name" value="\' +\n        esc(row.software_name) +\n        \'"></label><label>型番<input id="swl-model-number" value="\' +\n        esc(row.model_number) +\n        \'"></label>\' +', 'buildMediaTypeFieldsHtml(row) +'],
];

for (const [from, to] of replacements) {
  if (!s.includes(from)) {
    console.warn('WARN: pattern not found:', from.slice(0, 60).replace(/\n/g, ' '));
  }
  s = s.split(from).join(to);
}

const insertAfter = 'function mediaTypeOptionsHtml(selected) {';
const mediaHelpers = `
  var MEDIA_TYPE_OTHER = "その他";

  function buildMediaTypeFieldsHtml(row) {
    row = row || {};
    var mt = row.media_type || "";
    var showOther = mt === MEDIA_TYPE_OTHER;
    return (
      '<label>媒体種別<select id="swl-media-type">' +
      mediaTypeOptionsHtml(mt) +
      '</select></label>' +
      '<div id="swl-media-type-other-wrap" style="display:' +
      (showOther ? "block" : "none") +
      '">' +
      '<label>種別（その他）<input id="swl-media-type-other" value="' +
      esc(row.media_type_other || "") +
      '"></label></div>' +
      '<label>名称<input id="swl-item-name" value="' +
      esc(row.item_name || "") +
      '"></label>' +
      '<label>容量<input id="swl-capacity" value="' +
      esc(row.capacity || "") +
      '" placeholder="例: 32GB"></label>'
    );
  }

  function wireMediaTypeUi(box) {
    var sel = box.querySelector("#swl-media-type");
    var wrap = box.querySelector("#swl-media-type-other-wrap");
    if (!sel || !wrap) return;
    sel.addEventListener("change", function () {
      wrap.style.display = sel.value === MEDIA_TYPE_OTHER ? "block" : "none";
    });
  }
`;

if (!s.includes('function buildMediaTypeFieldsHtml')) {
  s = s.replace(insertAfter, insertAfter + mediaHelpers);
}

s = s.replace(
  'wireIdSlotUi(box);\n    wireEmployeePicker(box);\n  }\n\n  function openEditModal',
  'wireIdSlotUi(box);\n    wireMediaTypeUi(box);\n    wireEmployeePicker(box);\n  }\n\n  function openEditModal',
);
s = s.replace(
  'wireIdSlotUi(box);\n    wireEmployeePicker(box);\n  }\n\n  function openRetireModal',
  'wireIdSlotUi(box);\n    wireMediaTypeUi(box);\n    wireEmployeePicker(box);\n  }\n\n  function openRetireModal',
);

writeFileSync(dest, s, 'utf8');
console.log('Wrote', dest, 'bytes=', Buffer.byteLength(s));
