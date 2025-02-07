# Build stage
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install all dependencies (including dev dependencies)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript code
RUN yarn build

# Production stage
FROM node:20-slim

# Create app directory
WORKDIR /app

# Create a non-root user
RUN groupadd -r -g 1001 nodejs && useradd -r -u 1001 -g nodejs appuser && chown -R appuser:nodejs /app

# Copy package files
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --frozen-lockfile --production

# Copy built assets from builder stage
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist

# Switch to non-root user
USER appuser

# Set environment variables
ENV NODE_ENV=production \
  PORT=3000

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
