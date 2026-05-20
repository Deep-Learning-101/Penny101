# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 複製 package.json
COPY package.json ./

# 安裝依賴（使用 npm install 而非 npm ci，避免 package-lock.json 檢查問題）
RUN npm install --legacy-peer-deps

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# 複製依賴
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 設定環境變數（建置時需要）
ENV NEXT_TELEMETRY_DISABLED 1

# 建置 Next.js 應用（提供假的 DATABASE_URL 通過建置檢查）
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm run build

# ============================================
# Stage 3: Runner
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

# 設定環境
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV TZ=Asia/Taipei

# 建立 nextjs 使用者（安全性最佳實踐）
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 複製必要檔案
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 設定檔案擁有者
RUN chown -R nextjs:nodejs /app

# 切換到 nextjs 使用者
USER nextjs

# 暴露 3000 port
EXPOSE 3000

# 設定環境變數
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 啟動應用
CMD ["node", "server.js"]
