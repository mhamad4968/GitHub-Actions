/**
 * 595→698 同期プラン — 突合は 595.$id → 698.$id（初回 seed 整合）。
 * 所属変更で dept+name キーが変わっても同一 $id 行を PUT 更新する。
 * 過去の誤 POST による重複（同一氏名・別 $id）は削除対象。
 */

/** 674 / 595 同様の表記ゆれ吸収 */
export function normalizeEmployeeKey(name, dept) {
  const n = String(name || '')
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const d = String(dept || '')
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `${d}\u0001${n}`;
}

export function normalizeUserName(name) {
  return String(name || '')
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toEmployeeRecord(row595) {
  const rec = {
    user_name: { value: String(row595.user_name?.value || '').trim() },
    dept_name: { value: String(row595.dept_name?.value || '').trim() },
    group_name: { value: String(row595.group_name?.value || '').trim() },
  };
  const st = row595.employment_status?.value;
  if (st) rec.employment_status = { value: st };
  if (row595.$id?.value != null && row595.$id.value !== '') {
    rec.source595_id = { value: String(row595.$id.value) };
  }
  return rec;
}

function recordSame(existing, payload) {
  return (
    String(existing.user_name?.value || '').trim() === payload.user_name.value &&
    String(existing.dept_name?.value || '').trim() === payload.dept_name.value &&
    String(existing.group_name?.value || '').trim() === payload.group_name.value &&
    String(existing.employment_status?.value || '') === String(payload.employment_status?.value || '') &&
    String(existing.source595_id?.value || '') === String(payload.source595_id?.value || '')
  );
}

/**
 * @returns {{ toPost, toPut, toDelete, stats, drift }}
 */
export function planSync595To698(rows595, rows698) {
  const idToEmp698 = new Map();
  const nameTo595Id = new Map();
  const nameTo698Rows = new Map();
  const keys595 = new Set();
  const keys698 = new Set();

  for (const r595 of rows595) {
    const id595 = String(r595.$id?.value ?? '');
    const name = normalizeUserName(r595.user_name?.value);
    if (name) nameTo595Id.set(name, id595);
    keys595.add(normalizeEmployeeKey(r595.user_name?.value, r595.dept_name?.value));
  }

  for (const r698 of rows698) {
    const id698 = String(r698.$id?.value ?? '');
    idToEmp698.set(id698, r698);
    keys698.add(normalizeEmployeeKey(r698.user_name?.value, r698.dept_name?.value));
    const name = normalizeUserName(r698.user_name?.value);
    if (!nameTo698Rows.has(name)) nameTo698Rows.set(name, []);
    nameTo698Rows.get(name).push(r698);
  }

  const toPost = [];
  const toPut = [];
  const toDelete = [];
  const claimed698Ids = new Set();
  let skip = 0;

  for (const r595 of rows595) {
    const id595 = String(r595.$id?.value ?? '');
    const payload = toEmployeeRecord(r595);
    let existing = idToEmp698.get(id595);

    if (!existing) {
      const name = normalizeUserName(r595.user_name?.value);
      const candidates = (nameTo698Rows.get(name) || []).filter(
        (r) => !claimed698Ids.has(String(r.$id?.value ?? '')),
      );
      if (candidates.length === 1) {
        existing = candidates[0];
      } else if (candidates.length > 1) {
        existing =
          candidates.find((c) => recordSame(c, payload)) ||
          candidates.sort((a, b) => Number(a.$id?.value) - Number(b.$id?.value))[0];
      }
    }

    if (!existing) {
      toPost.push(payload);
      continue;
    }

    claimed698Ids.add(String(existing.$id?.value ?? ''));

    if (recordSame(existing, payload)) {
      skip += 1;
      continue;
    }

    toPut.push({
      id: existing.$id.value,
      revision: existing.$revision.value,
      record: payload,
    });
  }

  for (const r698 of rows698) {
    const id698 = String(r698.$id?.value ?? '');
    if (claimed698Ids.has(id698)) continue;
    const name = normalizeUserName(r698.user_name?.value);
    const canonical595Id = nameTo595Id.get(name);
    if (canonical595Id && canonical595Id !== id698) {
      toDelete.push({ id: r698.$id.value, revision: r698.$revision.value });
    }
  }

  let drift698Only = 0;
  let drift595Only = 0;
  keys698.forEach(function (k) {
    if (!keys595.has(k)) drift698Only += 1;
  });
  keys595.forEach(function (k) {
    if (!keys698.has(k)) drift595Only += 1;
  });

  const mirrorAfter =
    rows698.length + toPost.length - toDelete.length;

  const stats = {
    source595: rows595.length,
    existingEmp: rows698.length,
    toPost: toPost.length,
    toPut: toPut.length,
    toDelete: toDelete.length,
    skipUnchanged: skip,
    mirrorTotal: mirrorAfter,
  };

  const drift = {
    drift698Only,
    drift595Only,
    warn: drift698Only > 0 || drift595Only > 0 || toDelete.length > 0,
  };

  return { toPost, toPut, toDelete, stats, drift };
}
