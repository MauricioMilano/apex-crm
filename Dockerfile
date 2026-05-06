FROM node:20-alpine

RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

COPY . .
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ARG NEXTAUTH_SECRET
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ARG DEFAULT_ORG_ID
ENV DEFAULT_ORG_ID=$DEFAULT_ORG_ID
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ARG PORT
ENV PORT=$PORT
ENV HOSTNAME=0.0.0.0

RUN pnpm exec prisma generate
RUN pnpm build

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE $PORT

CMD ["pnpm", "start"]
