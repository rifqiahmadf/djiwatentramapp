import { expect, test } from "bun:test";
import { createVendorChunks } from "./vendor-chunks";
test("vendor splitting preserves static cycles and dependency ordering", () => {
  const nodes = new Map([
    ["/node_modules/a", { code: "a".repeat(30), importedIds: ["/node_modules/b"] }],
    ["/node_modules/b", { code: "b".repeat(30), importedIds: ["/node_modules/a"] }],
    ["/node_modules/c", { code: "c".repeat(30), importedIds: ["/node_modules/a"] }],
    ["/node_modules/d", { code: "d".repeat(30), importedIds: ["/node_modules/c"] }],
  ]);
  const graph = { getModuleIds: () => nodes.keys(), getModuleInfo: (id: string) => nodes.get(id) ?? null };
  const chunks = createVendorChunks(65);
  expect(chunks("/node_modules/a", graph)).toBe(chunks("/node_modules/b", graph));
  expect(chunks("/node_modules/c", graph)).not.toBe(chunks("/node_modules/a", graph));
  for (const [id, info] of nodes) for (const dep of info.importedIds) expect(chunks(dep, graph)! <= chunks(id, graph)!).toBe(true);
  expect(chunks("/app/src/index.ts", graph)).toBeUndefined();
});

test("vendor splitting includes virtual helpers to avoid a vendor-entry cycle", () => {
  const nodes = new Map([
    ["/app/main.ts", { code: "entry", importedIds: ["/node_modules/library"] }],
    ["/node_modules/library", { code: "library".repeat(20), importedIds: ["\0commonjsHelpers"] }],
    ["\0commonjsHelpers", { code: "helpers", importedIds: [] }],
  ]);
  const graph = { getModuleIds: () => nodes.keys(), getModuleInfo: (id: string) => nodes.get(id) ?? null };
  const chunks = createVendorChunks(100);
  expect(chunks("\0commonjsHelpers", graph)).toBeDefined();
  expect(chunks("\0commonjsHelpers", graph)! <= chunks("/node_modules/library", graph)!).toBe(true);
  expect(chunks("/app/main.ts", graph)).toBeUndefined();
});
