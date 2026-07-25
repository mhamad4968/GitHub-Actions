/**
 * DeepSeek v4 reply helpers — thinking 既定で max_tokens が reasoning に吸われ
 * content="" →「无响应」になる事故の再発防止（2026-07-25 #S-DS-EMPTY-01）
 */

/** @typedef {{ type: 'enabled' | 'disabled' }} ThinkingToggle */

/**
 * @param {unknown} raw
 * @param {string} fallback
 * @returns {ThinkingToggle}
 */
export function resolveThinking(raw, fallback = "disabled") {
  const v = String(raw ?? fallback).trim().toLowerCase();
  if (v === "enabled" || v === "on" || v === "1" || v === "true") {
    return { type: "enabled" };
  }
  return { type: "disabled" };
}

/**
 * @param {{ thinkingEnabled: boolean, maxTokens?: number }} opts
 */
export function resolveMaxTokens({ thinkingEnabled, maxTokens }) {
  if (typeof maxTokens === "number" && Number.isFinite(maxTokens) && maxTokens > 0) {
    return Math.floor(maxTokens);
  }
  // thinking ON で 400 前後だと reasoning だけで finish=length・content="" になる（実測）
  return thinkingEnabled ? 2048 : 1024;
}

/**
 * @param {unknown} message
 * @param {{ finish_reason?: string, usage?: Record<string, unknown> }} meta
 * @returns {{ ok: boolean, text: string, mode: 'content' | 'reasoning_fallback' | 'empty' }}
 */
export function extractAssistantText(message, meta = {}) {
  const msg = message && typeof message === "object" ? message : {};
  const content = typeof msg.content === "string" ? msg.content.trim() : "";
  if (content) {
    return { ok: true, text: content, mode: "content" };
  }
  const reasoning =
    typeof msg.reasoning_content === "string" ? msg.reasoning_content.trim() : "";
  const finish = meta.finish_reason || "?";
  const usage = meta.usage || {};
  const reasoningTokens =
    usage?.completion_tokens_details?.reasoning_tokens ??
    usage?.reasoning_tokens ??
    "?";
  if (reasoning) {
    return {
      ok: false,
      mode: "reasoning_fallback",
      text:
        `错误: content が空（finish=${finish}, reasoning_tokens=${reasoningTokens}）。` +
        `thinking 既定ON + max_tokens 不足の典型。DEEPSEEK_THINKING_DEFAULT=disabled か maxTokens を増やしてください。\n` +
        `--- reasoning_content (fallback) ---\n${reasoning}`,
    };
  }
  return {
    ok: false,
    mode: "empty",
    text:
      `错误: empty assistant content（finish=${finish}, usage=${JSON.stringify(usage)}）。` +
      `model/thinking/max_tokens を確認してください。`,
  };
}

/**
 * Build chat/completions body for lab wrapper.
 * @param {{ model: string, message: string, temperature?: number, maxTokens?: number, thinking?: ThinkingToggle }} p
 */
export function buildChatBody(p) {
  const thinking = p.thinking || { type: "disabled" };
  const thinkingEnabled = thinking.type === "enabled";
  const body = {
    model: p.model,
    messages: [{ role: "user", content: p.message }],
    max_tokens: resolveMaxTokens({ thinkingEnabled, maxTokens: p.maxTokens }),
    thinking,
  };
  // thinking mode ignores temperature; only send when disabled (docs: no error but no effect if set)
  if (!thinkingEnabled && typeof p.temperature === "number") {
    body.temperature = p.temperature;
  }
  return body;
}
