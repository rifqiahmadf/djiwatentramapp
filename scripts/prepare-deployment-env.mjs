#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export function deploymentEnv(input) {
  const domain = input.DEPLOYMENT_DOMAIN?.trim();
  if (!domain || !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)) throw new Error("Set a valid DEPLOYMENT_DOMAIN hostname");
  const origin = (subdomain) => `https://${subdomain}.${domain}`;
  const channels = {
    API: "api", CUSTOMER: "app", BOOKING: "booking", B2B: "b2b", MERCHANDISE: "merchandise",
    ORDERMIEYAMIN: "ordermieyamin", KOPITASIK: "kopitasik", KOL: "kol", KARYAWAN: "karyawan",
    REKRUTMEN: "rekrutmen", POS: "pos", ADMIN: "admin", PAY: "pay", INVESTOR: "investor", GROUP: "group",
  };
  const values = Object.fromEntries(Object.entries(channels).map(([key, subdomain]) => [`VITE_${key}_ORIGIN`, origin(subdomain)]));
  const url = input.VITE_SUPABASE_URL?.trim();
  const key = input.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required");
  const supabase = new URL(url);
  if (supabase.protocol !== "https:" || supabase.username || supabase.password || supabase.origin !== url) throw new Error("VITE_SUPABASE_URL must be an HTTPS origin");
  if (key.startsWith("sb_secret_")) throw new Error("A Supabase secret key must never be used in a browser build");
  values.VITE_SUPABASE_URL = url;
  values.VITE_SUPABASE_PUBLISHABLE_KEY = key;
  values.VITE_APP_BASE_URL = values.VITE_CUSTOMER_ORIGIN;
  values.VITE_PAY_RETURN_ORIGINS = ["CUSTOMER", "B2B", "MERCHANDISE", "POS", "ADMIN"].map((key) => values[`VITE_${key}_ORIGIN`]).join(",");
  values.VITE_CUSTOMER_RETURN_ORIGINS = ["MERCHANDISE", "ORDERMIEYAMIN", "BOOKING"].map((key) => values[`VITE_${key}_ORIGIN`]).join(",");
  for (const name of ["VITE_ANALYZER_URL", "VITE_REPORT_SERVICE_URL", "VITE_AI_PARSER_URL", "VITE_CUSTOMER_COMMUNITY_API_URL"]) {
    if (input[name]?.trim()) values[name] = input[name].trim();
  }
  return values;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const output = process.argv[2];
  if (!output) throw new Error("Usage: node scripts/prepare-deployment-env.mjs output.env");
  if (process.argv[3]) process.env.VITE_SUPABASE_PUBLISHABLE_KEY = readFileSync(process.argv[3], "utf8").trim();
  const values = deploymentEnv(process.env);
  writeFileSync(output, Object.entries(values).map(([name, value]) => `${name}=${JSON.stringify(value)}`).join("\n") + "\n", { mode: 0o600 });
  console.log("Wrote public deployment configuration; secret values are never accepted");
}
