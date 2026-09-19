/**
 * 方針B: 今だけ1回、776 全部署に所属長ピン。UIなし。emp_id 不触。
 * 本務順は 595.sort へ追従（正社員/準社員枠）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/roster-776-pin-dept-heads-once.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/roster-776-pin-dept-heads-once.mjs --apply
 */
import { fetchJson, getKintoneConfig } from "./lib/software-ledger-kintone.mjs";
import { plan595SortFollowHonmu } from "./lib/roster-776-honmu-sort.mjs";
import { planPinAllDeptHeads776 } from "./lib/roster-776-pin-heads.mjs";

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

async function putField(baseUrl, headers, app, field, updates) {
  for (let i = 0; i < updates.length; i += 100) {
    const batch = updates.slice(i, i + 100).map((u) => ({
      id: u.id,
      record: { [field]: { value: String(u.to) } },
    }));
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ app, records: batch }),
    });
  }
}

async function main() {
  const apply = process.argv.includes("--apply");
  const { baseUrl, headers } = getKintoneConfig();
  const recs776 = await fetchAll(
    baseUrl,
    headers,
    APP_776,
    "order by list_sort asc, レコード番号 asc",
    [
      "$id",
      "row_role",
      "list_sort",
      "source_595_id",
      "user_name",
      "dept_name",
      "section_name",
      "job_title",
    ]
  );
  const rows = recs776.map((r) => ({
    id: cell(r, "$id"),
    role: cell(r, "row_role"),
    listSort: Number(cell(r, "list_sort")),
    source595Id: cell(r, "source_595_id"),
    name: cell(r, "user_name"),
    dept: cell(r, "dept_name"),
    section: cell(r, "section_name"),
    title: cell(r, "job_title"),
  }));
  const plan = planPinAllDeptHeads776(rows);
  const deptNames = Object.keys(plan.movedByDept).sort();
  console.log(
    JSON.stringify(
      {
        apply,
        rows: rows.length,
        updates776: plan.updates.length,
        deptsTouched: deptNames.length,
        headsSample: deptNames.slice(0, 20).map((d) => ({
          dept: d,
          moves: plan.movedByDept[d].length,
          first: plan.movedByDept[d].slice(0, 4),
        })),
      },
      null,
      2
    )
  );
  if (!apply) {
    console.log("[dry-run] 未PUT。本番は --apply");
    return;
  }
  if (plan.updates.length) {
    await putField(baseUrl, headers, APP_776, "list_sort", plan.updates);
  }

  const recs776b = await fetchAll(
    baseUrl,
    headers,
    APP_776,
    "order by list_sort asc, レコード番号 asc",
    ["$id", "row_role", "list_sort", "source_595_id"]
  );
  const recs595 = await fetchAll(
    baseUrl,
    headers,
    APP_595,
    'employment_status in ("在籍") order by sort asc, $id asc',
    ["$id", "sort", "employment_category"]
  );
  const honmuIds = [];
  for (const r of recs776b) {
    if (cell(r, "row_role") !== "本務") continue;
    const sid = cell(r, "source_595_id");
    if (sid) honmuIds.push(sid);
  }
  const active = recs595.map((r) => ({
    id: cell(r, "$id"),
    category: cell(r, "employment_category"),
    sort: Number(cell(r, "sort")),
  }));
  const plan595 = plan595SortFollowHonmu(active, honmuIds);
  console.log("[595 follow] updates=" + plan595.updates.length);
  if (plan595.updates.length) {
    await putField(baseUrl, headers, APP_595, "sort", plan595.updates);
  }
  console.log("[done] 776=" + plan.updates.length + " 595=" + plan595.updates.length);
}

main().catch((err) => {
  console.error("[roster-776-pin-dept-heads-once]", err && err.message ? err.message : err);
  process.exit(1);
});
