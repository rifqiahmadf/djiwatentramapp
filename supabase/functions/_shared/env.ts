/** Server-only configuration for Edge functions. */
export function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing Edge environment variable: ${name}`);
  return value;
}
