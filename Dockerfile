FROM node:22-alpine

RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11 --activate

COPY package.json pnpm-lock.yaml .npmrc ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

# Secrets are NOT baked into the image. Provide them at runtime via docker-compose, k8s, etc.
# DATABASE_URL, NEXTAUTH_SECRET, DEFAULT_ORG_ID → runtime env vars only.

RUN pnpm exec prisma generate
RUN pnpm build

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["pnpm", "start"]
