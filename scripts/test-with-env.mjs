#!/usr/bin/env node
// Deterministic configuration for mocked/unit tests, never for deployment.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve, relative } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const env = { ...process.env };
for (const file of [".env.example", "apps/auth-server/.env.example"]) {
  for (const line of readFileSync(resolve(root, file), "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z_][A-Z_0-9]*)=(.*)$/);
    if (match && match[2]) env[match[1]] = match[2];
  }
}
env.DB_PASSWORD = "unit-test-only";
env.BETTER_AUTH_SECRET = "unit-test-only-secret-at-least-thirty-two-characters";
const packages = process.argv.slice(2);
if (!packages.length) packages.push("packages/env", "packages/djiwapay-core", "apps/customer", "apps/auth-server");
let failed = false;
for (const pkg of packages) {
  const cwd = resolve(root, pkg);
  if (relative(root, cwd).startsWith("..")) throw new Error("Test package must be inside the checkout");
  const result = spawnSync("bun", ["test"], { cwd, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
