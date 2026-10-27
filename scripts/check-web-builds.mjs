#!/usr/bin/env node
// Compile web apps with explicit non-working CI fixtures; never publish these artifacts.
import { readdirSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { deploymentEnv } from "./prepare-deployment-env.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const selected = process.argv.slice(2);
const apps = readdirSync(resolve(root, "apps")).filter((name) => existsSync(resolve(root, "apps", name, "vite.config.ts")));
if (selected.some((name) => !apps.includes(name))) throw new Error("Unknown Vite app selection");
const fixture = deploymentEnv({ DEPLOYMENT_DOMAIN: "ci.invalid", VITE_SUPABASE_URL: "https://database.invalid", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_ci_compile_only" });
const env = { ...process.env, ...fixture, VITE_SUPABASE_ANON_KEY: "", VITE_ADMIN_SECRET: "" };
const run = (args, cwd) => {
  const result = spawnSync(process.execPath, args, { cwd, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error("Web build validation failed");
};
for (const app of selected.length ? selected : apps) {
  const cwd = resolve(root, "apps", app);
  const output = mkdtempSync(join(tmpdir(), `web-build-${app}-`));
  try {
    console.log(`Checking ${app} with CI fixture configuration`);
    run([resolve(root, "scripts/check-build-env.mjs")], cwd);
    run([resolve(cwd, "node_modules/vite/bin/vite.js"), "build", "--outDir", output, "--emptyOutDir"], cwd);
    run([resolve(root, "scripts/check-build-env.mjs"), "--dist", output], cwd);
  } finally { rmSync(output, { recursive: true, force: true }); }
}
