/**
 * Excel 内訳シート → Ver.02 detail-block-model 入力ブロック配列。
 *
 * 正本ジオメトリ: docs/plans/2026-07-20-jikkou-list-source-scan.md
 * BE列 = No.n ブロック先頭。A/H/R = 名称3列、AD/AI/AL/AQ/AX = 数量/単位/単価/金額/備考。
 */
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

import { DETAIL_UNITS } from "./detail-block-model.mjs";

const FOOTER_LABELS = Object.freeze({
  諸経費: "overhead",
  "各種保険料（任意保険）": "insurance",
  "各種保険料(任意保険）": "insurance",
  "各種保険料（任意保険)": "insurance",
  小計: "subtotal",
  法定福利費: "legal_welfare",
  計: "block_total",
});

const HEADER_MARKERS = new Set(["システム入力工種", "名　称・規　格", "名称・規格"]);

function cell(sheet, col, row) {
  const ref = `${col}${row}`;
  const c = sheet[ref];
  if (!c) return "";
  if (c.t === "z") return "";
  if (c.w != null && String(c.w).trim() !== "") return String(c.w).trim();
  if (c.v == null) return "";
  return String(c.v).trim();
}

function numOrNull(raw) {
  if (raw === "" || raw == null) return null;
  const s = String(raw).replace(/,/g, "").trim();
  if (s === "" || s === "#REF!" || s === "#VALUE!" || s === "#N/A") return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return String(n);
}

function textOrNull(raw) {
  if (raw === "" || raw == null) return null;
  const s = String(raw).trim();
  if (!s || s === "#REF!") return null;
  return s;
}

function normalizeUnit(raw, warnings, where) {
  const u = textOrNull(raw);
  if (!u) return null;
  if (DETAIL_UNITS.includes(u)) return u;
  warnings.push(`${where}: unknown unit ${JSON.stringify(u)} → blank`);
  return null;
}

function isFooterLabel(name1) {
  return Object.prototype.hasOwnProperty.call(FOOTER_LABELS, name1);
}

function rowHasDetailContent(row) {
  return Boolean(
    row.name1 ||
      row.name2 ||
      row.name3 ||
      row.quantity ||
      row.unitPrice ||
      row.note,
  );
}

function loadInventorySections(inventoryPath) {
  const map = new Map();
  if (!inventoryPath || !fs.existsSync(inventoryPath)) return map;
  const inv = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
  for (const b of inv.uchiwake_blocks || []) {
    const no = String(b.uchiwake_no || "").replace(/^No\./i, "");
    map.set(no, {
      costCategory: b.section === "保安" ? "保安" : "施工",
      workTypeCode: b.work_type_code != null ? String(b.work_type_code) : null,
      workTypeName: b.work_type_name || null,
    });
  }
  return map;
}

/**
 * @param {string} xlsxPath
 * @param {{ inventoryPath?: string }} [options]
 * @returns {{ blocks: object[], warnings: string[], meta: object }}
 */
export function parseExcelUchiwake(xlsxPath, options = {}) {
  const warnings = [];
  const abs = path.resolve(xlsxPath);
  if (!fs.existsSync(abs)) throw new Error(`Excel not found: ${abs}`);

  const wb = XLSX.read(fs.readFileSync(abs), { type: "buffer", cellDates: false, raw: false });
  const sheetName = wb.SheetNames.find((n) => n === "内訳") || wb.SheetNames[2];
  if (!sheetName) throw new Error("内訳 sheet not found");
  const sheet = wb.Sheets[sheetName];
  const ref = sheet["!ref"] || "A1";
  const range = XLSX.utils.decode_range(ref);
  const maxRow = range.e.r + 1;

  const beRows = [];
  for (let r = 1; r <= maxRow; r += 1) {
    const be = cell(sheet, "BE", r);
    const m = /^No\.?\s*(\d+)$/i.exec(be);
    if (m) beRows.push({ row: r, no: Number(m[1]), label: `No.${m[1]}` });
  }
  if (beRows.length === 0) throw new Error("No BE 内訳№ markers found");

  const inventory = loadInventorySections(options.inventoryPath);
  const blocks = [];

  for (let i = 0; i < beRows.length; i += 1) {
    const start = beRows[i].row;
    const endExclusive = i + 1 < beRows.length ? beRows[i + 1].row : maxRow + 1;
    const no = String(beRows[i].no);
    const inv = inventory.get(no) || {};

    const headerCode = textOrNull(cell(sheet, "H", start));
    const headerName = textOrNull(cell(sheet, "L", start));
    const vendorName = textOrNull(cell(sheet, "Y", start));

    const detailRows = [];
    const footerAmounts = {
      overhead: null,
      insurance: null,
      legalWelfare: null,
    };

    for (let r = start + 1; r < endExclusive; r += 1) {
      const name1 = textOrNull(cell(sheet, "A", r));
      const name2 = textOrNull(cell(sheet, "H", r));
      const name3 = textOrNull(cell(sheet, "R", r));
      if (HEADER_MARKERS.has(name1 || "")) continue;

      if (name1 && isFooterLabel(name1)) {
        const kind = FOOTER_LABELS[name1];
        const amount = numOrNull(cell(sheet, "AQ", r));
        if (kind === "overhead") footerAmounts.overhead = amount;
        else if (kind === "insurance") footerAmounts.insurance = amount;
        else if (kind === "legal_welfare") footerAmounts.legalWelfare = amount;
        // subtotal / block_total are recomputed in the model
        continue;
      }

      const quantity = numOrNull(cell(sheet, "AD", r));
      const unitPrice = numOrNull(cell(sheet, "AL", r));
      const unit = normalizeUnit(cell(sheet, "AI", r), warnings, `${beRows[i].label}!R${r}`);
      const note = textOrNull(cell(sheet, "AX", r));
      const row = {
        name1,
        name2,
        name3,
        unit,
        quantity,
        unitPrice,
        note,
      };
      if (!rowHasDetailContent(row)) continue;
      detailRows.push(row);
    }

    if (detailRows.length === 0) {
      detailRows.push({
        name1: null,
        name2: null,
        name3: null,
        unit: null,
        quantity: null,
        unitPrice: null,
        note: null,
      });
    }

    blocks.push({
      excelNo: beRows[i].label,
      costCategory: inv.costCategory || "施工",
      workTypeCode: headerCode || inv.workTypeCode || null,
      workTypeName: headerName || inv.workTypeName || null,
      vendorName,
      detailRows,
      overhead: footerAmounts.overhead,
      insurance: footerAmounts.insurance,
      legalWelfare: footerAmounts.legalWelfare,
    });
  }

  return {
    blocks,
    warnings,
    meta: {
      xlsxPath: abs,
      sheetName,
      blockCount: blocks.length,
      detailRowCount: blocks.reduce((n, b) => n + b.detailRows.length, 0),
    },
  };
}

export function excelBlocksToModelBlocks(parsedBlocks) {
  return parsedBlocks.map((b) => ({
    workTypeCode: b.workTypeCode,
    workTypeName: b.workTypeName,
    costCategory: b.costCategory,
    vendorName: b.vendorName,
    detailRows: b.detailRows.map((r) => ({
      name1: r.name1,
      name2: r.name2,
      name3: r.name3,
      unit: r.unit,
      quantity: r.quantity,
      unitPrice: r.unitPrice,
      note: r.note,
    })),
    overhead: b.overhead,
    insurance: b.insurance,
    legalWelfare: b.legalWelfare,
  }));
}
