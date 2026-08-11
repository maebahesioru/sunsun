# サンサンサンデー2026 公式サイト - Next.js 16 standalone ビルド
FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# git HEAD のデータ（playlist.csv / songs.json）を物理的に除外。
# 本番データはデプロイ後に SSH+docker cp で注入する（デプロイで古いデータに戻らないため）。
RUN rm -rf public/data && mkdir -p public/data \
  && echo '{"songs":[],"total_sec":0,"total_songs":0,"updated_at":""}' > public/data/songs.json \
  && printf '\xef\xbb\xbf再生順,曲名,表示名,ユーザーID,時間(秒),URL,ソース\n' > public/data/playlist.csv
RUN corepack enable && pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN chown -R nextjs:nodejs /app/public /app/.next
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
