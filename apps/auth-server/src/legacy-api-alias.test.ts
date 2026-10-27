import { expect, test } from "bun:test";
import { Hono } from "hono";
import { registerLegacyApiAlias } from "./legacy-api-alias";

test("legacy API alias preserves POST body, query, cookies, and response", async () => {
  const app = new Hono();
  registerLegacyApiAlias(app);
  app.post("/api/customer/echo", async (c) => c.json({
    body: await c.req.json(), query: c.req.query("view"), cookie: c.req.header("Cookie"),
  }, 201));
  const response = await app.request("http://api.example/v1/customer/echo?view=summary", {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: "session=test-only" },
    body: JSON.stringify({ action: "read" }),
  });
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ body: { action: "read" }, query: "summary", cookie: "session=test-only" });
});

test("legacy alias leaves the canonical API route available", async () => {
  const app = new Hono();
  registerLegacyApiAlias(app);
  app.get("/api/health", (c) => c.text("ok"));
  expect(await (await app.request("http://api.example/api/health")).text()).toBe("ok");
  expect(await (await app.request("http://api.example/v1/health")).text()).toBe("ok");
});
