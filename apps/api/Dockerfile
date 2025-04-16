# apps/api/Dockerfile

# ---- Builder Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy root dependency management files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Copy .npmrc if it exists and is needed for private packages
# COPY .npmrc ./

# Copy package.json for the target app and its direct workspace dependencies
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
# Add COPY lines for package.json of any other direct dependencies of apps/api here if needed

# Install dependencies ONLY for the api app and its workspace dependencies
# Using --frozen-lockfile ensures consistency
RUN pnpm install --frozen-lockfile --filter @entwine-rewrite/api... # The '...' includes dependencies

# Copy the rest of the source code AFTER installing dependencies
# .dockerignore should prevent host node_modules, .git, etc. from being copied
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
# Add COPY lines for source code of any other direct dependencies here if needed

# Optional: Run build step if needed for the API
# RUN pnpm --filter @entwine-rewrite/api build

# ---- Final Stage ----
FROM node:20-alpine
WORKDIR /app

# Copy installed dependencies and built artifacts from the builder stage
COPY --from=builder /app /app

# Expose the port the API runs on (adjust if different)
EXPOSE 4001

# Set the command to run the development server
# IMPORTANT: Ensure the 'dev' script in apps/api/package.json listens on 0.0.0.0
# e.g., "dev": "nest start --watch --preserveWatchOutput --host 0.0.0.0"
RUN npm install -g pnpm

CMD ["pnpm", "--filter", "@entwine-rewrite/api", "run", "dev"]