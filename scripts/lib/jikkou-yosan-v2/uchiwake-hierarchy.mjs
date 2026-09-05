/**
 * 756/757 内訳階層 — 純関数（仕様 2026-09-04 / 実装 2026-09-05）。
 * ブラウザ束ね: jikkou-yosan-v2-build-desktop.mjs が ESM を剥がす。
 *
 * 正本: docs/plans/2026-09-04-jikkou-yosan-v2-uchiwake-hierarchy-spec.md
 */

export const JY2_LEGAL_WELFARE_WORK_TYPE = "法定福利費";

export const JY2_UCHIWAKE_APP2_FIELDS = Object.freeze({
  nameDetail: "name_detail",
  nameItem: "name_item",
  lineVendorName: "line_vendor_name",
  linePersonName: "line_person_name",
});

/** システム工種コード → 費目（JSON 正本。未採番は名称キー）。 */
export const JY2_SYSTEM_WORK_HIMOKU_BY_CODE = Object.freeze({
  "10100": "材料費",
  "10200": "外注費",
  "10300": "外注費",
  "10400": "外注費",
  "10600": "外注費",
  "10700": "外注費",
  "14100": "外注費",
  "14200": "外注費",
  "14300": "外注費",
  "14400": "外注費",
  "14500": "外注費",
  "10900": "労務費",
  "10800": "仮設機械経費",
  "11600": "仮設機械経費",
  "11700": "現場経費",
  "11800": "現場経費",
  "11900": "現場経費",
  "12000": "現場経費",
  "12100": "現場経費",
  "12200": "現場経費",
  "12300": "現場経費",
  "12400": "現場経費",
  "12600": "現場経費",
  "12700": "現場経費",
  "12900": "現場経費",
  "13100": "現場経費",
  "13620": "現場経費",
  "12800": "その他費用",
  "13600": "その他費用",
  "11000": "外注労務費",
  "11100": "外注労務費",
  "11200": "外注労務費",
  "11300": "外注労務費",
  "11400": "外注労務費",
  "11500": "外注労務費",
  "13500": "外注労務費",
});

export const JY2_SYSTEM_WORK_HIMOKU_BY_NAME = Object.freeze({
  材料費: "材料費",
  塗装工事: "外注費",
  足場工事: "外注費",
  塗装及び足場工事: "外注費",
  修繕等工事: "外注費",
  塗装付帯工事: "外注費",
  軌道工事: "外注費",
  調査設計費: "外注費",
  外注試験費: "外注費",
  交通規制費: "外注費",
  "追加工事①": "外注費",
  "追加工事②": "外注費",
  "追加工事③": "外注費",
  "追加工事④": "外注費",
  "追加工事⑤": "外注費",
  工事管理者賃金: "労務費",
  建設機械オペレーター: "労務費",
  その他労務者: "労務費",
  鎌ヶ谷資材使用料: "仮設機械経費",
  レンタル: "仮設機械経費",
  "仮設・工具費等": "仮設機械経費",
  運送費: "現場経費",
  産業廃棄物処理費: "現場経費",
  租税公課: "現場経費",
  借地料等: "現場経費",
  消耗品費: "現場経費",
  事務費: "現場経費",
  通信費: "現場経費",
  旅費交通費: "現場経費",
  履行保証保険料: "現場経費",
  建退共証紙購入費: "現場経費",
  諸雑費: "現場経費",
  諸会費: "現場経費",
  会議費: "現場経費",
  補償費: "その他費用",
  交際費: "その他費用",
  "各種保険料(任意保険）": "その他費用",
  法定福利費: "その他費用",
  工事安全専任管理者: "外注労務費",
  線閉責任者: "外注労務費",
  列車見張員: "外注労務費",
  交通整理員: "外注労務費",
  検電接地: "外注労務費",
  その他保安費: "外注労務費",
  重機誘導員: "外注労務費",
});

function jy2FreezeTypeList(items) {
  return Object.freeze((items || []).map((item) => String(item)));
}

/** 工種コード → JSON 種別。外注工事（types が費目＋セル）は載せない。 */
export const JY2_SYSTEM_WORK_TYPES_BY_CODE = Object.freeze({
  "10100": jy2FreezeTypeList([
    "塗料",
    "鋼材",
    "二次製品",
    "生コンクリート･石材",
    "ＡＳ合材",
    "鋼製製品･ゴム製品等",
    "その他材料",
  ]),
  "10900": jy2FreezeTypeList(["出向工事管理者（昼間）", "出向工事管理者（夜間）"]),
  "10800": jy2FreezeTypeList(["仮設材･鉄道器材レンタル"]),
  "11600": jy2FreezeTypeList([
    "仮設材レンタル",
    "建設機械類レンタル",
    "保安用機材類レンタル",
    "仮設ハウス･仮設トイレ",
    "その他機材レンタル",
    "建設機械油脂類",
  ]),
  "11700": jy2FreezeTypeList([
    "工場製品運搬費",
    "建設機械運搬費",
    "仮設資材運搬費",
    "その他資材運搬費",
  ]),
  "11800": jy2FreezeTypeList(["一般産業廃棄物", "特別産業廃棄物"]),
  "11900": jy2FreezeTypeList(["収入印紙", "県証紙"]),
  "12000": jy2FreezeTypeList(["防護服･ペール缶"]),
  "12100": jy2FreezeTypeList(["電動ファン用フィルター"]),
  "12200": jy2FreezeTypeList(["郵便･宅配便など"]),
  "12300": jy2FreezeTypeList(["携帯電話代金やＦＡＸ料金"]),
  "12400": jy2FreezeTypeList([
    "出張旅費特例",
    "３万円未満公共交通機関特例",
    "その他旅費交通費",
    "借上げ自動車費",
  ]),
  "12600": jy2FreezeTypeList(["労災保険料"]),
  "12700": jy2FreezeTypeList(["建退共証紙購入費"]),
  "12900": jy2FreezeTypeList(["寄付金･安全祈願祭など", "汲み取り料", "その他日用雑貨等"]),
  "13100": jy2FreezeTypeList(["安全衛生協議会費", "その他諸団体会費"]),
  "13620": jy2FreezeTypeList(["事前打合せ費等"]),
  "12800": jy2FreezeTypeList([
    "漁協・水利組合など",
    "瑕損補修費",
    "隣接物瑕損補償費",
    "その他補償費",
  ]),
  "13600": jy2FreezeTypeList([
    "得意先接待交際費（甲）",
    "得意先接待交際費（乙）",
    "その他接待交際費",
  ]),
  "11000": jy2FreezeTypeList([
    "出向工事安全専任管理者（昼間）",
    "出向工事安全専任管理者（夜間）",
  ]),
  "11100": jy2FreezeTypeList(["外注線閉責任者（昼間）", "外注線閉責任者（夜間）"]),
  "11200": jy2FreezeTypeList(["外注列車見張員（昼間）", "外注列車見張員（夜間）"]),
  "11300": jy2FreezeTypeList(["外注交通整理員（昼間）", "外注交通整理員（夜間）"]),
  "11400": jy2FreezeTypeList([
    "外注停電責任者（昼間）",
    "外注停電責任者（夜間）",
    "外注検電接地作業者（昼間）",
    "外注検電接地作業者（夜間）",
  ]),
  "11500": jy2FreezeTypeList([
    "外注安全帯監視人（昼間）",
    "外注安全帯監視人（夜間）",
    "外注その他保安要員（昼間）",
    "外注その他保安要員（夜間）",
  ]),
  "13500": jy2FreezeTypeList(["外注重機誘導員（昼間）", "外注重機誘導員（夜間）"]),
});

/** 未採番・別名キー。外注工事名は載せない。 */
export const JY2_SYSTEM_WORK_TYPES_BY_NAME = Object.freeze({
  材料費: JY2_SYSTEM_WORK_TYPES_BY_CODE["10100"],
  工事管理者賃金: JY2_SYSTEM_WORK_TYPES_BY_CODE["10900"],
  建設機械オペレーター: jy2FreezeTypeList([
    "軌陸車オペレーター（昼間）",
    "軌陸車オペレーター（夜間）",
    "その他建設機械オペレーター（昼間）",
    "その他建設機械オペレーター（夜間）",
  ]),
  建設機械オペレーター賃金: jy2FreezeTypeList([
    "軌陸車オペレーター（昼間）",
    "軌陸車オペレーター（夜間）",
    "その他建設機械オペレーター（昼間）",
    "その他建設機械オペレーター（夜間）",
  ]),
  その他労務者: jy2FreezeTypeList(["その他労務者（昼間）", "その他労務者（夜間）"]),
  鎌ヶ谷資材使用料: JY2_SYSTEM_WORK_TYPES_BY_CODE["10800"],
  レンタル: JY2_SYSTEM_WORK_TYPES_BY_CODE["11600"],
  "仮設・工具費等": jy2FreezeTypeList(["油脂燃料費"]),
  運送費: JY2_SYSTEM_WORK_TYPES_BY_CODE["11700"],
  産業廃棄物処理費: JY2_SYSTEM_WORK_TYPES_BY_CODE["11800"],
  租税公課: JY2_SYSTEM_WORK_TYPES_BY_CODE["11900"],
  借地料等: JY2_SYSTEM_WORK_TYPES_BY_CODE["12000"],
  消耗品費: JY2_SYSTEM_WORK_TYPES_BY_CODE["12100"],
  事務費: JY2_SYSTEM_WORK_TYPES_BY_CODE["12200"],
  通信費: JY2_SYSTEM_WORK_TYPES_BY_CODE["12300"],
  旅費交通費: JY2_SYSTEM_WORK_TYPES_BY_CODE["12400"],
  履行保証保険料: JY2_SYSTEM_WORK_TYPES_BY_CODE["12600"],
  建退共証紙購入費: JY2_SYSTEM_WORK_TYPES_BY_CODE["12700"],
  諸雑費: JY2_SYSTEM_WORK_TYPES_BY_CODE["12900"],
  諸会費: JY2_SYSTEM_WORK_TYPES_BY_CODE["13100"],
  会議費: JY2_SYSTEM_WORK_TYPES_BY_CODE["13620"],
  補償費: JY2_SYSTEM_WORK_TYPES_BY_CODE["12800"],
  交際費: JY2_SYSTEM_WORK_TYPES_BY_CODE["13600"],
  "各種保険料(任意保険）": jy2FreezeTypeList(["各種保険料(任意保険）"]),
  工事安全専任管理者: JY2_SYSTEM_WORK_TYPES_BY_CODE["11000"],
  線閉責任者: JY2_SYSTEM_WORK_TYPES_BY_CODE["11100"],
  列車見張員: JY2_SYSTEM_WORK_TYPES_BY_CODE["11200"],
  交通整理員: JY2_SYSTEM_WORK_TYPES_BY_CODE["11300"],
  検電接地: JY2_SYSTEM_WORK_TYPES_BY_CODE["11400"],
  その他保安費: JY2_SYSTEM_WORK_TYPES_BY_CODE["11500"],
  重機誘導員: JY2_SYSTEM_WORK_TYPES_BY_CODE["13500"],
});

export function jy2HasUchiwakeText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

/** 外注工事の費目▼（JSON types セルを分解した5件。外注費そのものは出さない）。 */
export const JY2_GAICHU_HIMOKU_CHOICES = Object.freeze([
  "材料費",
  "労務費",
  "仮設機械経費",
  "現場経費",
  "その他費用",
]);

export function jy2IsGaichuHimoku(himoku) {
  return String(himoku || "").trim() === "外注費";
}

/** 費目セルに工種名（塗装工事等）を祖父しない。材料費工種の「材料費」は費目なので残す。 */
export function jy2HimokuCurrentIsWorkTypeName(current, workTypeName) {
  const cur = String(current || "")
    .trim()
    .replace(/^（塗）/u, "");
  if (!cur) return false;
  if (
    cur === "材料費" ||
    cur === "外注費" ||
    cur === "労務費" ||
    cur === "仮設機械経費" ||
    cur === "現場経費" ||
    cur === "その他費用" ||
    cur === "外注労務費"
  ) {
    return false;
  }
  const work = String(workTypeName || "")
    .trim()
    .replace(/^（塗）/u, "");
  if (work && cur === work) return true;
  if (!Object.prototype.hasOwnProperty.call(JY2_SYSTEM_WORK_HIMOKU_BY_NAME, cur)) {
    return false;
  }
  return JY2_SYSTEM_WORK_HIMOKU_BY_NAME[cur] !== cur;
}

export function jy2IsGaichuMaterial(himoku, typeName) {
  return jy2IsGaichuHimoku(himoku) && String(typeName || "").trim() === "材料費";
}

/** 外注×材料かつ細目が塗料／その他材料 → 品名マスタ（name_item）。 */
export function jy2GaichuItemUsesMaterialMaster(himoku, typeName, detail) {
  if (!jy2IsGaichuMaterial(himoku, typeName)) return false;
  const d = String(detail || "").trim();
  return d === "塗料" || d === "その他材料";
}

/** 外注×材料で細目が選ばれ、品名マスタ対象外 → 右セル「－」固定。細目空はまだ固定しない。 */
export function jy2GaichuItemIsDashFixed(himoku, typeName, detail) {
  if (!jy2IsGaichuMaterial(himoku, typeName)) return false;
  if (!jy2HasUchiwakeText(detail)) return false;
  return !jy2GaichuItemUsesMaterialMaster(himoku, typeName, detail);
}

export function jy2UchiwakeUsesMaterialList(himoku, typeName) {
  const h = String(himoku || "").trim();
  const t = String(typeName || "").trim();
  if (h === "その他材料費") return true;
  return h === "材料費" && (t === "塗料" || t === "その他材料" || t === "その他材料費");
}

/** 詳細の入力が要る: 外注で種別あり、材料リスト、材料費のその他種別（鋼材等）。 */
export function jy2UchiwakeDetailNeedsInput(himoku, typeName) {
  const h = String(himoku || "").trim();
  const t = String(typeName || "").trim();
  if (!h) return false;
  if (jy2IsGaichuHimoku(h)) return Boolean(t);
  if (jy2UchiwakeUsesMaterialList(h, t)) return true;
  if (h === "材料費" && t) return true;
  return false;
}

/** 詳細に入れる必要がない → 「－」固定。費目未定は空のまま。 */
export function jy2UchiwakeDetailIsDashFixed(himoku, typeName) {
  if (!jy2HasUchiwakeText(himoku)) return false;
  return !jy2UchiwakeDetailNeedsInput(himoku, typeName);
}

/** 詳細を－固定するときの patch。入力が要る行は空オブジェクト。 */
export function jy2UchiwakeDetailDashPatch(himoku, typeName) {
  if (!jy2UchiwakeDetailIsDashFixed(himoku, typeName)) return {};
  if (jy2IsGaichuHimoku(himoku)) {
    return { nameDetail: "－", nameItem: null };
  }
  return { name3: "－", nameDetail: null, nameItem: null };
}

/** 仕様 §3.1 行の会社列。 */
export function jy2UchiwakeLineVendorVisible(himoku, typeName) {
  const h = String(himoku || "").trim();
  const t = String(typeName || "").trim();
  if (h === "労務費" || h === "外注労務費") return true;
  if (h === "仮設機械経費") return true;
  if (h === "外注費" && (t === "労務費" || t === "仮設機械経費")) return true;
  return false;
}

/** 仕様 §3.1 行の氏名列（会社の右隣）。仮設は会社のみ。 */
export function jy2UchiwakeLinePersonVisible(himoku, typeName) {
  const h = String(himoku || "").trim();
  const t = String(typeName || "").trim();
  if (h === "労務費" || h === "外注労務費") return true;
  if (h === "外注費" && t === "労務費") return true;
  return false;
}

/** Q3: 条件外になった会社・氏名だけクリア。 */
export function jy2UchiwakeClearOutOfScopeLineFields(himoku, typeName, row) {
  const patch = {};
  if (
    !jy2UchiwakeLineVendorVisible(himoku, typeName) &&
    jy2HasUchiwakeText(row && row.lineVendorName)
  ) {
    patch.lineVendorName = null;
  }
  if (
    !jy2UchiwakeLinePersonVisible(himoku, typeName) &&
    jy2HasUchiwakeText(row && row.linePersonName)
  ) {
    patch.linePersonName = null;
  }
  return patch;
}

export function jy2UchiwakeRowHasLineVendor(row) {
  return jy2HasUchiwakeText(row && row.lineVendorName);
}

/** 行に会社名がある → ブロック取引先は「－」。 */
export function jy2NextBlockVendorAfterLineCompanies(block) {
  const rows = block && Array.isArray(block.detailRows) ? block.detailRows : [];
  if (rows.some(jy2UchiwakeRowHasLineVendor)) return "－";
  return block && block.vendorName != null ? block.vendorName : null;
}

function jy2UchiwakeRowLooksUsed(row) {
  if (!row) return false;
  const keys = [
    "name1",
    "name2",
    "name3",
    "nameDetail",
    "nameItem",
    "unit",
    "quantity",
    "unitPrice",
    "note",
    "lineVendorName",
    "linePersonName",
  ];
  return keys.some((key) => jy2HasUchiwakeText(row[key]));
}

/**
 * Q4: 保存時のみ。保存は止めない。
 * 1. 行会社ありなのにブロックが「－」以外 → 自動側の取りこぼし警告
 * 2. 行会社なし かつ ブロック空または「－」 → ブロック会社を入れてください
 * 3. ブロックが「－」で、会社列対象の使用中行が空 → 行の会社が空
 */
export function jy2CollectUchiwakeSaveWarnings(blocks) {
  const warnings = [];
  (blocks || []).forEach((block, blockIndex) => {
    if (!block || block.status === "retired") return;
    const rows = Array.isArray(block.detailRows) ? block.detailRows : [];
    const label =
      String(block.workTypeName || "").trim() ||
      String(block.workTypeCode || "").trim() ||
      `工種${blockIndex + 1}`;
    const anyLineVendor = rows.some(jy2UchiwakeRowHasLineVendor);
    const vendor = String(block.vendorName || "").trim();
    if (anyLineVendor && vendor && vendor !== "－") {
      warnings.push(`${label}: 行に会社名があるためブロックの取引先を「－」にしてください`);
    }
    if (!anyLineVendor && (!vendor || vendor === "－")) {
      warnings.push(`${label}: ブロックの会社名を入れてください`);
    }
    if (vendor === "－") {
      rows.forEach((row, rowIndex) => {
        if (!jy2UchiwakeRowLooksUsed(row)) return;
        const himoku = String(row.name1 || "").trim();
        const typeName = String(row.name2 || "").trim();
        if (!jy2UchiwakeLineVendorVisible(himoku, typeName)) return;
        if (!jy2UchiwakeRowHasLineVendor(row)) {
          warnings.push(`${label} 行${rowIndex + 1}: 会社名が空です`);
        }
      });
    }
  });
  return warnings;
}

/** ピッカーから法定福利費を除く。現行値がそれなら呼び出し側の listOnly 祖父に任せる。 */
export function jy2FilterSystemWorkNamesForPicker(masterNames) {
  return (masterNames || []).filter((name) => name !== JY2_LEGAL_WELFARE_WORK_TYPE);
}

/** コード表の旧名称・括弧ゆれを JSON キーへ。塗装工事等の外注工種名は変換しない。 */
export const JY2_SYSTEM_WORK_NAME_ALIASES = Object.freeze({
  その他労務者賃金: "その他労務者",
  建設機械オペレーター賃金: "建設機械オペレーター",
  "各種保険料（任意保険）": "各種保険料(任意保険）",
  "各種保険料（任意保険)": "各種保険料(任意保険）",
  "各種保険料(任意保険)": "各種保険料(任意保険）",
});

export function jy2CanonicalSystemWorkName(name) {
  const n = String(name || "")
    .trim()
    .replace(/^（塗）/u, "");
  if (!n) return "";
  return JY2_SYSTEM_WORK_NAME_ALIASES[n] || n;
}

export function jy2HimokuFromSystemWork(code, name) {
  const c = String(code || "").trim();
  if (c && Object.prototype.hasOwnProperty.call(JY2_SYSTEM_WORK_HIMOKU_BY_CODE, c)) {
    return JY2_SYSTEM_WORK_HIMOKU_BY_CODE[c];
  }
  const n = jy2CanonicalSystemWorkName(name);
  if (n && Object.prototype.hasOwnProperty.call(JY2_SYSTEM_WORK_HIMOKU_BY_NAME, n)) {
    return JY2_SYSTEM_WORK_HIMOKU_BY_NAME[n];
  }
  return null;
}

/**
 * 費目▼の候補。コード表 himoku の余剰（諸経費・予備費等）は混ぜない。
 * JSON 費目が外注費の工種 → 材料費〜その他費用の5件（工種名は出さない）。
 * それ以外の JSON 費目が7件に含まれる → その1件。工種空／未登録 → 7件。
 */
export function jy2HimokuChoicesFromSystemWork(code, name, masterMenu) {
  const master = Array.isArray(masterMenu) ? [...masterMenu] : [];
  const fromJson = jy2HimokuFromSystemWork(code, name);
  if (fromJson === "外注費") {
    return JY2_GAICHU_HIMOKU_CHOICES.filter((item) => master.includes(item));
  }
  if (fromJson && master.includes(fromJson)) return [fromJson];
  return master;
}

export function jy2JsonTypesFromSystemWork(code, name) {
  const c = String(code || "").trim();
  if (c && Object.prototype.hasOwnProperty.call(JY2_SYSTEM_WORK_TYPES_BY_CODE, c)) {
    return [...JY2_SYSTEM_WORK_TYPES_BY_CODE[c]];
  }
  const n = jy2CanonicalSystemWorkName(name);
  if (n && Object.prototype.hasOwnProperty.call(JY2_SYSTEM_WORK_TYPES_BY_NAME, n)) {
    return [...JY2_SYSTEM_WORK_TYPES_BY_NAME[n]];
  }
  return null;
}

/**
 * 種別▼。JSON に工種 types があればその部分集合。
 * 外注工事は選んだ費目のマスタ（塗料等）を流用。工種空は費目マスタ全体。
 */
export function jy2TypesFromSystemWork(code, name, himoku, himokuTypeMaster) {
  const key = String(himoku || "").trim();
  const masterList = Array.isArray(himokuTypeMaster) ? [...himokuTypeMaster] : [];
  if (!key) return [];
  const jsonHimoku = jy2HimokuFromSystemWork(code, name);
  if (jsonHimoku === "外注費") return masterList;
  const jsonTypes = jy2JsonTypesFromSystemWork(code, name);
  if (jsonTypes && jsonTypes.length) {
    if (masterList.length) {
      const filtered = jsonTypes.filter((item) => masterList.includes(item));
      if (filtered.length) return filtered;
    }
    return jsonTypes;
  }
  return masterList;
}

/** Excel「材料費＋労務費＋…」を種別5件へ。半角 + 混在可。 */
export function jy2SplitGaichuTypesCell(cell) {
  const s = String(cell || "").trim();
  if (!s) return [];
  if (!/[＋+]/.test(s)) return [s];
  return s
    .split(/[＋+]/)
    .map((part) => part.trim())
    .filter(Boolean);
}
