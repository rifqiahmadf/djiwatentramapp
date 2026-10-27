/** Server-only configuration. Never import this module into a browser app. */
export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}
export function serverUrl(name: string, suffix = ""): string {
  const value = requiredEnv(name);
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error(`Invalid server URL: ${name}`);
  }
  return `${value.replace(/\/+$/, "")}${suffix}`;
}
export function envOrigins(name: string): string[] {
  return (process.env[name] ?? "").split(",").map((v) => v.trim()).filter(Boolean).map((v) => {
    const url = new URL(v);
    if (!["http:", "https:"].includes(url.protocol) || url.origin !== v) throw new Error(`Invalid origin in ${name}`);
    return url.origin;
  });
}
