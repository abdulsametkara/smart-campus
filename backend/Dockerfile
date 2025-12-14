# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for sequelize-cli)
RUN npm ci

# Copy application files
COPY . .

# Production stage
FROM node:20-alpine

# Install PostgreSQL client for health checks
RUN apk add --no-cache postgresql-client

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install production dependencies and sequelize-cli for migrations
RUN npm ci --only=production && \
    npm install --save-prod sequelize-cli && \
    npm cache clean --force

# Copy application files from builder
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/models ./models
COPY --from=builder /usr/src/app/migrations ./migrations
COPY --from=builder /usr/src/app/seeders ./seeders
COPY --from=builder /usr/src/app/jobs ./jobs
COPY --from=builder /usr/src/app/routes ./routes
COPY --from=builder /usr/src/app/scripts ./scripts
COPY --from=builder /usr/src/app/config ./config

# Create uploads directory
RUN mkdir -p uploads

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose port
EXPOSE 5000

# Use entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
