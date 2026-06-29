/**
 * Minimal MCP stdio client for tool calls (heygen-mcp / ffmpeg-mcp).
 */
import { spawn } from 'node:child_process';
import readline from 'node:readline';

/**
 * @param {string} entryScript path to MCP server entry
 * @param {string} toolName
 * @param {Record<string, unknown>} args
 * @param {{ timeoutMs?: number }} opts
 */
export async function callMcpTool(entryScript, toolName, args = {}, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 600_000;
  return new Promise((resolve, reject) => {
    const child = spawn('node', [entryScript], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    });
    let nextId = 1;
    const pending = new Map();
    let buffer = '';

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`MCP timeout ${timeoutMs}ms tool=${toolName}`));
    }, timeoutMs);

    child.stderr.on('data', (d) => process.stderr.write(d));

    const rl = readline.createInterface({ input: child.stdout });
    rl.on('line', (line) => {
      buffer = line;
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        return;
      }
      if (msg.id != null && pending.has(msg.id)) {
        const { resolve: res, reject: rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message || JSON.stringify(msg.error)));
        else res(msg.result);
      }
    });

    function send(req) {
      return new Promise((res, rej) => {
        pending.set(req.id, { resolve: res, reject: rej });
        child.stdin.write(`${JSON.stringify(req)}\n`);
      });
    }

    (async () => {
      await send({
        jsonrpc: '2.0',
        id: nextId++,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'mcp-stdio-client', version: '1' },
        },
      });
      child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} })}\n`);
      const result = await send({
        jsonrpc: '2.0',
        id: nextId++,
        method: 'tools/call',
        params: { name: toolName, arguments: args },
      });
      clearTimeout(timer);
      child.kill();
      const text = result?.content?.find((c) => c.type === 'text')?.text ?? JSON.stringify(result);
      try {
        resolve(JSON.parse(text));
      } catch {
        resolve(text);
      }
    })().catch((e) => {
      clearTimeout(timer);
      child.kill();
      reject(e);
    });
  });
}
