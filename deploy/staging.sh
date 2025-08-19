#!/bin/bash

# PayFlow Staging Deployment Script
# Simplified deployment script for staging environment

set -e

# Configuration
APP_NAME="payflow-staging"
CONTAINER_NAME="payflow-staging-app"
IMAGE_NAME="payflow:staging"
HEALTH_CHECK_URL="http://localhost:3001/health"
PORT=3001

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error "Docker is not running or not accessible"
fi

log "Starting staging deployment of $APP_NAME..."

# Stop existing container
log "Stopping existing staging container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Pull latest staging image
log "Pulling latest staging image..."
docker pull $IMAGE_NAME

# Start new container
log "Starting new staging container..."
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p $PORT:3000 \
    -e NODE_ENV=staging \
    -e DATABASE_URL="${STAGING_DATABASE_URL}" \
    -e SESSION_SECRET="${STAGING_SESSION_SECRET}" \
    -e STRIPE_SECRET_KEY="${STAGING_STRIPE_SECRET_KEY}" \
    -e STRIPE_WEBHOOK_SECRET="${STAGING_STRIPE_WEBHOOK_SECRET}" \
    --network staging-network \
    $IMAGE_NAME || error "Failed to start staging container"

# Create network if needed
docker network create staging-network 2>/dev/null || true

# Wait for startup
log "Waiting for application startup..."
sleep 15

# Run database migrations
log "Running database migrations..."
docker exec $CONTAINER_NAME npm run db:push || log "Migrations may have failed"

# Health check
log "Performing health check..."
if curl -f -s $HEALTH_CHECK_URL > /dev/null; then
    log "🎉 Staging deployment completed successfully!"
    log "Staging environment available at: http://staging.payflow.com:$PORT"
else
    error "Health check failed - staging deployment unsuccessful"
fi

# Cleanup old images
docker image prune -af --filter "label=env=staging" 2>/dev/null || true

log "Staging deployment completed"