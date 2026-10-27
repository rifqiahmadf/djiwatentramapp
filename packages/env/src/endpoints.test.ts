import { afterEach, describe, expect, test } from "bun:test";
import { publicOrigins, publicUrl } from "./endpoints";

const key = "VITE_ENV_CONFIG_TEST";
const previous = process.env[key];
afterEach(() => {
  if (previous === undefined) delete process.env[key];
  else process.env[key] = previous;
});

describe("public endpoint configuration", () => {
  test("uses the configured deployment without a production fallback", () => {
    process.env[key] = " https://staging.example/ ";
    expect(publicUrl(key, "/v1/customer")).toBe("https://staging.example/v1/customer");
  });
  test("rejects a missing required URL", () => {
    delete process.env[key];
    expect(() => publicUrl(key)).toThrow(key);
  });
  test("rejects executable URLs and embedded credentials", () => {
    for (const value of ["javascript:alert(1)", "https://user:password@example.com"]) {
      process.env[key] = value;
      expect(() => publicUrl(key)).toThrow();
    }
  });
  test("an absent allowlist grants no origins", () => {
    delete process.env[key];
    expect(publicOrigins(key)).toEqual([]);
  });
  test("parses explicit origins without adding localhost implicitly", () => {
    process.env[key] = "https://shop.example, http://localhost:3010";
    expect(publicOrigins(key)).toEqual(["https://shop.example", "http://localhost:3010"]);
  });
  test("rejects a path, credentials, or non-HTTP origin in an allowlist", () => {
    for (const value of ["https://shop.example/path", "https://user:password@shop.example", "file:///"]) {
      process.env[key] = value;
      expect(() => publicOrigins(key)).toThrow();
    }
  });
});
