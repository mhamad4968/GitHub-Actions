import assert from "node:assert/strict";
import test from "node:test";

import { normalizeAsciiNumberDraft } from "./ascii-number-input.mjs";

test("fullwidth digits map to ascii", () => {
  assert.equal(normalizeAsciiNumberDraft("３"), "3");
  assert.equal(normalizeAsciiNumberDraft("１２３"), "123");
  assert.equal(normalizeAsciiNumberDraft("１2３"), "123");
  assert.equal(normalizeAsciiNumberDraft("０９"), "09");
});

test("letters and symbols are dropped", () => {
  assert.equal(normalizeAsciiNumberDraft("12a3b"), "123");
  assert.equal(normalizeAsciiNumberDraft("-1+2"), "12");
});

test("extra decimal separators collapse to one dot", () => {
  assert.equal(normalizeAsciiNumberDraft("1.2.3"), "1.23");
  assert.equal(normalizeAsciiNumberDraft("1．2。3"), "1.23");
});

test("commas and ideographic comma are stripped", () => {
  assert.equal(normalizeAsciiNumberDraft("1,234"), "1234");
  assert.equal(normalizeAsciiNumberDraft("1，234"), "1234");
  assert.equal(normalizeAsciiNumberDraft("1、234"), "1234");
});

test("empty stays empty", () => {
  assert.equal(normalizeAsciiNumberDraft(""), "");
  assert.equal(normalizeAsciiNumberDraft("   abc "), "");
});

test("decimal disabled drops dots", () => {
  assert.equal(normalizeAsciiNumberDraft("12.34", { allowDecimal: false }), "1234");
  assert.equal(normalizeAsciiNumberDraft("1．2", { allowDecimal: false }), "12");
});
