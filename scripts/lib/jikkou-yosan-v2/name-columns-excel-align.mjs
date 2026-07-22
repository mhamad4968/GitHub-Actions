/**
 * Excel 内訳の名称・規格3列（U4/U10）と App2 name_1/2/3 の整列。
 *
 * Excel 正:
 *   name1（左）= 種別 … 材料費 / 労務費 / 工具･機械使用料 / 現場経費 …
 *   name2       = 細目 … 塗料 / 労務費（夜間） / 事前打合せ費等 …
 *   name3       = 規格・製品詳細（手入力）
 *
 * 736 移行の誤り:
 *   subcontract: sub_line_type → name_1 のみ（細目が左列に入る）
 *   mat_lines: mat_name→name_1, capacity→name_2, maker→name_3（製品が左列）
 */

export const EXCEL_NAME1_KINDS = Object.freeze([
  "材料費",
  "労務費",
  "外注費",
  "仮設機械経費",
  // 移行済みパイロット等の表記ゆれ（Excel 核は 仮設機械経費）
  "工具･機械使用料",
  "現場経費",
  "諸経費",
  "各種保険料(任意保険）",
  "法定福利費",
]);

/** 細目（Excel 2列目）→ 種別（1列目） */
export const NAME2_TO_NAME1 = Object.freeze({
  塗料: "材料費",
  その他材料費: "材料費",
  鋼材費: "材料費",
  塗装工事一式: "材料費",
  "土木ｼｰﾄ・砕石等": "材料費",
  "土木シート・砕石等": "材料費",
  "労務費（昼）": "労務費",
  "労務費（夜）": "労務費",
  "労務費（夜間）": "労務費",
  事前打合せ費等: "工具･機械使用料",
  "仮設・工具費等": "工具･機械使用料",
  運送費: "工具･機械使用料",
  宿泊費: "工具･機械使用料",
  交通費: "工具･機械使用料",
  足場資材リース費: "工具･機械使用料",
  発電機損料: "工具･機械使用料",
  高所作業車: "工具･機械使用料",
  足場工事一式: "工具･機械使用料",
  塗装及び足場工事一式: "材料費",
  橋梁名称標: "材料費",
  "ｶｯﾃｨﾝｸﾞｼｰﾄ": "材料費",
  その他: "工具･機械使用料",
});

const FOOTER_KINDS = new Set([
  "overhead",
  "insurance",
  "subtotal",
  "legal_welfare",
  "block_total",
  "block_header",
]);

function text(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function isCapacityLike(value) {
  return /^\d+(\.\d+)?$/.test(text(value));
}

/**
 * 1明細行を Excel 3列へ寄せる（フッタ・見出しは触らない）。
 * @returns {{ name_1: string, name_2: string, name_3: string, name_spec_group: string, changed: boolean }}
 */
export function alignDetailNameColumns(row) {
  const rowKind = text(row.row_kind || row.rowKind);
  if (FOOTER_KINDS.has(rowKind)) {
    return {
      name_1: text(row.name_1 ?? row.name1),
      name_2: text(row.name_2 ?? row.name2),
      name_3: text(row.name_3 ?? row.name3),
      name_spec_group: text(row.name_spec_group),
      changed: false,
    };
  }

  let n1 = text(row.name_1 ?? row.name1);
  let n2 = text(row.name_2 ?? row.name2);
  let n3 = text(row.name_3 ?? row.name3);
  let group = text(row.name_spec_group);
  const before = `${n1}|${n2}|${n3}|${group}`;

    // 材料行パターン: 製品|容量|メーカー + group=塗料等（細目）
  if (n1 && isCapacityLike(n2) && (n3 || group === "塗料" || group === "その他")) {
    const product = n1;
    const capacity = n2;
    const maker = n3;
    const category = group || "塗料";
    n1 = "";
    n2 = category;
    n3 = [product, capacity ? `${capacity}` : "", maker].filter(Boolean).join(" ");
    group = NAME2_TO_NAME1[category] || "材料費";
  } else if (n1 && !n2 && !n3) {
    // 外注明細パターン: 細目だけが name_1 に入っている
    if (EXCEL_NAME1_KINDS.includes(n1)) {
      group = n1;
    } else {
      const kind = NAME2_TO_NAME1[n1] || "";
      n2 = n1;
      n1 = ""; // グループ先頭で種別を入れる
      if (kind) group = kind;
      else if (!group) group = "";
    }
  } else if (n1 && n2 && EXCEL_NAME1_KINDS.includes(n1)) {
    // 既に Excel 形
    group = n1;
  } else if (!n1 && n2) {
    const kind = NAME2_TO_NAME1[n2] || group;
    if (kind) group = kind;
  }

  const changed = before !== `${n1}|${n2}|${n3}|${group}`;
  return { name_1: n1, name_2: n2, name_3: n3, name_spec_group: group, changed };
}

/**
 * 同一ブロック内の detail 行配列を U10 形に整える。
 * 種別が変わる先頭行だけ name_1 に種別を出し、続きは name_1 空・name_2 に細目。
 */
export function alignBlockDetailNameColumns(detailRows) {
  let lastKind = "";
  return detailRows.map((row) => {
    const aligned = alignDetailNameColumns(row);
    const rowKind = text(row.row_kind || row.rowKind);
    if (FOOTER_KINDS.has(rowKind)) {
      return { ...row, ...aligned, changed: aligned.changed };
    }
    const kind =
      NAME2_TO_NAME1[aligned.name_2] ||
      (EXCEL_NAME1_KINDS.includes(aligned.name_spec_group)
        ? aligned.name_spec_group
        : "") ||
      (EXCEL_NAME1_KINDS.includes(aligned.name_1) ? aligned.name_1 : "") ||
      aligned.name_spec_group ||
      "";
    let name1 = aligned.name_1;
    let name2 = aligned.name_2;
    if (kind) {
      if (kind !== lastKind) {
        name1 = kind;
        lastKind = kind;
        if (!name2 && aligned.name_1 && !EXCEL_NAME1_KINDS.includes(aligned.name_1)) {
          name2 = aligned.name_1;
        }
      } else {
        name1 = "";
        if (!name2 && aligned.name_1 && !EXCEL_NAME1_KINDS.includes(aligned.name_1)) {
          name2 = aligned.name_1;
        }
      }
    }
    const next = {
      ...row,
      name_1: name1,
      name_2: name2,
      name_3: aligned.name_3,
      name_spec_group: kind || aligned.name_spec_group,
    };
    const changed =
      text(row.name_1 ?? row.name1) !== next.name_1 ||
      text(row.name_2 ?? row.name2) !== next.name_2 ||
      text(row.name_3 ?? row.name3) !== next.name_3 ||
      text(row.name_spec_group) !== next.name_spec_group;
    return { ...next, changed };
  });
}
