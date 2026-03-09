# ---- Stage 1: Dependencies ----
FROM node:22-alpine AS deps

WORKDIR /app

# Install libc6-compat for alpine compatibility with some npm packages
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json ./

# Install production and dev dependencies (dev needed for build step)
RUN npm ci

# ---- Stage 2: Builder ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build-time environment variables for NEXT_PUBLIC_* values
# These get inlined during the build and cannot be changed at runtime
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ARG NEXT_PUBLIC_HF_ENABLED
ARG NEXT_PUBLIC_MAPS_TOKEN

# Set NODE_ENV for the build
ENV NODE_ENV=production

# Build the Next.js application (standalone output)
RUN npm run build

# ---- Stage 3: Runner ----
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Don't run as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
