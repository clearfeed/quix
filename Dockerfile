# Build stage
FROM node:20-slim AS build
ENV NODE_ENV=build
WORKDIR /app

# Copy package files first for better caching
COPY package.json yarn.lock ./

# Install all dependencies including dev dependencies
RUN /bin/sh -c "yarn install --frozen-lockfile"

# Copy application source code (excluding agent-packages due to .dockerignore)
COPY . .

# Build the application and verify the output
RUN /bin/sh -c "yarn build && ls -la dist/"

# Install production dependencies
RUN /bin/sh -c "yarn install --production --frozen-lockfile --prefer-offline"

# Production stage
FROM node:20-slim

WORKDIR /app
# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy package.json and yarn.lock for production dependencies
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Verify the copied files
RUN ls -la dist/

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main.js"]
