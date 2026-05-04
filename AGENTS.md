# Apex CRM — Agent Instructions

Full-featured CRM platform for service-based businesses. Next.js 15 App Router, TypeScript 5, PostgreSQL, Prisma 6, Shadcn/UI.

## Key References

- Stack & feature overview: [README.md](README.md)
- Tech stack rules: [AI_RULES.md](AI_RULES.md)
- Coding constraints: [agents/constrains.md](agents/constrains.md)
- Known issues tracker: [KNOWN_ISSUES.md](KNOWN_ISSUES.md)
- Prisma schema (15+ models): [prisma/schema.prisma](prisma/schema.prisma)
- Shared TypeScript types: [src/types/index.ts](src/types/index.ts)

## Dev Commands

```bash
pnpm install              # install dependencies
pnpm dev                  # start dev server (localhost:3000)
pnpm build                # production build
pnpm lint                 # lint
pnpm db:generate          # generate Prisma client
pnpm db:migrate           # run migrations (dev)
pnpm db:seed              # seed database
pnpm db:studio            # open Prisma Studio
```

> **Docker-first**: Always run the project via `docker-compose -f docker-compose.dev.yml up -d`. Never start the app directly on the host. App is accessible at **http://localhost:3001**.

## Architecture

```
src/actions/       # Server Actions — all mutations live here
src/app/
  (auth)/          # Login / Register routes
  (dashboard)/     # Protected CRM dashboard routes
  (client-portal)/ # Client-facing portal
  api/v1/          # REST API endpoints
  f/[formId]/      # Public form submissions
src/components/
  ui/              # Shadcn/UI primitives — use these exclusively
  */               # Feature-specific components
src/contexts/      # React Context providers (auth, crm)
src/hooks/         # Custom React hooks
src/lib/           # db.ts singleton, utils.ts, seed.ts
src/types/         # index.ts — all shared interfaces & enums
```

## Mandatory Patterns

### Server Actions (`src/actions/*.ts`)

```typescript
"use server"
import { z } from "zod"
import { prisma } from "@/lib/db"

const schema = z.object({ /* ... */ })

export async function actionName(input: unknown) {
  try {
    const parsed = schema.safeParse(input)
    if (!parsed.success) return { success: false as const, error: parsed.error.message }
    const result = await prisma.model.operation({ data: parsed.data })
    return { success: true as const, data: result }
  } catch (error) {
    return { success: false as const, error: String(error) }
  }
}
```

- Filter by `process.env.DEFAULT_ORG_ID` for multi-tenancy where applicable.
- Strip `passwordHash`, `magicLinkToken`, `magicLinkExpires` before returning any user object.
- Import `prisma` from `@/lib/db` — never instantiate `PrismaClient` directly.

### UI

- Use only components from `src/components/ui/` (Shadcn/UI). Do NOT install alternative UI libraries.
- Merge classNames with `cn()` from `@/lib/utils`.
- Icons: `lucide-react` only.
- Toasts: `sonner` (`toast.success`, `toast.error`) — never `alert()`.

### Forms

- `react-hook-form` + `@hookform/resolvers/zod` for client forms.
- Zod schemas validate all user input at the action boundary.

### Pages

- `"use client"` only when browser APIs or hooks are required; prefer Server Components.
- Protected routes → `(dashboard)/` group. Auth routes → `(auth)/` group.

### Prisma Schema Changes

Edit `prisma/schema.prisma` first, then run `pnpm db:migrate`. Follow naming: camelCase fields, PascalCase models, snake_case `@@map` names.

## Multi-Agent System

This repo uses a hierarchical agent system — see [agents/planner.md](agents/planner.md) and [agents/dev.md](agents/dev.md) for role-specific instructions.

## Test Credentials (seeded)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@apexbusiness.com | Password123! |
| Employee | mike.chen@apexbusiness.com | Password123! |
| Client | client@example.com | Password123! |

## Important Constraints

- No `@ts-ignore` or `any` casts unless explicitly authorized.
- No `console.log` of env vars or credentials.
- No destructive terminal commands (`rm -rf`, `git push --force`) without explicit authorization.
- Avoid git operations in general.
- If a step causes breaking schema change or data loss → STOP and report `⚠️ DESTRUCTIVE`.
- Do not add features, docstrings, or refactors beyond the assigned scope.
