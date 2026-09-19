/**
 * 776 本務スロットを 595.sort 順に並べ替える（兼務行の枠は維持）。
 * 595.sort の数値は list_sort にコピーしない。emp_id / 部室は扱わない。
 */

export function isHonmuRole(role) {
  return String(role || "").trim() === "本務";
}

function honmuRank(row, sortBySourceId) {
  const sid = String(row.source595Id || "").trim();
  const s = Number(sortBySourceId[sid]);
  if (isFinite(s) && s > 0) return s;
  return 999999;
}

/**
 * @param {Array<{id: string, role: string, listSort: number, source595Id: string}>} rows
 *   現行 list_sort 順（同値は呼び出し側で安定化済み想定）
 * @param {Record<string, number>} sortBySourceId 595.$id → 595.sort
 * @returns {{ nextIds: string[], updates: Array<{id: string, from: number, to: number}>, honmuCount: number }}
 */
export function planHonmuSlotAlign(rows, sortBySourceId) {
  const ordered = Array.isArray(rows) ? rows.slice() : [];
  const honmuIdx = [];
  const honmuRows = [];
  for (let i = 0; i < ordered.length; i++) {
    if (isHonmuRole(ordered[i].role)) {
      honmuIdx.push(i);
      honmuRows.push(ordered[i]);
    }
  }
  honmuRows.sort(function (a, b) {
    const ra = honmuRank(a, sortBySourceId);
    const rb = honmuRank(b, sortBySourceId);
    if (ra !== rb) return ra - rb;
    const sa = Number(a.listSort);
    const sb = Number(b.listSort);
    if (sa !== sb) return (isFinite(sa) ? sa : 999999) - (isFinite(sb) ? sb : 999999);
    return String(a.id).localeCompare(String(b.id), "en");
  });
  const next = ordered.slice();
  for (let i = 0; i < honmuIdx.length; i++) {
    next[honmuIdx[i]] = honmuRows[i];
  }
  const nextIds = next.map(function (r) {
    return String(r.id);
  });
  const updates = [];
  for (let i = 0; i < next.length; i++) {
    const want = i + 1;
    const from = Number(next[i].listSort);
    if (!isFinite(from) || from !== want) {
      updates.push({
        id: String(next[i].id),
        from: isFinite(from) ? from : 0,
        to: want,
      });
    }
  }
  return { nextIds: nextIds, updates: updates, honmuCount: honmuRows.length };
}

/**
 * 在籍595を現行sort順で受け取り、正社員/準社員の枠だけ 776本務順で入れ替える。
 * その他の枠は維持。emp_id は扱わない。
 * @param {Array<{id: string, category: string, sort: number}>} active595
 * @param {string[]} honmu595IdsFrom776
 */
export function plan595SortFollowHonmu(active595, honmu595IdsFrom776) {
  const ordered = Array.isArray(active595) ? active595.slice() : [];
  const slots = [];
  const occupants = [];
  for (let i = 0; i < ordered.length; i++) {
    const cat = String(ordered[i].category || "").trim();
    if (cat === "正社員" || cat === "準社員") {
      slots.push(i);
      occupants.push(String(ordered[i].id));
    }
  }
  const occupantSet = {};
  for (let o = 0; o < occupants.length; o++) occupantSet[occupants[o]] = true;
  const seen = {};
  const fill = [];
  const from776 = Array.isArray(honmu595IdsFrom776) ? honmu595IdsFrom776 : [];
  for (let h = 0; h < from776.length; h++) {
    const id = String(from776[h] || "").trim();
    if (!id || !occupantSet[id] || seen[id]) continue;
    seen[id] = true;
    fill.push(id);
  }
  for (let p = 0; p < occupants.length; p++) {
    const id = occupants[p];
    if (seen[id]) continue;
    seen[id] = true;
    fill.push(id);
  }
  const byId = {};
  for (let r = 0; r < ordered.length; r++) {
    byId[String(ordered[r].id)] = ordered[r];
  }
  const next = ordered.slice();
  for (let s = 0; s < slots.length; s++) {
    next[slots[s]] = byId[fill[s]];
  }
  const updates = [];
  const nextIds = [];
  for (let n = 0; n < next.length; n++) {
    nextIds.push(String(next[n].id));
    const want = n + 1;
    const from = Number(next[n].sort);
    if (!isFinite(from) || from !== want) {
      updates.push({
        id: String(next[n].id),
        from: isFinite(from) ? from : 0,
        to: want,
      });
    }
  }
  return { updates: updates, nextIds: nextIds };
}

function honmuSortKey(row, sortBySourceId) {
  const s = Number(sortBySourceId[String(row.source595Id || "")]);
  if (isFinite(s) && s > 0) return s;
  return 999999;
}

/**
 * 指定部署ブロック内だけ: 本務を 595.sort 順、兼務はその末尾。他部署は動かない。
 * @param {Array<{id: string, role: string, listSort: number, source595Id: string, dept: string}>} rows
 */
export function planDeptHonmuThenKenmu(rows, sortBySourceId, deptName) {
  const dept = String(deptName || "").trim();
  const ordered = Array.isArray(rows) ? rows.slice() : [];
  const indices = [];
  for (let i = 0; i < ordered.length; i++) {
    if (String(ordered[i].dept || "").trim() === dept) indices.push(i);
  }
  const next = ordered.slice();
  const runs = [];
  if (indices.length) {
    let run = [indices[0]];
    for (let k = 1; k < indices.length; k++) {
      if (indices[k] === indices[k - 1] + 1) run.push(indices[k]);
      else {
        runs.push(run);
        run = [indices[k]];
      }
    }
    runs.push(run);
  }
  for (let r = 0; r < runs.length; r++) {
    const idx = runs[r];
    const block = idx.map(function (i) {
      return next[i];
    });
    const honmu = [];
    const kenmu = [];
    for (let b = 0; b < block.length; b++) {
      if (isHonmuRole(block[b].role)) honmu.push(block[b]);
      else kenmu.push(block[b]);
    }
    honmu.sort(function (a, b) {
      const ra = honmuSortKey(a, sortBySourceId);
      const rb = honmuSortKey(b, sortBySourceId);
      if (ra !== rb) return ra - rb;
      const sa = Number(a.listSort);
      const sb = Number(b.listSort);
      if (sa !== sb) return (isFinite(sa) ? sa : 0) - (isFinite(sb) ? sb : 0);
      return String(a.id).localeCompare(String(b.id), "en");
    });
    const rebuilt = honmu.concat(kenmu);
    for (let j = 0; j < idx.length; j++) next[idx[j]] = rebuilt[j];
  }
  const nextIds = next.map(function (row) {
    return String(row.id);
  });
  const updates = [];
  for (let n = 0; n < next.length; n++) {
    const want = n + 1;
    const from = Number(next[n].listSort);
    if (!isFinite(from) || from !== want) {
      updates.push({
        id: String(next[n].id),
        from: isFinite(from) ? from : 0,
        to: want,
      });
    }
  }
  return {
    nextIds: nextIds,
    updates: updates,
    honmuCount: ordered.filter(function (row) {
      return isHonmuRole(row.role) && String(row.dept || "").trim() === dept;
    }).length,
    kenmuCount: ordered.filter(function (row) {
      return !isHonmuRole(row.role) && String(row.dept || "").trim() === dept;
    }).length,
  };
}

export const AGG_HUB_ORDER = [
  "honsya",
  "tohoku",
  "kan-etsu",
  "tokyo",
  "tokai",
  "reform-head",
  "reform-shutoken",
  "reform-sapporo",
  "tekko",
  "wangan",
  "bnp",
];

export function aggHubKey(groupCode, deptName) {
  if (String(groupCode || "").trim() !== "reform") {
    return String(groupCode || "").trim() || "(未設定)";
  }
  const d = String(deptName || "");
  if (d.indexOf("札幌") === 0) return "reform-sapporo";
  if (d.indexOf("首都圏") === 0) return "reform-shutoken";
  return "reform-head";
}

/**
 * 集計表の拠点順（統括→首都圏→札幌）で部署ブロックを並べる。
 * 同一拠点内は現行 list_sort を維持。emp_id は扱わない。
 */
export function planRowsByAggHub(rows) {
  const ordered = Array.isArray(rows) ? rows.slice() : [];
  ordered.sort(function (a, b) {
    const ha = AGG_HUB_ORDER.indexOf(aggHubKey(a.group, a.dept));
    const hb = AGG_HUB_ORDER.indexOf(aggHubKey(b.group, b.dept));
    const ra = ha < 0 ? 5000 : ha;
    const rb = hb < 0 ? 5000 : hb;
    if (ra !== rb) return ra - rb;
    const sa = Number(a.listSort);
    const sb = Number(b.listSort);
    if (sa !== sb) {
      return (isFinite(sa) ? sa : 999999) - (isFinite(sb) ? sb : 999999);
    }
    return String(a.id).localeCompare(String(b.id), "en");
  });
  const seen = {};
  const keys = [];
  for (let i = 0; i < ordered.length; i++) {
    const key = aggHubKey(ordered[i].group, ordered[i].dept) + "\t" + String(ordered[i].dept || "");
    if (seen[key]) continue;
    seen[key] = true;
    keys.push(key);
  }
  const rebuilt = [];
  for (let k = 0; k < keys.length; k++) {
    const key = keys[k];
    const block = ordered.filter(function (row) {
      return aggHubKey(row.group, row.dept) + "\t" + String(row.dept || "") === key;
    });
    const honmu = [];
    const kenmu = [];
    for (let b = 0; b < block.length; b++) {
      if (isHonmuRole(block[b].role)) honmu.push(block[b]);
      else kenmu.push(block[b]);
    }
    rebuilt.push.apply(rebuilt, honmu.concat(kenmu));
  }
  const nextIds = rebuilt.map(function (row) {
    return String(row.id);
  });
  const updates = [];
  for (let n = 0; n < rebuilt.length; n++) {
    const want = n + 1;
    const from = Number(rebuilt[n].listSort);
    if (!isFinite(from) || from !== want) {
      updates.push({
        id: String(rebuilt[n].id),
        from: isFinite(from) ? from : 0,
        to: want,
      });
    }
  }
  return { nextIds: nextIds, updates: updates };
}
