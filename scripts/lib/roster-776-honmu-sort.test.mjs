import assert from "node:assert/strict";
import test from "node:test";
import { planHonmuSlotAlign, plan595SortFollowHonmu, planDeptHonmuThenKenmu, planRowsByAggHub } from "./roster-776-honmu-sort.mjs";

test("本務だけ595順に入れ替え、兼務枠は同じ位置", () => {
  const rows = [
    { id: "a", role: "本務", listSort: 1, source595Id: "10" },
    { id: "b", role: "本務", listSort: 2, source595Id: "11" },
    { id: "k", role: "兼務", listSort: 3, source595Id: "10" },
    { id: "c", role: "本務", listSort: 4, source595Id: "12" },
  ];
  // 595 は c → a → b
  const plan = planHonmuSlotAlign(rows, { 12: 1, 10: 2, 11: 3 });
  assert.deepEqual(plan.nextIds, ["c", "a", "k", "b"]);
  assert.equal(plan.honmuCount, 3);
  const byId = Object.fromEntries(plan.updates.map((u) => [u.id, u.to]));
  assert.equal(byId.c, 1);
  assert.equal(byId.a, 2);
  assert.equal(byId.b, 4);
  assert.equal(byId.k, undefined);
});

test("595.sort の数値は list_sort にコピーしない（連番1..N）", () => {
  const rows = [
    { id: "x", role: "本務", listSort: 50, source595Id: "1" },
    { id: "y", role: "本務", listSort: 80, source595Id: "2" },
  ];
  const plan = planHonmuSlotAlign(rows, { 1: 200, 2: 100 });
  assert.deepEqual(plan.nextIds, ["y", "x"]);
  assert.equal(plan.updates.find((u) => u.id === "y").to, 1);
  assert.equal(plan.updates.find((u) => u.id === "x").to, 2);
  assert.ok(plan.updates.every((u) => u.to !== 200 && u.to !== 100));
});

test("595.sort が無い本務は本務の末尾スロットへ", () => {
  const rows = [
    { id: "a", role: "本務", listSort: 1, source595Id: "1" },
    { id: "orphan", role: "本務", listSort: 2, source595Id: "99" },
    { id: "b", role: "本務", listSort: 3, source595Id: "2" },
  ];
  const plan = planHonmuSlotAlign(rows, { 2: 1, 1: 2 });
  assert.deepEqual(plan.nextIds, ["b", "a", "orphan"]);
});

test("595.sort追従: 正社員枠だけ776本務順、その他の枠は維持", () => {
  const active = [
    { id: "a", category: "正社員", sort: 1 },
    { id: "x", category: "その他", sort: 2 },
    { id: "b", category: "正社員", sort: 3 },
  ];
  const plan = plan595SortFollowHonmu(active, ["b", "a"]);
  assert.deepEqual(plan.nextIds, ["b", "x", "a"]);
  const byId = Object.fromEntries(plan.updates.map((u) => [u.id, u.to]));
  assert.equal(byId.b, 1);
  assert.equal(byId.x, undefined);
  assert.equal(byId.a, 3);
});

test("部署ブロック: 本務は595順、兼務は末尾、他部署は動かない", () => {
  const rows = [
    { id: "x", role: "本務", listSort: 1, source595Id: "9", dept: "札幌支店" },
    { id: "a", role: "本務", listSort: 2, source595Id: "1", dept: "首都圏支店" },
    { id: "k", role: "兼務", listSort: 3, source595Id: "2", dept: "首都圏支店" },
    { id: "b", role: "本務", listSort: 4, source595Id: "2", dept: "首都圏支店" },
    { id: "y", role: "本務", listSort: 5, source595Id: "8", dept: "札幌支店" },
  ];
  const plan = planDeptHonmuThenKenmu(rows, { 2: 1, 1: 2 }, "首都圏支店");
  assert.deepEqual(plan.nextIds, ["x", "b", "a", "k", "y"]);
  assert.equal(plan.kenmuCount, 1);
});

test("集計拠点順: 首都圏ブロックが札幌の前、部署内は現行順", () => {
  const rows = [
    { id: "sp1", role: "本務", listSort: 1, dept: "札幌支店", group: "reform" },
    { id: "sp2", role: "本務", listSort: 2, dept: "札幌支店", group: "reform" },
    { id: "sk1", role: "本務", listSort: 3, dept: "首都圏支店", group: "reform" },
    { id: "skk", role: "兼務", listSort: 4, dept: "首都圏支店", group: "reform" },
    { id: "sk2", role: "本務", listSort: 5, dept: "首都圏支店", group: "reform" },
    { id: "tk", role: "本務", listSort: 0, dept: "静岡営業所", group: "tokai" },
  ];
  const plan = planRowsByAggHub(rows);
  assert.deepEqual(plan.nextIds, ["tk", "sk1", "sk2", "skk", "sp1", "sp2"]);
});
