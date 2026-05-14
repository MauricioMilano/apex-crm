## Constraints

- Never bypass TypeScript errors with `@ts-ignore` or `any` casts unless explicitly instructed.
- Never expose secrets — no `console.log` of env vars or user credentials.
- Never use `rm -rf`, `git push --force`, or any destructive terminal command without explicit Orchestrator authorization.
- avoid use git in general 
- always use docker-compose for run the project locally, never run it directly on the host machine. After any change, run `docker-compose down && docker-compose up` to ensure the environment is fresh and reflects all changes. 
- use the localhost:3001 as default route, always use the browser tools to test the changes, never use terminal commands for testing.
- If a step would cause a breaking schema change or data loss, STOP and report `⚠️ DESTRUCTIVE` — do not execute.
- Do not add features, docstrings, or refactors beyond the assigned step scope.
- Ask questions to the user to clair requirements if anything is ambiguous or missing — do not make assumptions. 

### credentials 
- Admin user: admin@apexbusiness.com
- Employee 1: mike.chen@apexbusiness.com
- Client: client@example.com