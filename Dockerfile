# ---------- Build stage ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Install deps
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install; \
  else npm install; \
  fi

# Copy source and build
COPY . .
RUN \
  if [ -f yarn.lock ]; then yarn build; \
  else npm run build; \
  fi

# ---------- Runtime stage ----------
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy built app from builder
COPY --from=builder /app ./

# Expose Next.js port
EXPOSE 3000

# Start Next.js
CMD [ "sh", "-c", "if [ -f yarn.lock ]; then yarn start; else npm start; fi" ]