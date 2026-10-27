import { test, expect } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const guard = fileURLToPath(new URL("./check-build-env.mjs", import.meta.url));
test("bundle validation permits a retained error branch but rejects missing public configuration", () => {
  const dir = mkdtempSync(join(tmpdir(), "build-env-guard-"));
  try {
    mkdirSync(join(dir, "src"));
    mkdirSync(join(dir, "dist/assets"), { recursive: true });
    writeFileSync(join(dir, "src/client.ts"), "const url = import.meta.env.VITE_SUPABASE_URL;");
    writeFileSync(join(dir, "dist/index.html"), "<div id='root'></div>");
    const url = "https://supabase.example";
    const key = "publishable-unit-test-value";
    const retainedGuard = 'if (!config.key) throw new Error("Supabase client key is not configured.");';
    const env = { ...process.env, SKIP_BUILD_ENV_CHECK: "0", VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: key };
    const run = () => spawnSync(process.execPath, [guard, "--dist", "dist"], { cwd: dir, env });
    writeFileSync(join(dir, "dist/assets/main.js"), `const config = ${JSON.stringify({ url, key })};${retainedGuard}`);
    expect(run().status).toBe(0);
    writeFileSync(join(dir, "dist/assets/main.js"), `const config = ${JSON.stringify({ url })};${retainedGuard}`);
    expect(run().status).toBe(1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
