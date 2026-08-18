# Cloudflare Pages Deployment Guide

**Last Updated:** August 18, 2026  
**Status:** Ready for Deployment  
**Target Platform:** Cloudflare Pages with OpenNext Adapter

---

## Prerequisites

### Required Accounts & Access
- [ ] Cloudflare account with Pages access
- [ ] GitHub repository access (for CI/CD)
- [ ] Wrangler CLI installed: `npm install -g wrangler`
- [ ] Production environment variables ready

### Required Environment Variables

Copy these from your current deployment and add to Cloudflare Pages:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Authentication
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Email (Resend)
RESEND_API_KEY=
REGISTRATION_EMAIL=

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=

# Payment Gateway (MyFatoorah)
MYFATOORAH_API_KEY=
MYFATOORAH_API_URL=
MYFATOORAH_WEBHOOK_SECRET=

# AI Services
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Monitoring (Sentry)
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=

# Webhook Secrets
WEBHOOK_SECRET=
AI_TRANSFER_WEBHOOK_SECRET=
```

---

## Deployment Steps

### Step 1: Initial Setup

1. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

2. **Create Cloudflare Pages Project:**
   ```bash
   wrangler pages project create ktech-crm
   ```

3. **Configure Project Settings:**
   - Build command: `npm run build:cloudflare`
   - Build output directory: `.open-next/worker`
   - Node.js version: 18.x or higher

### Step 2: Environment Variables

1. **Navigate to Cloudflare Dashboard:**
   - Go to Pages → Your Project → Settings → Environment Variables

2. **Add Production Variables:**
   - Add all variables from the list above
   - Mark sensitive values as "Encrypted"

3. **Add Staging Variables (if applicable):**
   - Repeat for staging environment
   - Use staging-specific values

### Step 3: Build & Deploy

#### Option A: Manual Deployment

```bash
# Build for Cloudflare
npm run build:cloudflare

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

#### Option B: GitHub Actions (Recommended)

Create `.github/workflows/deploy-cloudflare.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main
      - staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build for Cloudflare
        run: npm run build:cloudflare
        env:
          # Add all environment variables as GitHub Secrets
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          # ... add all other variables
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy .open-next/worker --project-name=ktech-crm
```

### Step 4: Custom Domain Setup

1. **Add Custom Domain:**
   - Go to Pages → Your Project → Custom Domains
   - Add: `ktech.edu` (production)
   - Add: `staging.ktech.edu` (staging)

2. **Update DNS:**
   - Add CNAME record pointing to Cloudflare Pages
   - Wait for SSL certificate provisioning (automatic)

3. **Verify Domain:**
   - Test: `https://ktech.edu`
   - Check SSL certificate is active

### Step 5: Verification

Run post-deployment checks:

```bash
# Test production endpoint
curl -I https://ktech.edu

# Test API routes
curl https://ktech.edu/api/health

# Check Sentry integration
# (Trigger an error and verify it appears in Sentry)
```

---

## Monitoring & Maintenance

### Performance Monitoring

1. **Cloudflare Analytics:**
   - Monitor request volume
   - Track error rates
   - Review cache hit ratios

2. **Sentry Error Tracking:**
   - Review error reports
   - Set up alerts for critical errors

3. **Uptime Monitoring:**
   - Configure external uptime monitor
   - Set up alerts for downtime

### Bundle Size Monitoring

```bash
# Analyze bundle before deployment
npm run analyze

# Verify bundle size
node scripts/analyze-bundle.mjs
```

### Rollback Procedure

If issues occur:

```bash
# List deployments
wrangler pages deployment list --project-name=ktech-crm

# Rollback to previous deployment
wrangler pages deployment rollback <DEPLOYMENT_ID> --project-name=ktech-crm
```

---

## Troubleshooting

### Build Failures

**Issue:** Build fails with "Module not found"
- **Solution:** Run `npm ci` to ensure clean install

**Issue:** OpenNext adapter fails
- **Solution:** Check Node.js version (18.x required)
- **Solution:** On Windows, use WSL or Linux-based CI/CD

### Runtime Errors

**Issue:** 500 errors on API routes
- **Solution:** Verify all environment variables are set
- **Solution:** Check Sentry for detailed error logs

**Issue:** Database connection errors
- **Solution:** Verify Supabase credentials
- **Solution:** Check Supabase project is active

### Performance Issues

**Issue:** Slow page loads
- **Solution:** Enable Cloudflare caching
- **Solution:** Review bundle size with analyzer

**Issue:** High memory usage
- **Solution:** Check for memory leaks in custom code
- **Solution:** Review Cloudflare Workers limits

---

## Optimization Checklist

- [ ] Bundle size < 10 MB
- [ ] All routes return 200 OK
- [ ] Environment variables configured
- [ ] Custom domain active with SSL
- [ ] Sentry error tracking working
- [ ] Database connections stable
- [ ] API rate limiting functional
- [ ] WhatsApp integration working
- [ ] Payment gateway functional
- [ ] Email sending operational

---

## Support & Resources

- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **OpenNext Docs:** https://opennext.js.org/
- **Next.js Docs:** https://nextjs.org/docs
- **Internal Docs:**
  - [Bundle Optimization Architecture](./BUNDLE-OPTIMIZATION-ARCHITECTURE.md)
  - [Phase 1 Implementation Report](./PHASE-1-IMPLEMENTATION-REPORT.md)
  - [Phase 2 Implementation Report](./PHASE-2-IMPLEMENTATION-REPORT.md)

---

## Next Steps

After successful deployment:

1. **Phase 3 (Optional):** Apply lazy loading to existing components
2. **Monitor Performance:** Track metrics for 1 week
3. **Optimize Further:** Based on real-world usage data
4. **Document Learnings:** Update this guide with findings
