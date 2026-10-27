#!/usr/bin/env node
// Substitute only ${UPPER_CASE} placeholders, preserving native nginx $variables.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const [source, output] = process.argv.slice(2);
if (!source?.endsWith(".template") || !output || resolve(source) === resolve(output)) {
  throw new Error("Usage: node scripts/render-deployment-template.mjs source.template output");
}
const text = readFileSync(source, "utf8").replace(/\$\{([A-Z][A-Z0-9_]*)\}/g, (_, name) => {
  const value = process.env[name]?.trim();
  if (!value || /[\r\n;{}]/.test(value)) throw new Error(`Missing or invalid template variable: ${name}`);
  return value;
});
writeFileSync(output, text, { mode: 0o600 });
