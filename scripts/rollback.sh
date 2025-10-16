#!/bin/bash

# Rollback script for emergency situations
# This script will revert to the previous working version

echo "🚨 Starting rollback process..."

# Navigate to project directory
cd /var/www/rem-nutri/HealthChatApp

# Get the previous commit hash
PREVIOUS_COMMIT=$(git log --oneline -n 2 | tail -1 | awk '{print $1}')

echo "🔄 Rolling back to commit: $PREVIOUS_COMMIT"

# Reset to previous commit
git reset --hard $PREVIOUS_COMMIT

# Install dependencies
cd backend
npm ci --production

# Restart PM2 services
pm2 restart health-chat-api
pm2 save

# Check status
pm2 status

echo "✅ Rollback completed successfully!"
echo "🔍 Check the application at: https://chat.consultare.io"
