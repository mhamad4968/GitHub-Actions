#!/usr/bin/env node
/**
 * DeepSeek MCP wrapper — default model deepseek-v4-flash
 * (upstream mcp-deepseek@1.0.2 hardcodes deepseek-chat which API rejected 2026-07).
 *
 * Usage (mcp.json command):
 *   node scripts/mcp-deepseek-v4/entry.mjs
 * Requires DEEPSEEK_API_KEY in env (same as upstream).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const DEFAULT_MODEL = process.env.DEEPSEEK_DEFAULT_MODEL || "deepseek-v4-flash";
const API_BASE = process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com";

const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
  console.error("DEEPSEEK_API_KEY is required");
  process.exit(1);
}

async function chatCompletion({ model, messages, temperature, max_tokens }) {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages,
      temperature: temperature ?? 0.7,
      max_tokens,
    }),
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

const server = new McpServer({
  name: "deepseek-mcp-server",
  version: "1.0.0-v4-default",
});

server.registerTool(
  "chat",
  {
    title: "DeepSeek 聊天对话",
    description: "与DeepSeek模型进行对话（默认 deepseek-v4-flash）",
    inputSchema: {
      message: z.string().describe("用户消息"),
      model: z
        .string()
        .optional()
        .describe(`模型名称，默认为 ${DEFAULT_MODEL}`),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().positive().optional(),
    },
  },
  async ({ message, model, temperature, maxTokens }) => {
    try {
      const response = await chatCompletion({
        model: model || DEFAULT_MODEL,
        messages: [{ role: "user", content: message }],
        temperature,
        max_tokens: maxTokens,
      });
      const reply = response.choices?.[0]?.message?.content || "无响应";
      return {
        content: [{ type: "text", text: reply }],
      };
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
    },
  },
  async ({ message, model, temperature }) => {
    try {
      const response = await chatCompletion({
        model: model || DEFAULT_MODEL,
        messages: [{ role: "user", content: message }],
        temperature,
      });
      const reply = response.choices?.[0]?.message?.content || "无响应";
      return { content: [{ type: "text", text: reply }] };
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
