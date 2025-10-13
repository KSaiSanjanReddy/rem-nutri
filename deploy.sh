#!/bin/bash

# HealthChat Automated Deployment Script
# This script handles complete deployment with cache clearing

set -e  # Exit on any error

echo "🚀 Starting HealthChat Deployment..."
echo "=================================="

# Configuration
SERVER_USER="root"
SERVER_IP="172.233.187.253"
SERVER_PATH="/var/www/html"
FRONTEND_PATH="C:/Users/ksais/OneDrive/Desktop/HealthChatApp/frontend"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Clean local build
echo -e "${YELLOW}📦 Step 1: Cleaning local build...${NC}"
cd "$FRONTEND_PATH"
rm -rf build
rm -rf node_modules/.cache
echo -e "${GREEN}✅ Local build cleaned${NC}"

# Step 2: Fresh build
echo -e "${YELLOW}📦 Step 2: Building fresh production bundle...${NC}"
export GENERATE_SOURCEMAP=false
npm run build

if [ ! -d "build" ]; then
    echo -e "${RED}❌ Build failed! No build directory found.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build completed successfully${NC}"

# Step 3: Clear server files
echo -e "${YELLOW}🗑️  Step 3: Clearing old files on server...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    # Stop Nginx
    sudo systemctl stop nginx
    
    # Delete all old files
    rm -rf /var/www/html/*
    
    # Clear all Nginx cache
    rm -rf /var/cache/nginx/*
    rm -rf /var/lib/nginx/*
    rm -rf /tmp/nginx/*
    
    echo "✅ Server cleaned"
ENDSSH
echo -e "${GREEN}✅ Server files cleared${NC}"

# Step 4: Deploy new files
echo -e "${YELLOW}📤 Step 4: Deploying new files to server...${NC}"
scp -r build/* ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
echo -e "${GREEN}✅ Files deployed${NC}"

# Step 5: Configure Nginx for no-cache
echo -e "${YELLOW}⚙️  Step 5: Updating Nginx configuration...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    # Backup current config
    cp /etc/nginx/sites-available/rem-nutri /etc/nginx/sites-available/rem-nutri.backup
    
    # Update Nginx config to disable caching
    cat > /etc/nginx/sites-available/rem-nutri << 'EOF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name chat.consultare.io;
    return 301 https://$host$request_uri;
}

# HTTPS - Main server
server {
    listen 443 ssl http2;
    server_name chat.consultare.io;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/chat.consultare.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.consultare.io/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Root directory
    root /var/www/html;
    index index.html;

    # Disable caching for all files
    location / {
        try_files $uri $uri/ /index.html;
        
        # Force no cache
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        add_header Pragma "no-cache";
        add_header Expires "0";
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket proxy
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
EOF
    
    # Test and restart Nginx
    nginx -t
    systemctl start nginx
    
    echo "✅ Nginx configured and restarted"
ENDSSH
echo -e "${GREEN}✅ Nginx configured${NC}"

# Step 6: Verify deployment
echo -e "${YELLOW}🔍 Step 6: Verifying deployment...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    echo "Files in web directory:"
    ls -lh /var/www/html/static/js/ 2>/dev/null || echo "No JS files found"
    
    echo ""
    echo "Nginx status:"
    systemctl status nginx | grep "Active:"
    
    echo ""
    echo "PM2 status:"
    pm2 status
ENDSSH

echo ""
echo -e "${GREEN}=================================="
echo -e "🎉 DEPLOYMENT COMPLETE!"
echo -e "==================================${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Clear your browser cache!${NC}"
echo "   1. Close ALL browser windows"
echo "   2. Open Incognito/Private mode"
echo "   3. Go to: https://chat.consultare.io/register"
echo "   4. Press Ctrl+Shift+R for hard refresh"
echo ""
echo -e "${GREEN}✅ Your app should now have the latest code!${NC}"
