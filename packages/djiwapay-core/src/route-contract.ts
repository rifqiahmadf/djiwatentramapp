import { publicUrl, publicOrigins } from "../../env/src/endpoints";
import type { DjiwaPayContext, ReturnTarget } from "./types";

export const PAY_ORIGIN = publicUrl("VITE_PAY_ORIGIN");
export const ALLOWED_RETURN_ORIGINS = new Set(publicOrigins("VITE_PAY_RETURN_ORIGINS"));

export function normalizeReturnTarget(value: string | undefined): ReturnTarget | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !ALLOWED_RETURN_ORIGINS.has(url.origin)) return null;
    return { origin: url.origin, path: `${url.pathname || "/"}${url.search}${url.hash}` };
  } catch { return null; }
}

export function buildDjiwaPayUrl(input: { context: DjiwaPayContext; route?: "wallet" | "topup"; returnTo?: string }): string {
  const route = input.route ?? "wallet";
  const url = new URL(`/${input.context}/${route}`, PAY_ORIGIN);
  const target = normalizeReturnTarget(input.returnTo);
  if (target) url.searchParams.set("returnTo", `${target.origin}${target.path}`);
  return url.toString();
}
