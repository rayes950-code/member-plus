# Member Plus — Deployment Guide

## Prerequisites
- Docker + Docker Compose installed
- Domain name with HTTPS (Salla requires HTTPS for webhooks)
- Salla Partner Portal account

## Step 1: Salla Partner Portal Setup

1. Go to **https://salla.partners**
2. Create a new app: "Member Plus"
3. Set these URLs:
   - **OAuth Callback URL:** `https://yourdomain.com/api/v1/access`
   - **Webhook URL:** `https://yourdomain.com/webhooks/salla`
4. Request scopes: `customers.read_write`, `marketing.read_write`, `orders.read`
5. Create 3 pricing plans:
   - Starter: 79 SAR/month, 7-day trial
   - Pro: 149 SAR/month, 7-day trial
   - Unlimited: 249 SAR/month, 7-day trial
6. Copy your `client_id`, `client_secret`, `webhook_secret`

## Step 2: Configure Environment

```bash
cp .env.example .env
nano .env  # Fill in all values
```

Generate security keys:
```bash
python3 -c "import secrets; print('JWT_SECRET=' + secrets.token_urlsafe(32))"
python3 -c "import base64,os; print('ENCRYPTION_KEY=' + base64.urlsafe_b64encode(os.urandom(32)).decode())"
```

## Step 3: Deploy

```bash
docker compose up -d
```

This starts:
- **App** on port 8000 (FastAPI + frontend)
- **PostgreSQL** on port 5432 (internal)
- **Redis** on port 6379 (internal)

## Step 4: Set Up HTTPS

Use a reverse proxy (Nginx/Caddy) with SSL:

### Option A: Caddy (easiest)
```
yourdomain.com {
    reverse_proxy localhost:8000
}
```

### Option B: Nginx + Let's Encrypt
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Step 5: Verify

```bash
# Health check
curl https://yourdomain.com/health

# Test webhook endpoint
curl -X POST https://yourdomain.com/webhooks/salla \
  -H "Content-Type: application/json" \
  -d '{"event":"test"}'
```

## Step 6: Install on Test Store

1. Go to Salla Partner Portal → Your App → Install
2. Install on a test/sandbox store
3. Complete the setup wizard
4. Test the full flow

## URLs After Deployment

| URL | Purpose |
|-----|---------|
| `https://yourdomain.com/frontend/dashboard.html` | Merchant dashboard |
| `https://yourdomain.com/frontend/admin.html` | Internal admin panel |
| `https://yourdomain.com/frontend/customer.html?store=ID` | Customer join page |
| `https://yourdomain.com/frontend/member.html` | Customer membership page |
| `https://yourdomain.com/webhooks/salla` | Salla webhook receiver |
| `https://yourdomain.com/api/v1/access?token=X` | Merchant access link |

## Monitoring

```bash
# View logs
docker compose logs -f app

# Database backup
docker compose exec postgres pg_dump -U memberplus memberplus > backup.sql

# Restart
docker compose restart app
```
