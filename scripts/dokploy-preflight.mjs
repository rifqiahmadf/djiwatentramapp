#!/usr/bin/env node
// Read-only inspection through the official Dokploy MCP server. Never print env values.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const root = resolve(process.env.DOKPLOY_MCP_ROOT || "/workspace/.tools/dokploy-mcp/node_modules");
if (!process.env.DOKPLOY_API_KEY) throw new Error("DOKPLOY_API_KEY is missing; bind it securely in Environment Settings");
if (!process.env.DOKPLOY_URL) throw new Error("DOKPLOY_URL is missing");
const { Client } = await import(pathToFileURL(resolve(root, "@modelcontextprotocol/sdk/dist/esm/client/index.js")));
const { StdioClientTransport } = await import(pathToFileURL(resolve(root, "@modelcontextprotocol/sdk/dist/esm/client/stdio.js")));
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [resolve(root, "@dokploy/mcp/build/index.js")],
  env: { ...process.env, DOKPLOY_REDACT_ENV: "true", DOKPLOY_ENABLED_TAGS: "project,environment,application,compose,domain,github" },
  stderr: "pipe",
});
// Server logs may contain provider error context; do not forward them to the terminal.
const client = new Client({ name: "djiwa-deployment-preflight", version: "1.0.0" });
try {
  await client.connect(transport);
  const result = await client.callTool({ name: "project-all", arguments: {} });
  if (result.isError) throw new Error("Dokploy rejected the read-only project request; verify access in environment settings");
  const projects = [];
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (typeof value.projectId === "string" && typeof value.name === "string") projects.push({ projectId: value.projectId, name: value.name });
    for (const [key, child] of Object.entries(value)) {
      if (/env|secret|token|password|key/i.test(key)) continue;
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child === "object") visit(child);
    }
  };
  for (const block of result.content || []) {
    if (block.type === "text") {
      try { visit(JSON.parse(block.text)); } catch { /* Never print unknown provider payloads. */ }
    }
  }
  console.log(JSON.stringify({ connected: true, projects }, null, 2));
} finally {
  await client.close();
}
