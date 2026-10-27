# Supabase Backend Scripts

This folder contains migration SQL and data transformation scripts for the Supabase backend.

## Contents
- `migrations/`: schema migrations and support SQL.
- `scripts/`: import/transform utilities and runner scripts.

## Typical Flow
1. Apply migrations to target database.
2. Import legacy export data if needed.
3. Run transform scripts to populate runtime tables and views.
4. Verify counts and critical queries.

## KOL Portal Migrations

KOL inquiry and shared-visit schema migrations live in `migrations/` and are applied atomically through the backend package runner:

```bash
cd packages/backend
bun run supabase:migrate:kol-portal
```

Set `SUPABASE_DB_URL` in the runtime environment first. The SQL is idempotent; the runner wraps both files in one transaction and rolls back on failure.

## Import Command
Use the backend package script:

```bash
bun run supabase:import:legacy -- --export-dir ../../scratch/legacy-export
```

## Notes
- Mirror objects are retained for historical data traceability.
- Runtime reads/writes should target active POS/auth tables and RPCs.

## Public staff directory bootstrap

`migrations/20261028000100_bootstrap_public_user_directory.sql` creates the two
staff-directory backing tables when missing and publishes `public.pos_users_public`.
Apply it inside a transaction with an administrative PostgreSQL connection and
verified TLS. The SQL can be reapplied and notifies PostgREST to reload its schema.
It does not seed users, import legacy data, or create unrelated application tables.

Anonymous/authenticated clients receive read-only access to the directory view,
without direct access to its backing tables. Password/PIN hashes, PIN fingerprints,
raw records and biometric descriptors are excluded. The legacy browser PIN fallback
must use server-side authentication instead; this bootstrap does not enable that fallback.
For Supabase poolers requiring the provider CA, obtain it through Supabase Connect
or the official Supabase download location; never disable certificate verification.
