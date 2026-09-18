# =========================
# 🏗️ BUILDER STAGE
# =========================
FROM node:20-alpine AS builder

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CLOUDFLARE_UPLOAD_HOST
ENV NEXT_PUBLIC_CLOUDFLARE_UPLOAD_HOST=$NEXT_PUBLIC_CLOUDFLARE_UPLOAD_HOST

WORKDIR /app
ARG APP_NAME

RUN npm install -g pnpm@10.30.1

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps ./apps
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build only the target app sequentially (not in parallel)
# This prevents OOM errors by building one app at a time
RUN NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS="--max-old-space-size=3072" \
    pnpm --filter=$APP_NAME build

# =========================
# 🚀 RUNTIME STAGE
# =========================
FROM node:20-alpine AS runner

WORKDIR /app
ARG APP_NAME
ENV APP_NAME=$APP_NAME
ENV NODE_ENV=production
ENV PORT=3000
RUN apk add --no-cache curl

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/apps/${APP_NAME}/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static
COPY --from=builder --chown=appuser:appgroup /app/apps/${APP_NAME}/public* ./apps/${APP_NAME}/public/

USER appuser
EXPOSE 3000

CMD ["sh", "-c", "node apps/${APP_NAME}/server.js"]