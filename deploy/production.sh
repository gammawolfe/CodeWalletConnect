#!/bin/bash

# PayFlow Production Deployment Script
# This script handles zero-downtime deployment to production

set -e

# Configuration
APP_NAME="payflow"
CONTAINER_NAME="payflow-app"
IMAGE_NAME="payflow:latest"
BACKUP_CONTAINER_NAME="payflow-app-backup"
HEALTH_CHECK_URL="http://localhost:3000/health"
MAX_HEALTH_CHECKS=30
HEALTH_CHECK_INTERVAL=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error "Docker is not running or not accessible"
fi

# Backup current container
backup_current_container() {
    log "Backing up current container..."
    
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        docker rename $CONTAINER_NAME $BACKUP_CONTAINER_NAME 2>/dev/null || true
        log "Current container backed up as $BACKUP_CONTAINER_NAME"
    else
        log "No existing container to backup"
    fi
}

# Pull latest image
pull_latest_image() {
    log "Pulling latest application image..."
    docker pull $IMAGE_NAME
    
    if [ $? -ne 0 ]; then
        error "Failed to pull latest image"
    fi
    
    log "Successfully pulled latest image"
}

# Start new container
start_new_container() {
    log "Starting new container..."
    
    # Stop backup container if it exists
    docker stop $BACKUP_CONTAINER_NAME 2>/dev/null || true
    
    # Start new container
    docker run -d \
        --name $CONTAINER_NAME \
        --restart unless-stopped \
        -p 3000:3000 \
        -e NODE_ENV=production \
        -e DATABASE_URL="${DATABASE_URL}" \
        -e SESSION_SECRET="${SESSION_SECRET}" \
        -e STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY}" \
        -e STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET}" \
        --network payflow-network \
        --log-driver json-file \
        --log-opt max-size=10m \
        --log-opt max-file=3 \
        $IMAGE_NAME
    
    if [ $? -ne 0 ]; then
        error "Failed to start new container"
    fi
    
    log "New container started successfully"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    local checks=0
    while [ $checks -lt $MAX_HEALTH_CHECKS ]; do
        if curl -f -s $HEALTH_CHECK_URL > /dev/null; then
            log "Health check passed"
            return 0
        fi
        
        checks=$((checks + 1))
        log "Health check $checks/$MAX_HEALTH_CHECKS failed, retrying in ${HEALTH_CHECK_INTERVAL}s..."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    error "Health checks failed after $MAX_HEALTH_CHECKS attempts"
}

# Rollback to previous version
rollback() {
    warn "Rolling back to previous version..."
    
    # Stop failed container
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    
    # Restore backup container
    if docker ps -a -q -f name=$BACKUP_CONTAINER_NAME | grep -q .; then
        docker rename $BACKUP_CONTAINER_NAME $CONTAINER_NAME
        docker start $CONTAINER_NAME
        
        log "Rollback completed successfully"
        
        # Verify rollback worked
        sleep 5
        if curl -f -s $HEALTH_CHECK_URL > /dev/null; then
            log "Rollback health check passed"
            return 0
        else
            error "Rollback failed - manual intervention required"
        fi
    else
        error "No backup container found for rollback"
    fi
}

# Cleanup old containers and images
cleanup() {
    log "Cleaning up old containers and images..."
    
    # Remove backup container
    docker rm $BACKUP_CONTAINER_NAME 2>/dev/null || true
    
    # Clean up old images (keep last 3)
    docker image prune -af --filter "label=app=$APP_NAME" || true
    
    # Clean up old containers
    docker container prune -f || true
    
    log "Cleanup completed"
}

# Database migration
run_migrations() {
    log "Running database migrations..."
    
    docker exec $CONTAINER_NAME npm run db:push
    
    if [ $? -ne 0 ]; then
        warn "Database migration failed - this may require manual intervention"
        return 1
    fi
    
    log "Database migrations completed successfully"
}

# Main deployment function
deploy() {
    log "Starting production deployment of $APP_NAME..."
    
    # Pre-deployment checks
    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL environment variable is not set"
    fi
    
    if [ -z "$SESSION_SECRET" ]; then
        error "SESSION_SECRET environment variable is not set"
    fi
    
    # Create network if it doesn't exist
    docker network create payflow-network 2>/dev/null || true
    
    # Deployment steps
    backup_current_container
    pull_latest_image
    start_new_container
    
    # Wait for container to be fully ready
    sleep 10
    
    # Run health checks
    if health_check; then
        # Run database migrations
        if run_migrations; then
            cleanup
            log "🎉 Production deployment completed successfully!"
            
            # Send success notification (implement your notification method)
            # curl -X POST -H 'Content-type: application/json' \
            #   --data '{"text":"PayFlow production deployment successful!"}' \
            #   $SLACK_WEBHOOK_URL
            
        else
            warn "Deployment succeeded but migrations failed"
            log "Manual database intervention may be required"
        fi
    else
        rollback
        error "Deployment failed - rolled back to previous version"
    fi
}

# Script execution
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    rollback)
        rollback
        ;;
    health-check)
        health_check
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health-check|cleanup}"
        exit 1
        ;;
esac