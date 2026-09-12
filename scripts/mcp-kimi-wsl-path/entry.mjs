#!/usr/bin/env node
/**
 * Lab wrapper for existing MCP server `kimi` (not a new MCP).
 * Fork of kimi-api-mcp@1.0.2:
 *   - Windows C:\\... → /mnt/<drive>/... when running in WSL
 *   - MOONSHOT_MODEL default kimi-k2.6 (upstream moonshot-v1-128k 404)
 */
import "./server.mjs";
