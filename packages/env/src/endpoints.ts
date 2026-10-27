/// <reference types="vite/client" />
/** Public deployment URLs. VITE_* values are embedded in browser bundles. */
export function publicUrl(name: `VITE_${string}`, suffix = ""): string {
  const value = (import.meta.env?.[name] as string | undefined)?.trim();
  if (!value) throw new Error(`Missing public environment variable: ${name}`);
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
    throw new Error(`Invalid public URL: ${name}`);
  }
  return `${value.replace(/\/+$/, "")}${suffix}`;
}

/** Explicit allowlists; an absent list grants no additional origins. */
export function publicOrigins(name: `VITE_${string}`): string[] {
  return ((import.meta.env?.[name] as string | undefined) ?? "")
    .split(",").map((value) => value.trim()).filter(Boolean)
    .map((value) => {
      const url = new URL(value);
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.origin !== value) {
        throw new Error(`Invalid origin in ${name}`);
      }
      return url.origin;
    });
}
