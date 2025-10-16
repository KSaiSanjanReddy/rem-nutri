# 🚀 Deployment Checklist

## Before Setting Up CI/CD:

### ✅ Server Requirements:
- [ ] SSH access to server working
- [ ] PM2 installed and running
- [ ] Git repository accessible from server
- [ ] Nginx configured and running
- [ ] Database connection working

### ✅ GitHub Secrets Setup:
- [ ] `SERVER_HOST` - Your server IP address
- [ ] `SERVER_USER` - SSH username (usually `root`)
- [ ] `SERVER_SSH_KEY` - Private SSH key for server access
- [ ] `SERVER_PORT` - SSH port (usually `22`)

### ✅ Safety Measures:
- [ ] Backup current working version
- [ ] Test manual deployment first
- [ ] Have rollback script ready
- [ ] Monitor server logs after deployment

## How to Set Up GitHub Secrets:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - `SERVER_HOST`: `your-server-ip`
   - `SERVER_USER`: `root`
   - `SERVER_SSH_KEY`: `your-private-ssh-key`
   - `SERVER_PORT`: `22`

## Testing the Pipeline:

1. Make a small change to your code
2. Push to `feature/deploy-remnutri` branch
3. Check GitHub Actions tab for deployment status
4. Verify your application is working
5. Check PM2 status on server

## Emergency Rollback:

If something goes wrong, run on your server:
```bash
cd /var/www/rem-nutri/HealthChatApp
bash scripts/rollback.sh
```

## Monitoring:

- Check GitHub Actions logs
- Monitor PM2 logs: `pm2 logs health-chat-api`
- Check application: https://chat.consultare.io
- Monitor server resources: `htop`
