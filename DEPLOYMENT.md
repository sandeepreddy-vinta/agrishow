# FranchiseOS Production Deployment Guide

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Admin Dashboard│         │   Backend API    │         │  Device Clients │
│   (Netlify)     │◄───────►│   (VPS/Cloud)    │◄───────►│  (Franchises)   │
│   React SPA     │  HTTPS  │   Node.js/Express│  HTTPS  │   Display App   │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

**No external auth service needed!** JWT authentication is self-contained.

---

## Part 1: Backend Deployment (VPS)

### Recommended VPS Providers
- **DigitalOcean** ($6-12/month droplet)
- **Linode** ($5-10/month)
- **AWS EC2** (t3.micro free tier eligible)
- **Vultr** ($6/month)

### Step 1: Server Setup

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (reverse proxy)
apt install -y nginx

# Install Certbot (SSL certificates)
apt install -y certbot python3-certbot-nginx
```

### Step 2: Deploy Backend Code

```bash
# Create app directory
mkdir -p /var/www/franchiseos-api
cd /var/www/franchiseos-api

# Clone or upload your backend code
# Option 1: Git
git clone https://github.com/yourusername/franchiseos-backend.git .

# Option 2: SCP from local
# scp -r ./backend/* root@your-vps-ip:/var/www/franchiseos-api/

# Install dependencies
npm install --production

# Create production .env
nano .env
```

### Step 3: Configure Production Environment

```env
# /var/www/franchiseos-api/.env

NODE_ENV=production
PORT=3000

# IMPORTANT: Generate strong random keys!
API_KEY=your-super-secure-random-api-key-here-min-32-chars
JWT_SECRET=your-jwt-secret-key-min-32-chars-random-string

# File upload limits
MAX_FILE_SIZE=524288000

# Allowed file types
ALLOWED_VIDEO_TYPES=video/mp4,video/quicktime,video/webm
ALLOWED_IMAGE_TYPES=image/jpeg,image/png

# CORS - Add your Netlify domain
ALLOWED_ORIGINS=https://your-app.netlify.app,https://franchiseos.com

# Admin credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=ChangeThisSecurePassword123!
```

**Generate secure keys:**
```bash
# Generate API_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Start with PM2

```bash
# Start the app
pm2 start server.js --name franchiseos-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Check status
pm2 status
pm2 logs franchiseos-api
```

### Step 5: Configure Nginx

```bash
# Create Nginx config
nano /etc/nginx/sites-available/franchiseos-api
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Your API subdomain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase upload size limit
        client_max_body_size 500M;
    }
}
```

```bash
# Enable the site
ln -s /etc/nginx/sites-available/franchiseos-api /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

### Step 6: Setup SSL Certificate

```bash
# Get free SSL certificate from Let's Encrypt
certbot --nginx -d api.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
certbot renew --dry-run
```

### Step 7: Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

---

## Part 2: Frontend Deployment (Netlify)

### Step 1: Prepare for Deployment

Update `admin-dashboard/.env.production`:

```env
VITE_API_URL=https://api.yourdomain.com/api
# Leave VITE_API_KEY empty - will be set via Netlify env vars
VITE_API_KEY=
VITE_ENVIRONMENT=production
```

### Step 2: Build the Frontend

```bash
cd admin-dashboard
npm install
npm run build
```

This creates a `dist/` folder with optimized production files.

### Step 3: Deploy to Netlify

**Option A: Netlify CLI**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

**Option B: Netlify Dashboard**

1. Go to https://app.netlify.com
2. Click "Add new site" → "Deploy manually"
3. Drag and drop the `dist/` folder
4. Done!

**Option C: GitHub Integration (Recommended)**

1. Push code to GitHub
2. Connect repository in Netlify
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Auto-deploys on every push!

### Step 4: Configure Netlify Environment Variables

In Netlify Dashboard → Site settings → Environment variables:

```
VITE_API_URL = https://api.yourdomain.com/api
VITE_API_KEY = your-api-key-from-backend-env
VITE_ENVIRONMENT = production
```

### Step 5: Configure Custom Domain (Optional)

1. Netlify Dashboard → Domain settings
2. Add custom domain: `dashboard.yourdomain.com`
3. Update DNS records as instructed
4. SSL certificate is automatic!

---

## Part 3: Post-Deployment

### Update Backend CORS

Update backend `.env` with your Netlify URL:

```env
ALLOWED_ORIGINS=https://your-app.netlify.app,https://dashboard.yourdomain.com
```

Restart backend:
```bash
pm2 restart franchiseos-api
```

### Test the Deployment

1. Visit your Netlify URL
2. Login with admin credentials
3. Try uploading content
4. Register a test franchise
5. Check assignments

### Monitor the Backend

```bash
# View logs
pm2 logs franchiseos-api

# Monitor resources
pm2 monit

# Restart if needed
pm2 restart franchiseos-api
```

---

## Authentication Flow (Production)

```
1. User visits https://your-app.netlify.app
2. Enters email/password on /login
3. Frontend sends POST to https://api.yourdomain.com/api/auth/login
4. Backend validates credentials, returns JWT token
5. Frontend stores token in localStorage
6. All subsequent API calls include: Authorization: Bearer <token>
7. Backend verifies JWT signature using JWT_SECRET
```

**No Supabase/Firebase needed!** Everything is self-contained.

---

## Security Checklist

- [ ] Changed default admin password
- [ ] Generated strong random API_KEY (32+ chars)
- [ ] Generated strong random JWT_SECRET (32+ chars)
- [ ] Configured CORS to only allow your domains
- [ ] SSL certificates installed (HTTPS only)
- [ ] Firewall configured (UFW)
- [ ] Regular backups enabled (database.json)
- [ ] PM2 monitoring active
- [ ] Environment variables not committed to Git

---

## Backup Strategy

### Automated Backups (Already Built-in)

The backend automatically creates hourly backups in `backups/` folder.

### Manual Backup

```bash
# Backup database
cp /var/www/franchiseos-api/database.json ~/backups/database-$(date +%Y%m%d).json

# Backup content files
tar -czf ~/backups/content-$(date +%Y%m%d).tar.gz /var/www/franchiseos-api/content/
```

### Automated Daily Backups (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cp /var/www/franchiseos-api/database.json ~/backups/database-$(date +\%Y\%m\%d).json
```

---

## Scaling Considerations

### When to Upgrade

- **10-50 franchises**: Basic VPS ($6-12/month) is fine
- **50-200 franchises**: Upgrade to 2GB RAM VPS
- **200+ franchises**: Consider:
  - Load balancer
  - PostgreSQL instead of JSON file
  - CDN for content delivery (Cloudflare, AWS CloudFront)
  - Redis for caching

### Database Migration

When you outgrow JSON file storage:

1. Migrate to PostgreSQL or MongoDB
2. Update `src/services/database.js`
3. Keep same API endpoints (no frontend changes needed)

---

## Troubleshooting

### Backend won't start
```bash
pm2 logs franchiseos-api --lines 100
```

### CORS errors
- Check `ALLOWED_ORIGINS` in backend `.env`
- Restart backend: `pm2 restart franchiseos-api`

### Upload fails
- Check Nginx `client_max_body_size`
- Check backend `MAX_FILE_SIZE`

### Can't login
- Verify `VITE_API_URL` in Netlify env vars
- Check backend logs for auth errors
- Verify JWT_SECRET is set

---

## Cost Estimate

| Service | Cost | Notes |
|---------|------|-------|
| VPS (DigitalOcean) | $6-12/mo | 1-2GB RAM |
| Domain | $10-15/yr | Optional |
| Netlify | Free | Generous free tier |
| SSL Certificates | Free | Let's Encrypt |
| **Total** | **~$7-13/mo** | Very affordable! |

---

## Support

For issues:
1. Check backend logs: `pm2 logs franchiseos-api`
2. Check browser console for frontend errors
3. Verify environment variables
4. Test API endpoints with Postman

Your app is now production-ready! 🚀
