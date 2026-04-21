# Apex CRM — Multi-Agent Orchestrator

A full-featured **CRM and Business Management Platform** for service-based businesses, built on Next.js 15 App Router with PostgreSQL, Prisma, and Shadcn/UI.

---

## Project Overview

| Concern | Choice |
|---|---|
| Framework | Next.js 15.3 (App Router, React 19) |
| Language | TypeScript 5 |
| Database | PostgreSQL via Prisma 6 ORM |
| Auth | bcryptjs password hashing; magic-link fields reserved |
| UI | Shadcn/UI + Radix UI + Tailwind CSS 3 |
| Forms | React Hook Form + Zod |
| Charts | Recharts 2 |
| Notifications | Sonner 2 |
| Containerization | Docker + docker-compose |

### Key Features
- **Lead Management** — Kanban board with customizable statuses
- **Client CRM** — Contacts, history, file uploads
- **Appointment Booking** — Calendar with employee availability, recurring support
- **Service Management** — Pricing and duration definitions
- **Custom Forms** — Publishable lead-capture forms with field builder
- **Webhooks & API Keys** — External integrations and programmatic access
- **Multi-tenant** — Organization → Location hierarchy
- **Audit Logging** — Compliance-ready action tracking

---

## Agentic Architecture

This repository uses a hierarchical multi-agent system:

| Agent | File | Responsibility |
|---|---|---|
| **Orchestrator** | *(you)* | Routing, state management, delegation, validation |
| **Planner** | [`/agents/planner.md`](/agents/planner.md) | Breaks features into atomic, sequenced ledger steps |
| **Dev** | [`/agents/dev.md`](/agents/dev.md) | Executes isolated coding tasks, runs tests, reports results |

---

## Local Development

```bash
# Install dependencies
pnpm install

# Start DB + app
docker-compose -f docker-compose.dev.yml up -d

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed the database
pnpm db:seed

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful DB Commands

```bash
pnpm db:studio        # Open Prisma Studio
pnpm db:push          # Push schema changes without migrations
pnpm db:migrate:deploy # Deploy migrations in production
```

---

## Project Structure

```
src/
├── actions/       # Next.js Server Actions (Zod-validated, Prisma-backed)
├── app/           # App Router pages & API route handlers
│   ├── (auth)/            # Login / Register
│   ├── (dashboard)/       # Protected CRM dashboard
│   ├── (client-portal)/   # Client-facing portal
│   ├── api/v1/            # REST API endpoints
│   └── f/[formId]/        # Public form submission
├── components/
│   ├── ui/        # Shadcn/UI primitives
│   └── */         # Feature-specific components
├── contexts/      # React Context providers (auth, crm)
├── hooks/         # Custom React hooks
├── lib/           # db singleton, utils, mock-data, seed
└── types/         # Shared TypeScript interfaces & enums
prisma/
└── schema.prisma  # 15+ Prisma models
```

---

## Architecture Patterns

### Server Actions
All mutations live in `src/actions/` and follow this contract:
```typescript
"use server"
// 1. Validate input with Zod
// 2. Query Prisma (filter by DEFAULT_ORG_ID env var for multi-tenancy)
// 3. Return discriminated union: { success: true, data } | { success: false, error }
```

### DB Access
`src/lib/db.ts` exports a Prisma singleton to prevent connection pool exhaustion across hot-reloads.

### Auth
Password hashing via `bcryptjs`. Sensitive fields (`passwordHash`, `magicLinkToken`) are stripped before returning user objects.

### State
Global CRM state via React Context + localStorage persistence for demo/mock mode. Real persistence goes through Server Actions → Prisma → PostgreSQL.
