# syntax=docker/dockerfile:1

# --- Build/deps stage: install production dependencies only ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Runtime stage ---
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app


# Run as the built-in non-root user shipped with the node image.
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

USER node

# Interactive chat loop reads from stdin — run with `docker run -it`.
CMD ["node", "src/index.js"]
