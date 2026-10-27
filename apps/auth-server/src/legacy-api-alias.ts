import type { Hono } from "hono";

/** Preserve storefront /v1 URLs when Dokploy routes directly to this server. */
export function registerLegacyApiAlias(app: Hono) {
  app.use("/v1/*", async (c) => {
    const url = new URL(c.req.url);
    url.pathname = url.pathname.replace(/^\/v1(?=\/)/, "/api");
    return app.fetch(new Request(url, c.req.raw));
  });
}
