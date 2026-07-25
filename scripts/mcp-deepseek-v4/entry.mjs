#!/usr/bin/env node
/**
 * DeepSeek MCP wrapper — default model deepseek-v4-flash
 * (upstream mcp-deepseek@1.0.2 hardcodes deepseek-chat which API rejected 2026-07).
 *
 * #S-DS-EMPTY-01 (2026-07-25): v4 thinking 既定 ON のとき max_tokens が reasoning に吸われ
 * content="" → 旧実装が「无响应」を返していた。thinking 既定 OFF + 診断付き抽出に変更。
 *
 * Usage (mcp.json command):
 *   node scripts/mcp-deepseek-v4/entry.mjs
 * Requires DEEPSEEK_API_KEY in env (same as upstream).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  buildChatBody,
  extractAssistantText,
  resolveThinking,
} from "./lib-reply.mjs";

const DEFAULT_MODEL = process.env.DEEPSEEK_DEFAULT_MODEL || "deepseek-v4-flash";
const API_BASE = process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com";
const THINKING_DEFAULT = process.env.DEEPSEEK_THINKING_DEFAULT || "disabled";

const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
  console.error("DEEPSEEK_API_KEY is required");
  process.exit(1);
}

async function chatCompletion(body) {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      typeof json?.error?.message === "string"
        ? json.error.message
        : `HTTP ${res.status}`,
    );
  }
  return json;
}

async function runChat({ message, model, temperature, maxTokens, thinking }) {
  const thinkingToggle = resolveThinking(thinking, THINKING_DEFAULT);
  const body = buildChatBody({
    model: model || DEFAULT_MODEL,
    message,
    temperature,
    maxTokens,
    thinking: thinkingToggle,
  });
  const response = await chatCompletion(body);
  const choice = response.choices?.[0];
  const extracted = extractAssistantText(choice?.message, {
    finish_reason: choice?.finish_reason,
    usage: response.usage,
  });
  return {
    content: [{ type: "text", text: extracted.text }],
    isError: !extracted.ok,
  };
}

const server = new McpServer({
  name: "deepseek-mcp-server",
  version: "1.1.0-v4-thinking-default-off",
});

server.registerTool(
  "chat",
  {
    title: "DeepSeek 聊天对话",
    description:
      "与DeepSeek模型进行对话（默认 deepseek-v4-flash / thinking=disabled）。" +
      "thinking 既定ONだと max_tokens が reasoning に吸われ空応答になるため lab 既定は disabled。",
    inputSchema: {
      message: z.string().describe("用户消息"),
      model: z
        .string()
        .optional()
        .describe(`模型名称，默认为 ${DEFAULT_MODEL}`),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().positive().optional(),
      thinking: z
        .enum(["enabled", "disabled"])
        .optional()
        .describe(`thinking モード（既定 ${THINKING_DEFAULT}）`),
    },
  },
  async (args) => {
    try {
      return await runChat(args);
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `错误: ${error instanceof Error ? error.message : "未知错误"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.registerTool(
  "list_models",
  {
    title: "获取模型列表",
    description: "获取DeepSeek API支持的模型列表",
    inputSchema: {},
  },
  async () => {
    try {
      const res = await fetch(`${API_BASE}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || `HTTP ${res.status}`);
      const models = (json.data || [])
        .map((m) => `- ${m.id} (${m.owned_by || "?"})`)
        .join("\n");
      return { content: [{ type: "text", text: `可用模型:\n${models}` }] };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `错误: ${error instanceof Error ? error.message : "未知错误"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.registerTool(
  "get_balance",
  {
    title: "获取账户余额",
    description: "获取DeepSeek API账户余额信息（可能未対応）",
    inputSchema: {},
  },
  async () => {
    return {
      content: [
        {
          type: "text",
          text: "get_balance: 本ラッパは未実装。DeepSeek コンソールで確認してください。",
        },
      ],
    };
  },
);

server.registerTool(
  "stream_chat",
  {
    title: "流式聊天对话",
    description: "非流式フォールバック（同一 chat）",
    inputSchema: {
      message: z.string(),
      model: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().positive().optional(),
      thinking: z.enum(["enabled", "disabled"]).optional(),
    },
  },
  async (args) => {
    try {
      return await runChat(args);
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `错误: ${error instanceof Error ? error.message : "未知错误"}`,
          },
        ],
        isError: true,
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
