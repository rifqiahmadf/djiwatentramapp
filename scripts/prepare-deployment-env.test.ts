import { expect, test } from "bun:test";
import { deploymentEnv } from "./prepare-deployment-env.mjs";
const input = { DEPLOYMENT_DOMAIN: "staging.example", VITE_SUPABASE_URL: "https://database.example", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_only" };
test("deployment config routes all channels and return origins to the requested domain", () => {
  const env = deploymentEnv(input);
  expect(env.VITE_CUSTOMER_ORIGIN).toBe("https://app.staging.example");
  expect(env.VITE_API_ORIGIN).toBe("https://api.staging.example");
  expect(Object.entries(env).filter(([key]) => key.endsWith("_ORIGIN")).every(([, value]) => new URL(value).hostname.endsWith(".staging.example"))).toBe(true);
  expect(env.VITE_PAY_RETURN_ORIGINS.split(",")).toContain(env.VITE_CUSTOMER_ORIGIN);
});
test("deployment config rejects private keys and malformed domains before writing a browser env", () => {
  expect(() => deploymentEnv({ ...input, VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_test_only" })).toThrow();
  expect(() => deploymentEnv({ ...input, DEPLOYMENT_DOMAIN: "https://staging.example/path" })).toThrow();
  expect(() => deploymentEnv({ ...input, VITE_SUPABASE_URL: "https://user:password@database.example" })).toThrow();
});
