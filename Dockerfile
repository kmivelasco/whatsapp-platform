# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace package.json files
COPY server/package.json server/
COPY client/package.json client/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY server/ server/
COPY client/ client/

# Generate Prisma client
RUN cd server && npx prisma generate

# Build server (TypeScript → dist/)
RUN npm run build -w server

# Build client (Vite → dist/)
RUN npm run build -w client

# ---- Production stage ----
FROM node:20-alpine AS production

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY server/package.json server/

# Install only production dependencies for server
RUN npm ci --workspace=server --omit=dev

# Copy Prisma schema and generate client
COPY server/prisma/ server/prisma/
RUN cd server && npx prisma generate

# Copy compiled server
COPY --from=builder /app/server/dist/ server/dist/

# Copy built client
COPY --from=builder /app/client/dist/ client/dist/

# Copy seed file for initial setup
COPY server/prisma/seed.ts server/prisma/seed.ts

# WhatsApp sessions directory
RUN mkdir -p /app/.wa-sessions

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Run migrations, seed, and start server
CMD ["sh", "-c", "cd server && npx prisma db push --skip-generate && node dist/index.js"]
