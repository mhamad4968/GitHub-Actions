import assert from "node:assert/strict";
import {
  buildChatBody,
  extractAssistantText,
  resolveMaxTokens,
  resolveThinking,
} from "./lib-reply.mjs";

assert.equal(resolveThinking(undefined, "disabled").type, "disabled");
assert.equal(resolveThinking("enabled").type, "enabled");
assert.equal(resolveMaxTokens({ thinkingEnabled: true }), 2048);
assert.equal(resolveMaxTokens({ thinkingEnabled: false }), 1024);
assert.equal(resolveMaxTokens({ thinkingEnabled: true, maxTokens: 400 }), 400);

const emptyContent = extractAssistantText(
  { role: "assistant", content: "", reasoning_content: "thinking…" },
  { finish_reason: "length", usage: { completion_tokens_details: { reasoning_tokens: 400 } } },
);
assert.equal(emptyContent.ok, false);
assert.equal(emptyContent.mode, "reasoning_fallback");
assert.match(emptyContent.text, /content が空/);
assert.doesNotMatch(emptyContent.text, /^无响应$/);

const ok = extractAssistantText({ content: "  PONG-OK  " }, { finish_reason: "stop" });
assert.equal(ok.ok, true);
assert.equal(ok.text, "PONG-OK");

const bodyOff = buildChatBody({
  model: "deepseek-v4-flash",
  message: "hi",
  maxTokens: 400,
  thinking: { type: "disabled" },
  temperature: 0.3,
});
assert.equal(bodyOff.thinking.type, "disabled");
assert.equal(bodyOff.max_tokens, 400);
assert.equal(bodyOff.temperature, 0.3);

const bodyOn = buildChatBody({
  model: "deepseek-v4-flash",
  message: "hi",
  thinking: { type: "enabled" },
});
assert.equal(bodyOn.max_tokens, 2048);
assert.equal(bodyOn.thinking.type, "enabled");
assert.equal("temperature" in bodyOn, false);

console.log("[lib-reply.test] OK");
