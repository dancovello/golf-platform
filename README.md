# golf-platform

Multi-tenant website platform for UK golf clubs, built on Payload CMS 3 and Next.js.

Start with `CLAUDE.md` (how we work, commands) and `docs/architecture/04-infrastructure-architecture-and-guardrails.md` (architecture and build order).

## Local setup

```bash
corepack enable            # once, provides pnpm
pnpm install
cp .env.example .env       # then set PAYLOAD_SECRET (openssl rand -hex 32)
cp .env.test.example .env.test
docker compose up -d       # local Postgres
pnpm test
pnpm dev                   # http://localhost:3000/admin
```
