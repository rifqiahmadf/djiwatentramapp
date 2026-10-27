#!/usr/bin/env node
/** Audit deployment endpoints in first-party executable source, without printing values. */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import ts from "typescript";
const files = [...new Set(execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean))];
const deployment = /https?:\/\/(?:[^\s/"'`<>]*\.)?(?:yumme\.id|djiwatentram\.web\.id|byrifqi\.com|supabase\.co|convex\.cloud|workers\.dev)(?=[/:\s"'`<>]|$)|https?:\/\/(?:\d{1,3}\.){3}\d{1,3}:\d+/;
const findings = [];
const counts = { discovered: files.length, source: 0, excluded: 0, missing: 0 };
for (const file of files) {
  if (!existsSync(file)) { counts.missing++; continue; }
  // Vendored dependencies, generated output, fixtures, archived data, and declarations
  // are not active application configuration. See docs/environment-configuration.md.
  if (file === "scripts/audit-env-config.mjs" || /(^|\/)(?:node_modules|\.venv|venv|dist|build|skills|\.claude|scratch|test-results)(\/|$)/.test(file)
      || /(?:\.test\.|\.spec\.|routeTree\.gen\.|\.d\.ts$|\.backup$)/.test(file)
      || !/\.(?:ts|tsx|js|jsx|mjs|py|sh|html)$/.test(file)) { counts.excluded++; continue; }
  counts.source++;
  const source = readFileSync(file, "utf8");
  const record = (text, line) => {
    const credentialLike = /\b(?:sk-[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}|[0-9]{8,}:[A-Za-z0-9_-]{30,})\b/.test(text);
    if (!deployment.test(text) && !credentialLike) return;
    // These are source identifiers for already-stored historical URLs, not live destinations.
    if (/apps\/(customer|pos)\/src\/lib\/asset-url\.ts$/.test(file)
        && ["https://xaemykhjpkgypqqpfdcb.supabase.co", "https://supabase.yumme.id"].includes(text)) return;
    findings.push({ file, line, reason: credentialLike ? "credential-like literal (value omitted)" : "deployment endpoint literal (value omitted)" });
  };
  if (/\.(?:ts|tsx|js|jsx|mjs)$/.test(file)) {
    const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const visit = (node) => {
      if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
        record(node.text, sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1);
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  } else {
    source.split(/\r?\n/).forEach((line, index) => {
      if (/^\s*(?:#|\/\/|\*|<!--)/.test(line)) return;
      record(line, index + 1);
    });
  }
}
console.log(JSON.stringify({ counts, findings }, null, 2));
process.exitCode = findings.length ? 1 : 0;
