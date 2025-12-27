# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (skip native builds for sqlite3)
RUN npm install --ignore-scripts

# Copy application files
COPY . .

# Production stage
FROM node:20-alpine

# Install PostgreSQL client for health checks
RUN apk add --no-cache postgresql-client

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install production dependencies and sequelize-cli for migrations (skip native builds)
RUN npm install --omit=dev --ignore-scripts && \
    npm install --save-prod sequelize-cli --ignore-scripts && \
    npm cache clean --force

# Copy application files from builder
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/models ./models
COPY --from=builder /usr/src/app/migrations ./migrations
COPY --from=builder /usr/src/app/seeders ./seeders
COPY --from=builder /usr/src/app/seed_data ./seed_data
COPY --from=builder /usr/src/app/jobs ./jobs
COPY --from=builder /usr/src/app/routes ./routes
COPY --from=builder /usr/src/app/scripts ./scripts
COPY --from=builder /usr/src/app/config ./config
COPY --from=builder /usr/src/app/tests ./tests

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Start the application directly
CMD ["npm", "start"]
