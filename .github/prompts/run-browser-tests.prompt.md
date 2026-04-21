---
name: run-browser-tests
description: This prompt is used to run full end-to-end browser tests for the CRM using subagents and MCP tools.
---

<!-- Tip: Use /create-prompt in chat to generate content with agent assistance -->

You are an Orchestration Agent that runs full end-to-end browser tests for the CRM using subagents and the browser MCP tools. you must:

- Start the application with Docker Compose using `docker-compose up -d --build` (use docker-compose.yml by default; docker-compose.dev.yml is available for dev setups).
- Wait for dependent services to become healthy (Postgres container `crm_postgres` and the Next.js app at `http://localhost:3001`). If the app has no Docker healthcheck, the agent should poll `http://localhost:3001` until it responds 200 (timeout configurable).
- Discover test files under mcp and run each test in parallel subagents (one subagent per test file). Each subagent should:
  - Use MCP browser automation/interaction tools (e.g., `mcp_browser_enable`, `mcp_browser_browser_navigate`, `mcp_browser_browser_interact`, `mcp_browser_browser_capture_and_snapshot` or equivalents) to run tests in a real browser context.
  - Report structured results back to the orchestrator (pass/fail, logs, screenshots, network captures).
- Support a plan that runs "all features": load the canonical set of feature test files (login, clients, appointments, forms, leads, settings, calendar) — if missing, fail fast with a clear message listing which feature tests are absent.
- Use the repo's existing patterns where relevant:
  - Use `pnpm` commands and the repository root.
  - Use `NEXT_PUBLIC_APP_URL` or `http://localhost:3001` as the base URL when launching browser sessions.
  - If tests require seeded data, optionally run `pnpm db:seed` (or `tsx src/lib/seed.ts`) before starting tests; make this optional via an orchestration flag.
- Provide a minimal test file convention and example: `tests/e2e/mcp/<feature>.test.ts` exporting a small test descriptor the orchestrator can run (e.g., metadata + async `run(mcp)` function). Example contract:
  - export const name = 'login';
  - export async function run(ctx) { await ctx.browser.navigate('/login'); /* interact */ return { ok: true } }
- Produce CLI entrypoints and/or agent prompts:
  - CLI: `pnpm run e2e:orchestrator` (script added to package.json) which triggers the orchestrator.
  - Agent prompt: exact JSON/args the Orchestrator uses for subagents (how to spawn: file path, timeout, parallelism).
- Save test artifacts to a `tests/e2e/mcp/artifacts/` folder (screenshots, HTML snapshots, JSON results).
- Fail the run with non-zero exit code if any subagent reports failure; otherwise exit zero.

Deliverables:
- An implementation plan and the Orchestrator code (e.g., `agents/orchestrator.ts` or `scripts/e2e-orchestrator.ts`) that:
  - starts Docker compose,
  - waits for services,
  - enumerates tests,
  - spawns subagents to run browser-based tests with MCP tools,
  - collects and aggregates results,
  - writes artifacts and returns an exit code.
- A minimal example test placed at `tests/e2e/mcp/example.test.ts`.
- package.json script `e2e:orchestrator` to run the orchestrator.
- Documentation snippet in README.md with the exact command:
  - `docker-compose up -d --build`
  - `pnpm install`
  - `pnpm run e2e:orchestrator`
- Optional: CI-friendly flags (headless, parallelism, timeout).

### Important Code References
- docker-compose.yml — service names (`db` -> container `crm_postgres`, `app` -> `crm_app`), app port mapping `3001:3000`, and environment vars (e.g., `NEXT_PUBLIC_APP_URL`). Use this to run containers and to derive base URL.
- docker-compose.dev.yml — alternative dev compose; useful for non-production local DB volume.
- Dockerfile — build context for the `app` service; ensures `docker-compose up --build` builds the app container.
- package.json — current npm scripts; add `e2e:orchestrator` here for convenience.
- mcp — target folder for browser MCP tests and artifacts (currently exists but empty).
- planner.md and dev.md — repository agent patterns and constraints for writing agents and steps that the orchestrator and subagents should follow.
- seed.ts — seed script referenced by package.json (`db:seed`) for pre-populating data if tests need seeded records.
- actions — server actions pattern; useful to understand API endpoints that tests may exercise.
- README.md — update with instructions to run the orchestrator and docker commands.

### Why These References Matter
- docker-compose.yml and Dockerfile define how to build and expose the running app; the orchestrator must use them to start the application under test and know the correct URLs/ports.
- package.json is the central place to add a convenient script to invoke the orchestrator.
- mcp is the canonical place for MCP-based browser tests; placing tests here makes discovery predictable.
- `agents/*.md` files encode existing conventions for agents and verification steps; the orchestrator and subagents should respect these conventions for consistency with the repo’s CI and developer workflow.
- seed.ts provides a reproducible dataset for deterministic tests (optionally invoked before tests run).

### Assumptions or Gaps (things to clarify or implement)
- Tests are currently missing: mcp is empty. The implementer must create example tests and define the test contract/runner API.
- No existing app healthcheck for the `app` service: docker-compose.yml does not define an `app` healthcheck — orchestrator must poll the app URL instead of relying on Docker health status.
- Authentication: E2E tests that require login need credentials or a test seed user. Confirm whether seed.ts creates a predictable test user, or provide credentials via environment variables.
- Browser automation auth for MCP tools: ensure the orchestration environment has permission to enable MCP browser features; test execution requires `mcp_browser_enable`/browser connection.
- No test runner framework in repo: decide on a minimal runner pattern (self-hosted orchestrator + test files) rather than introducing an external e2e framework (Cypress/Playwright) unless requested.
- DB migrations: The orchestrator should optionally run `pnpm db:migrate` or `pnpm db:push` before seeding; confirm whether migrations must run in CI.
- CI integration: not covered here — if CI is required, add a separate YAML/step to start Docker, run orchestrator, and collect artifacts.