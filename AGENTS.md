# Supabase-first project guidance

This project uses Supabase as its backend.

When working on backend data/auth/storage, use the Supabase migration and SQL scripts under:
- packages/backend/supabase/migrations
- packages/backend/supabase/scripts

Prefer Supabase MCP/CLI workflows for schema and data changes.

## Canonical deployment target

The user-selected deployment target is Dokploy at `https://dokploy.byrifqi.com`.
Use `*.byrifqi.com` for this deployment. Customer uses `app.byrifqi.com` and
API uses `api.byrifqi.com`; see `deploy/dokploy/README.md` for the full mapping.
The previous `djiwa-vps`/`*.djiwatentram.web.id` deployment is legacy and must not
be used for this requested rollout.

- Repository: `rifqiahmadf/djiwatentramapp`, branch `main`.
- Keep credentials in environment/secret settings, never source or build contexts.
- Commit/push and deployment are authorized after required environment setup is complete.
- Check the matching database schema, selected Dokploy project/services, domain routing,
  TLS, and an application request before declaring deployment complete.
