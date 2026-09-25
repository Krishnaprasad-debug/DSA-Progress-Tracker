# Stage 1: Build TypeScript source
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy backend source code and config
COPY . .

# Compile TypeScript to dist/
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package manifests and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JavaScript output from builder stage
COPY --from=builder /app/dist ./dist

# Non-root user for security
USER node

EXPOSE 5000

CMD ["node", "dist/index.js"]
