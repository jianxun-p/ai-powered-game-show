# ============================================================================
# Stage 1: Build Client
# ============================================================================
FROM node:20-alpine AS client-builder

WORKDIR /tmp/client

# Copy client package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci

# Copy client source
COPY client/ .

# Build client
RUN npm run build

# ============================================================================
# Stage 2: Runtime
# ============================================================================
FROM node:20-alpine

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./

# Install server dependencies (production only)
RUN npm ci --only=production

# Copy server source
COPY server/ ./

WORKDIR /app

# Copy built client from build stage
COPY --from=client-builder /tmp/client/dist ./client/dist

# Create public directory for static files if needed
RUN mkdir -p public

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Start server
CMD ["node", "server/server.js"]
