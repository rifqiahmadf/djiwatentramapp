import { afterEach, expect, test } from "bun:test";
import { resolveWalletRecipient } from "../src/lib/wallet-adapter";
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
test("recipient verification uses lookup action without transferring funds", async () => {
  let request: RequestInit | undefined;
  globalThis.fetch = Object.assign((async (_url, init) => {
    request = init;
    return Response.json({ success: true, recipient: { name: "Test Member", phone: "6281234567890" } });
  }), { preconnect() {} }) as typeof fetch;
  const result = await resolveWalletRecipient("6281234567890");
  expect(result.recipient?.name).toBe("Test Member");
  expect(JSON.parse(String(request?.body))).toEqual({ action: "resolve-recipient", phone: "6281234567890" });
  expect(request?.credentials).toBe("include");
});
test("an ambiguous recipient error is propagated to prevent confirming the wrong account", async () => {
  globalThis.fetch = Object.assign((async () => Response.json({ success: false, error: "RECIPIENT_AMBIGUOUS" }, { status: 409 })), { preconnect() {} }) as typeof fetch;
  await expect(resolveWalletRecipient("6281234567890")).rejects.toThrow("RECIPIENT_AMBIGUOUS");
});
