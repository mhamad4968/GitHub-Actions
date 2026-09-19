import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deptHeadRank776,
  pinDeptPeople776,
  planPinAllDeptHeads776,
} from "./roster-776-pin-heads.mjs";

test("rank: 副支店長 before 支店長, 社長 stays 99", () => {
  assert.equal(deptHeadRank776("副支店長"), 2);
  assert.equal(deptHeadRank776("支店長"), 1);
  assert.equal(deptHeadRank776("所長"), 3);
  assert.equal(deptHeadRank776("部長"), 4);
  assert.equal(deptHeadRank776("社長"), 99);
  assert.equal(deptHeadRank776("常務取締役"), 99);
  assert.equal(deptHeadRank776("副部長"), 99);
});

test("pinDeptPeople: 支店先頭は支店長・副・所長、空部長はその次、室長は室", () => {
  const people = [
    { id: "1", dept: "東北支店", section: "", title: "部員", name: "A" },
    { id: "2", dept: "東北支店", section: "", title: "部長", name: "B" },
    { id: "3", dept: "東北支店", section: "", title: "支店長", name: "C" },
    { id: "4", dept: "東北支店", section: "", title: "副支店長", name: "D" },
    { id: "5", dept: "東北支店", section: "", title: "副支店長", name: "E" },
    { id: "6", dept: "東北支店", section: "総務室", title: "室員", name: "F" },
    { id: "7", dept: "東北支店", section: "総務室", title: "室長", name: "G" },
    { id: "8", dept: "東北支店", section: "", title: "社長", name: "H" },
  ];
  const out = pinDeptPeople776(people).map((p) => p.id);
  assert.deepEqual(out, ["3", "4", "5", "2", "1", "8", "7", "6"]);
});

test("pinDeptPeople: 同じ部の部長と部員を再結合", () => {
  const people = [
    { id: "s", dept: "首都圏支店", section: "", title: "支店長", name: "支店長" },
    { id: "m1", dept: "首都圏支店", section: "第一工事部", title: "部員", name: "部員1" },
    { id: "b1", dept: "首都圏支店", section: "第一工事部", title: "部長", name: "部長1" },
    { id: "m2", dept: "首都圏支店", section: "第一工事部", title: "部員", name: "部員2" },
    { id: "b2", dept: "首都圏支店", section: "第二工事部", title: "部長", name: "部長2" },
    { id: "m3", dept: "首都圏支店", section: "第二工事部", title: "部員", name: "部員3" },
  ];
  const out = pinDeptPeople776(people).map((p) => p.id);
  assert.deepEqual(out, ["s", "b1", "m1", "m2", "b2", "m3"]);
});

test("planPinAllDeptHeads: 盛岡 slots stay 盛岡, 東北穴は東北スロットのまま", () => {
  const rows = [
    { id: "a", listSort: 1, dept: "盛岡営業所", section: "", title: "部員", name: "盛岡部員" },
    { id: "b", listSort: 2, dept: "東北支店", section: "", title: "部員", name: "東北穴" },
    { id: "c", listSort: 3, dept: "盛岡営業所", section: "", title: "所長", name: "盛岡所長" },
    { id: "d", listSort: 4, dept: "東北支店", section: "", title: "支店長", name: "東北支店長" },
    { id: "e", listSort: 5, dept: "東北支店", section: "", title: "部員", name: "東北部員" },
  ];
  const plan = planPinAllDeptHeads776(rows);
  assert.deepEqual(plan.nextIds, ["c", "d", "a", "b", "e"]);
});
