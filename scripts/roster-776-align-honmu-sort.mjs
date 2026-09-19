/**
 * 776 本務の並びを 595.sort（支店・営業所までの本務順）に合わせる。
 * 兼務行の枠は動かさない。部／室・emp_id は触らない。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/roster-776-align-honmu-sort.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/roster-776-align-honmu-sort.mjs --apply
 */
import { fetchJson, getKintoneConfig } from "./lib/software-ledger-kintone.mjs";
import { planHonmuSlotAlign, planDeptHonmuThenKenmu } from "./lib/roster-776-honmu-sort.mjs";

const APP_595 = 595;
const APP_776 = 776;

function cell(r, code) {
  const f = r[code];
  if (!f || f.value == null) return "";
  return String(f.value).trim();
}

async function fetchAll(baseUrl, headers, app, query, fields) {
  const out = [];
  let offset = 0;
  for (;;) {
    const p = new URLSearchParams();
    p.set("app", String(app));
    p.set("query", `${query} limit 500 offset ${offset}`);
    for (const f of fields) p.append("fields", f);
    const json = await fetchJson(`${baseUrl}/k/v1/records.json?${p.toString()}`, {
      method: "GET",
      headers: { ...headers, "Content-Type": undefined },
    });
    const batch = json.records || [];
    out.push(...batch);
    if (batch.length < 500) break;
    offset += batch.length;
  }
  return out;
}

async function putListSort(baseUrl, headers, updates) {
  for (let i = 0; i < updates.length; i += 100) {
    const batch = updates.slice(i, i + 100).map((u) => ({
      id: u.id,
      record: { list_sort: { value: String(u.to) } },
    }));
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ app: APP_776, records: batch }),
    });
  }
}

async function main() {
  const apply = process.argv.includes("--apply");
  const { baseUrl, headers } = getKintoneConfig();

  const recs595 = await fetchAll(
    baseUrl,
    headers,
    APP_595,
    'employment_status in ("在籍") and employment_category in ("正社員","準社員") order by sort asc, $id asc',
    ["$id", "sort", "user_name", "dept_name"]
  );
  const recs776 = await fetchAll(
    baseUrl,
    headers,
    APP_776,
    "order by list_sort asc, レコード番号 asc",
    ["$id", "row_role", "list_sort", "source_595_id", "user_name", "dept_name"]
  );

  const sortBySourceId = {};
  for (const r of recs595) {
    const sid = cell(r, "$id");
    const s = Number(cell(r, "sort"));
    if (sid && isFinite(s) && s > 0) sortBySourceId[sid] = s;
  }

  const rows = recs776.map((r) => ({
    id: cell(r, "$id"),
    role: cell(r, "row_role"),
    listSort: Number(cell(r, "list_sort")),
    source595Id: cell(r, "source_595_id"),
    name: cell(r, "user_name"),
    dept: cell(r, "dept_name"),
  }));

  const deptArg = process.argv.find((a) => a.startsWith("--dept="));
  const dept = deptArg ? deptArg.slice("--dept=".length).trim() : "";
  const plan = dept
    ? planDeptHonmuThenKenmu(rows, sortBySourceId, dept)
    : planHonmuSlotAlign(rows, sortBySourceId);
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));

  console.log(
    "[roster-776-align-honmu-sort] 595 honmu=" +
      recs595.length +
      " 776 rows=" +
      recs776.length +
      " dept=" +
      (dept || "(all honmu slots)") +
      " honmuSlots=" +
      plan.honmuCount +
      " updates=" +
      plan.updates.length +
      " apply=" +
      apply
  );

  const samples = plan.updates.slice(0, 12).map((u) => {
    const r = byId[u.id];
    return {
      id: u.id,
      name: r && r.name,
      dept: r && r.dept,
      role: r && r.role,
      from: u.from,
      to: u.to,
    };
  });
  console.log("[samples]", JSON.stringify(samples, null, 2));

  if (dept) {
    const byNew = Object.fromEntries(rows.map((r) => [r.id, r]));
    const deptOrder = plan.nextIds
      .map((id) => byNew[id])
      .filter((r) => r && r.dept === dept)
      .map((r) => (r.role === "本務" ? "本務" : "兼務") + ":" + r.name);
    console.log("[dept-order]", deptOrder.join(" | "));
  }

  if (!plan.updates.length) {
    console.log("[roster-776-align-honmu-sort] 変更なし");
    return;
  }
  if (!apply) {
    console.log("[roster-776-align-honmu-sort] dry-run のみ。本番は --apply");
    return;
  }
  await putListSort(baseUrl, headers, plan.updates);
  console.log("[roster-776-align-honmu-sort] PUT " + plan.updates.length + " 件完了");
}

main().catch((err) => {
  console.error("[roster-776-align-honmu-sort]", err && err.message ? err.message : err);
  process.exit(1);
});
