/**
 * Ver.02 App1 一覧 — 工事コードでグループ化し、開く版を決める純関数。
 * Ver.01 の buildListProjectRows / pickOpenVersion と同じ方針。
 */

export function versionSeqNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** 下書きがあれば下書き、なければ最大版連番の版を「開く版」とする。 */
export function pickOpenVersion(versions) {
  if (!Array.isArray(versions) || versions.length === 0) return null;
  const draft = versions.find((row) => row.status === "下書き");
  if (draft) return draft;
  let best = versions[0];
  for (const row of versions) {
    if (versionSeqNum(row.version_seq) >= versionSeqNum(best.version_seq)) best = row;
  }
  return best;
}

/**
 * App1 レコード行（フラット）→ 工事1行（最新/下書き版の代表列付き）。
 * @param {readonly object[]} recordRows
 */
export function buildListProjectRows(recordRows) {
  if (!Array.isArray(recordRows)) throw new TypeError("recordRows must be an array");
  const map = new Map();
  for (const row of recordRows) {
    const key = row.project_code || "(工事コードなし)";
    if (!map.has(key)) {
      map.set(key, {
        project_code: key,
        project_name: row.project_name || key,
        project_official_name: row.project_official_name || "",
        versions: [],
      });
    }
    const group = map.get(key);
    group.versions.push(row);
    if (!group.project_name && row.project_name) group.project_name = row.project_name;
    if (!group.project_official_name && row.project_official_name) {
      group.project_official_name = row.project_official_name;
    }
  }
  return [...map.values()].map((group) => {
    const open = pickOpenVersion(group.versions) || group.versions[0];
    return Object.freeze({
      project_code: group.project_code,
      project_name: group.project_name,
      project_official_name: group.project_official_name,
      open_id: open.id,
      version_seq: open.version_seq,
      version_type: open.version_type,
      status: open.status,
      updated_at: open.updated_at,
      contract_total_1: open.contract_total_1,
      profit_9: open.profit_9,
    });
  });
}

export function normalizeListSearch(query) {
  return String(query ?? "").trim().toLowerCase();
}

export function rowMatchesListSearch(row, query) {
  const q = normalizeListSearch(query);
  if (!q) return true;
  const hay = [
    row.project_name,
    row.project_code,
    row.project_official_name,
    row.version_type,
    row.status,
    row.updated_at,
    String(row.version_seq),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function filterListRows(rows, query) {
  if (!Array.isArray(rows)) throw new TypeError("rows must be an array");
  const q = normalizeListSearch(query);
  if (!q) return [...rows];
  return rows.filter((row) => rowMatchesListSearch(row, q));
}
