# =============================================
# Hornet AI - Production Dockerfile
# Multi-stage build for optimized image size
# =============================================

# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build arguments for environment
ARG VITE_APP_VERSION
ARG VITE_API_URL
ENV VITE_APP_VERSION=${VITE_APP_VERSION:-0.1.0}
ENV VITE_API_URL=${VITE_API_URL:-/api}

# Build the application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add non-root user for security
RUN addgroup -g 1001 -S hornet && \
    adduser -u 1001 -S hornet -G hornet && \
    chown -R hornet:hornet /usr/share/nginx/html && \
    chown -R hornet:hornet /var/cache/nginx && \
    chown -R hornet:hornet /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R hornet:hornet /var/run/nginx.pid

# Security: Remove default nginx content
RUN rm -rf /usr/share/nginx/html/index.html.default 2>/dev/null || true

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Expose port
EXPOSE 80

# Switch to non-root user
USER hornet

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
