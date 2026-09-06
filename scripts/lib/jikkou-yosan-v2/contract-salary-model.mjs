import {
  contractTotals,
  decimalLineAmount,
  displayInteger,
  salaryTotal,
  summaryTotals,
} from "./calc.mjs";
import { createRowKey } from "./keys.mjs";
import { allowedOperations } from "./lock.mjs";

// G0 U1: 単位はマスタ整理「単位」列を正本（Excel表記）。`－`は残す。
export const COMMON_UNITS = Object.freeze([
  "式",
  "橋",
  "回",
  "泊",
  "箇月",
  "日",
  "缶",
  "枚",
  "人",
  "着",
  "台",
  "％",
  "m2",
  "掛m2",
  "m3",
  "ｍ",
  "㎞",
  "㎏",
  "－",
]);
export const CONTRACT_SECTIONS = Object.freeze(["施工", "保安"]);
export const SALARY_DEFAULT_UNIT = "箇月";
// X7: 給与手当は消費税・税込とも「－」表示.
export const SALARY_TAX_DISPLAY = "－";
// 2026-09-05 給与 T/U — listOnly。T と U は独立（紐づけなし）。
export const SALARY_ROLE_MASTER = Object.freeze([
  "社員助勢",
  "現場代理人･監理技術者",
  "工事担当者",
  "社員工事管理者",
  "直轄工事安全専任管理者(昼)",
  "直轄線閉責任者",
  "直轄列車見張員",
  "直轄交通整理員",
  "直轄停電責任者",
  "直轄検電接地作業者",
  "直轄重機誘導員",
]);
export const SALARY_PERSON_MASTER = Object.freeze([
  "大塚　英雄",
  "山田　健太郎",
  "大内　清孝",
  "高良　智樹",
  "平嶋　伸也",
  "柏﨑　孝",
  "津田　健太郎",
  "根本　孝",
  "島﨑　信弘",
  "日田　聖人",
  "松本　結太",
  "倉田　純弥",
  "藤田　大輝",
  "海藤　光治",
  "加賀谷　慎吾",
  "阿部　伊吹",
  "赤堀　太一",
  "渡邊　陽一",
  "勝部　裕太",
  "大前　涼",
  "鈴木　純平",
  "高橋　成典",
  "佐藤　嘉辰",
  "森　蕉太",
  "伊藤　祐二",
  "小俣　富士夫",
  "中嶋　優歩",
  "船生　誠",
  "米沢　一起",
  "髙田　将平",
  "大井　晴男",
  "南部　結女",
]);

const CONTRACT_EDITABLE_FIELDS = Object.freeze([
  "workName",
  "workDesc",
  "unit",
  "quantity",
  "unitPrice",
  "note",
]);
const SALARY_EDITABLE_FIELDS = Object.freeze([
  "role",
  "personName",
  "unit",
  "quantity",
  "unitPrice",
  "note",
]);

function hasText(value) {
  return value !== undefined && value !== null && value !== "";
}

function normalizedOptional(value) {
  return hasText(value) ? String(value) : null;
}

// 給与氏名: 姓名間の空白は、半角・全角・連続を問わず全角1文字に統一する。
function normalizedSalaryPersonName(value) {
  if (!hasText(value)) return null;
  return String(value).trim().replace(/\s+/g, "　");
}

function assertPatchKeys(patch, editableFields, context) {
  if (!patch || typeof patch !== "object") {
    throw new TypeError(`${context}: patch must be an object`);
  }
  for (const key of Object.keys(patch)) {
    if (!editableFields.includes(key)) {
      throw new RangeError(`${context}: field "${key}" is not editable`);
    }
  }
}

function defaultUuidFactory() {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef && typeof cryptoRef.randomUUID === "function") {
    return cryptoRef.randomUUID();
  }
  throw new Error("crypto.randomUUID unavailable — pass uuidFactory");
}

// P-36: line amounts stay unrounded decimals internally; only the UI shows
// integers (displayInteger). D-21: a contract line without 契約工種 shows a
// blank amount and is excluded from totals.
export function contractLineAmount(line) {
  return hasText(line.workName)
    ? decimalLineAmount(line.quantity, line.unitPrice)
    : null;
}

export function salaryLineAmount(line) {
  return decimalLineAmount(line.quantity, line.unitPrice);
}

export function createContractSalaryModel({
  lockState,
  contractLines = [],
  salaryLines = [],
  uuidFactory = defaultUuidFactory,
} = {}) {
  const operations = allowedOperations(lockState);

  function blankContractLine(section) {
    return {
      rowKey: createRowKey(uuidFactory),
      section,
      workName: null,
      workDesc: null,
      unit: null,
      quantity: null,
      unitPrice: null,
      note: null,
    };
  }

  function blankSalaryLine() {
    return {
      rowKey: createRowKey(uuidFactory),
      role: null,
      personName: null,
      unit: SALARY_DEFAULT_UNIT,
      quantity: null,
      unitPrice: null,
      note: null,
    };
  }

  const contract = new Map(CONTRACT_SECTIONS.map((section) => [section, []]));
  for (const line of contractLines) {
    if (!contract.has(line.section)) {
      throw new RangeError(
        `contract line section must be 施工 or 保安 (got ${JSON.stringify(line.section)})`,
      );
    }
    contract.get(line.section).push({
      rowKey: hasText(line.rowKey) ? line.rowKey : createRowKey(uuidFactory),
      section: line.section,
      workName: normalizedOptional(line.workName),
      workDesc: normalizedOptional(line.workDesc),
      unit: normalizedOptional(line.unit),
      quantity: normalizedOptional(line.quantity),
      unitPrice: normalizedOptional(line.unitPrice),
      note: normalizedOptional(line.note),
    });
  }
  // D-15/D-16: 施工・保安 each start with (and always keep) at least one row.
  for (const section of CONTRACT_SECTIONS) {
    if (contract.get(section).length === 0) {
      contract.get(section).push(blankContractLine(section));
    }
  }

  const salary = salaryLines.map((line) => ({
    rowKey: hasText(line.rowKey) ? line.rowKey : createRowKey(uuidFactory),
    role: normalizedOptional(line.role),
    personName: normalizedSalaryPersonName(line.personName),
    unit: hasText(line.unit) ? String(line.unit) : SALARY_DEFAULT_UNIT,
    quantity: normalizedOptional(line.quantity),
    unitPrice: normalizedOptional(line.unitPrice),
    note: normalizedOptional(line.note),
  }));
  // D-30: 給与手当 keeps at least one row.
  if (salary.length === 0) salary.push(blankSalaryLine());

  function assertEditable(action) {
    if (!operations.editBudget) {
      throw new Error(`${action}: budget is locked (${lockState})`);
    }
  }

  function findContract(rowKey, context) {
    for (const section of CONTRACT_SECTIONS) {
      const band = contract.get(section);
      const index = band.findIndex((line) => line.rowKey === rowKey);
      if (index >= 0) return { band, index, line: band[index] };
    }
    throw new RangeError(`${context}: unknown contract rowKey ${rowKey}`);
  }

  function findSalary(rowKey, context) {
    const index = salary.findIndex((line) => line.rowKey === rowKey);
    if (index < 0) throw new RangeError(`${context}: unknown salary rowKey ${rowKey}`);
    return { index, line: salary[index] };
  }

  // Lines fed to calc.contractTotals: D-21 excludes 契約工種-less rows by
  // blanking the quantity so decimalLineAmount yields null.
  function effectiveContractLines() {
    return CONTRACT_SECTIONS.flatMap((section) =>
      contract.get(section).map((line) => ({
        section: line.section,
        quantity: hasText(line.workName) ? line.quantity : null,
        unitPrice: line.unitPrice,
      })),
    );
  }

  function totals(blocks = []) {
    return summaryTotals({
      contract: effectiveContractLines(),
      blocks,
      salaryLines: salary,
    });
  }

  function snapshotLine(line, amount) {
    return Object.freeze({
      ...line,
      amount,
      amountDisplay: displayInteger(amount),
    });
  }

  function snapshot() {
    const contractResult = contractTotals(effectiveContractLines());
    return Object.freeze({
      lockState,
      allowedOperations: operations,
      contractSections: Object.freeze(
        Object.fromEntries(
          CONTRACT_SECTIONS.map((section) => [
            section,
            Object.freeze(
              contract
                .get(section)
                .map((line) => snapshotLine(line, contractLineAmount(line))),
            ),
          ]),
        ),
      ),
      salaryLines: Object.freeze(
        salary.map((line) => snapshotLine(line, salaryLineAmount(line))),
      ),
      totals: Object.freeze({
        construction: contractResult.construction,
        safety: contractResult.safety,
        total1: contractResult.total1,
        salary: salaryTotal(salary),
      }),
    });
  }

  return Object.freeze({
    lockState,
    allowedOperations: operations,
    commonUnits: COMMON_UNITS,

    addContractLine(section) {
      assertEditable("addContractLine");
      if (!contract.has(section)) {
        throw new RangeError("addContractLine: section must be 施工 or 保安");
      }
      const line = blankContractLine(section);
      contract.get(section).push(line);
      return line.rowKey;
    },
    updateContractLine(rowKey, patch) {
      assertEditable("updateContractLine");
      assertPatchKeys(patch, CONTRACT_EDITABLE_FIELDS, "updateContractLine");
      const { line } = findContract(rowKey, "updateContractLine");
      for (const [key, value] of Object.entries(patch)) {
        line[key] = normalizedOptional(value);
      }
      return rowKey;
    },
    removeContractLine(rowKey) {
      assertEditable("removeContractLine");
      const { band, index } = findContract(rowKey, "removeContractLine");
      if (band.length <= 1) {
        throw new RangeError(
          "removeContractLine: each contract section keeps at least 1 row (D-16)",
        );
      }
      band.splice(index, 1);
    },
    // D-77: reorder stays inside the same 施工/保安 band.
    moveContractLine(rowKey, offset) {
      assertEditable("moveContractLine");
      if (offset !== 1 && offset !== -1) {
        throw new RangeError("moveContractLine: offset must be +1 or -1");
      }
      const { band, index } = findContract(rowKey, "moveContractLine");
      const target = index + offset;
      if (target < 0 || target >= band.length) return;
      [band[index], band[target]] = [band[target], band[index]];
    },

    addSalaryLine() {
      assertEditable("addSalaryLine");
      const line = blankSalaryLine();
      salary.push(line);
      return line.rowKey;
    },
    updateSalaryLine(rowKey, patch) {
      assertEditable("updateSalaryLine");
      assertPatchKeys(patch, SALARY_EDITABLE_FIELDS, "updateSalaryLine");
      const { line } = findSalary(rowKey, "updateSalaryLine");
      for (const [key, value] of Object.entries(patch)) {
        line[key] =
          key === "unit" && !hasText(value)
            ? SALARY_DEFAULT_UNIT
            : key === "personName"
              ? normalizedSalaryPersonName(value)
              : normalizedOptional(value);
      }
      return rowKey;
    },
    removeSalaryLine(rowKey) {
      assertEditable("removeSalaryLine");
      const { index } = findSalary(rowKey, "removeSalaryLine");
      if (salary.length <= 1) {
        throw new RangeError(
          "removeSalaryLine: salary keeps at least 1 row (D-30)",
        );
      }
      salary.splice(index, 1);
    },
    moveSalaryLine(rowKey, offset) {
      assertEditable("moveSalaryLine");
      if (offset !== 1 && offset !== -1) {
        throw new RangeError("moveSalaryLine: offset must be +1 or -1");
      }
      const { index } = findSalary(rowKey, "moveSalaryLine");
      const target = index + offset;
      if (target < 0 || target >= salary.length) return;
      [salary[index], salary[target]] = [salary[target], salary[index]];
    },

    snapshot,
    totals,
  });
}
