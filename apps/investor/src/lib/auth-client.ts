import { publicUrl } from "../../../../packages/env/src/endpoints";
import { createAuthClient } from "better-auth/react";

const authOrigin = import.meta.env.VITE_INVESTOR_AUTH_URL?.trim() || publicUrl("VITE_API_ORIGIN", "/v1/auth");

export const investorAuth = createAuthClient({
  baseURL: authOrigin,
  fetchOptions: { credentials: "include" },
});
