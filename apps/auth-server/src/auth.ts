import { serverUrl, envOrigins, requiredEnv } from "./env";
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { dash } from "@better-auth/infra";

export const pool = new Pool(process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
} : {
  host: requiredEnv("PGHOST"),
  port: Number(requiredEnv("PGPORT")),
  user: requiredEnv("PGUSER"),
  password: process.env.DB_PASSWORD,
  database: requiredEnv("PGDATABASE"),
});

export const auth = betterAuth({
  database: pool,
  baseURL: serverUrl("AUTH_BASE_URL"),
  // Customer sessions are shared by the Djiwa App storefronts.
  trustedOrigins: envOrigins("AUTH_TRUSTED_ORIGINS"),
  // Share the central customer session across Djiwa App subdomains.
  advanced: {
    cookies: {
      // Match the database OAuth verification entry's ten-minute TTL.
      state: { attributes: { maxAge: 600 } },
    },
    crossSubDomainCookies: {
      enabled: Boolean(process.env.AUTH_COOKIE_DOMAIN?.trim()),
      domain: process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined,
    },
    defaultCookieAttributes: {
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    dash(),
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  account: {
    accountLinking: {
      // ponytail: allow Google to link to existing email/password account
      enabled: true,
      trustedProviders: ["google"],
      allowDifferentEmails: false,
      // Akun email/password punya emailVerified=false; email Google sudah
      // terverifikasi, jadi izinkan link tanpa verifikasi email lokal dulu.
      requireLocalEmailVerified: false,
    },
  },
  // ponytail: add magic link/2FA when requested
});
