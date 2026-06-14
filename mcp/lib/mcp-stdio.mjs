/**
 * Minimal MCP stdio server (JSON-RPC 2.0) — no external SDK.
 */
import readline from 'node:readline';

export function createMcpServer({ name, version, tools, handlers }) {
  const toolMap = Object.fromEntries(tools.map((t) => [t.name, t]));
  let initialized = false;

  function send(msg) {
    process.stdout.write(`${JSON.stringify(msg)}\n`);
  }

  async function handleRequest(req) {
    const { id, method, params } = req;
    try {
      if (method === 'initialize') {
        initialized = true;
        send({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: params?.protocolVersion || '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name, version },
          },
        });
        return;
      }
      if (method === 'notifications/initialized') return;
      if (method === 'tools/list') {
        send({ jsonrpc: '2.0', id, result: { tools } });
        return;
      }
      if (method === 'tools/call') {
        const toolName = params?.name;
        const handler = handlers[toolName];
        if (!handler) throw new Error(`Unknown tool: ${toolName}`);
        const result = await handler(params?.arguments || {});
        send({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }],
          },
        });
        return;
      }
      if (id != null) {
        send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
      }
    } catch (e) {
      if (id != null) {
        send({ jsonrpc: '2.0', id, error: { code: -32000, message: e.message || String(e) } });
      }
    }
  }

  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on('line', (line) => {
    const t = String(line || '').trim();
    if (!t) return;
    let msg;
    try {
      msg = JSON.parse(t);
    } catch {
      return;
    }
    if (Array.isArray(msg)) {
      msg.forEach((m) => handleRequest(m));
    } else {
      handleRequest(msg);
    }
  });
}
