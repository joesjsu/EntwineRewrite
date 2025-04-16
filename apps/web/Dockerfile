# apps/web/Dockerfile

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
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
# Add COPY lines for package.json of any other direct dependencies of apps/web here if needed

# Install dependencies ONLY for the web app and its workspace dependencies
# Using --frozen-lockfile ensures consistency
RUN pnpm install --frozen-lockfile --filter web... # The '...' includes dependencies

# Copy the rest of the source code AFTER installing dependencies
# .dockerignore should prevent host node_modules, .git, etc. from being copied
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared
# Add COPY lines for source code of any other direct dependencies here if needed

# Optional: Run build step if needed for the web app (e.g., Next.js build)
# RUN pnpm --filter web build

# ---- Final Stage ----
FROM node:20-alpine
WORKDIR /app

# Copy installed dependencies and built artifacts from the builder stage
COPY --from=builder /app /app

# Expose the port the Web app runs on (default for Next.js is 3000)
EXPOSE 3000

# Set the command to run the development server
# IMPORTANT: Ensure the 'dev' script in apps/web/package.json listens on 0.0.0.0
# e.g., "dev": "next dev -p 3000 -H 0.0.0.0"
RUN npm install -g pnpm

CMD ["pnpm", "--filter", "web", "run", "dev"]