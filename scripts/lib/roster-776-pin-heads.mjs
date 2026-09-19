/**
 * 776 所属長ピン（customize/776/desktop.js と同ロジック）。
 * 部署先頭: 支店長→副支店長→所長→（部名空の部長）。
 * 部長は部ブロック先頭、室長は室ブロック先頭。社長・常務はピンしない。
 */

export function deptHeadRank776(title) {
  const t = String(title || "").trim();
  if (!t) return 99;
  if (t.indexOf("副支店長") >= 0) return 2;
  if (t.indexOf("支店長") >= 0) return 1;
  if (t.indexOf("副所長") >= 0) return 99;
  if (t.indexOf("所長") >= 0) return 3;
  if (t.indexOf("副部長") >= 0) return 99;
  if (t.indexOf("部長") >= 0) return 4;
  return 99;
}

export function isShitsuSection776(section) {
  return /室/.test(String(section || ""));
}

export function isShitsuchoTitle776(title) {
  const t = String(title || "").trim();
  return t.indexOf("室長") >= 0 && t.indexOf("副室長") < 0;
}

export function isBuchoTitle776(title) {
  const t = String(title || "").trim();
  if (t.indexOf("副部長") >= 0) return false;
  return t.indexOf("部長") >= 0;
}

export function pinSectionGroups776(rest) {
  const keys = [];
  const groups = {};
  for (let i = 0; i < rest.length; i++) {
    const sec = String(rest[i].section || "");
    if (!Object.prototype.hasOwnProperty.call(groups, sec)) {
      groups[sec] = [];
      keys.push(sec);
    }
    groups[sec].push(rest[i]);
  }
  const out = [];
  for (let k = 0; k < keys.length; k++) {
    const sec = keys[k];
    const block = groups[sec];
    const bucho = [];
    const shitsu = [];
    const others = [];
    for (let j = 0; j < block.length; j++) {
      const p = block[j];
      if (isBuchoTitle776(p.title)) bucho.push(p);
      else if (isShitsuSection776(sec) && isShitsuchoTitle776(p.title)) shitsu.push(p);
      else others.push(p);
    }
    if (isShitsuSection776(sec)) out.push(...shitsu, ...bucho, ...others);
    else out.push(...bucho, ...shitsu, ...others);
  }
  return out;
}

export function pinDeptPeople776(people) {
  const tagged = [];
  for (let i = 0; i < people.length; i++) {
    tagged.push({
      id: people[i].id,
      dept: people[i].dept,
      section: people[i].section,
      title: people[i].title,
      name: people[i].name,
      _i: i,
    });
  }
  const heads = [];
  const emptyBucho = [];
  const rest = [];
  for (let p = 0; p < tagged.length; p++) {
    const rank = deptHeadRank776(tagged[p].title);
    const sec = String(tagged[p].section || "").trim();
    if (rank >= 1 && rank <= 3) heads.push(tagged[p]);
    else if (isBuchoTitle776(tagged[p].title) && !sec) emptyBucho.push(tagged[p]);
    else rest.push(tagged[p]);
  }
  heads.sort(function (a, b) {
    const ra = deptHeadRank776(a.title);
    const rb = deptHeadRank776(b.title);
    if (ra !== rb) return ra - rb;
    return a._i - b._i;
  });
  return heads.concat(emptyBucho, pinSectionGroups776(rest));
}

export function pinDeptSlots776(ids, byId, dept) {
  if (!dept) return;
  const slots = [];
  const people = [];
  for (let i = 0; i < ids.length; i++) {
    const row = byId[ids[i]];
    if (row && row.dept === dept) {
      slots.push(i);
      people.push(row);
    }
  }
  if (people.length < 2) return;
  const pinned = pinDeptPeople776(people);
  for (let k = 0; k < slots.length; k++) ids[slots[k]] = pinned[k].id;
}

export function planPinAllDeptHeads776(rows) {
  const ordered = Array.isArray(rows) ? rows.slice() : [];
  const ids = ordered.map(function (r) {
    return String(r.id);
  });
  const byId = {};
  for (let i = 0; i < ordered.length; i++) {
    byId[String(ordered[i].id)] = ordered[i];
  }
  const depts = {};
  for (let d = 0; d < ordered.length; d++) {
    const dept = ordered[d].dept;
    if (dept) depts[dept] = true;
  }
  const nextIds = ids.slice();
  Object.keys(depts).forEach(function (dept) {
    pinDeptSlots776(nextIds, byId, dept);
  });
  const updates = [];
  const movedByDept = {};
  for (let n = 0; n < nextIds.length; n++) {
    const id = nextIds[n];
    const row = byId[id];
    const want = n + 1;
    const from = Number(row && row.listSort);
    if (!isFinite(from) || from !== want) {
      updates.push({
        id: id,
        from: isFinite(from) ? from : 0,
        to: want,
        name: row && row.name,
        dept: row && row.dept,
        title: row && row.title,
        section: row && row.section,
      });
      const dept = (row && row.dept) || "(空)";
      if (!movedByDept[dept]) movedByDept[dept] = [];
      movedByDept[dept].push({
        name: row && row.name,
        title: row && row.title,
        from: isFinite(from) ? from : 0,
        to: want,
      });
    }
  }
  return { nextIds: nextIds, updates: updates, movedByDept: movedByDept };
}
