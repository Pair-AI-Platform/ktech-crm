# Cloudflare Pages Edge Runtime Migration Plan

## Executive Summary

This document outlines the comprehensive migration plan for configuring all Next.js routes in the ktech-crm application to run with the Edge Runtime, as required by Cloudflare Pages deployment.

**Current State:** The application has 100+ routes (API and page routes) that are not configured for Edge Runtime, causing Cloudflare Pages build failures.

**Target State:** All routes will be configured with `export const runtime = 'edge'` to enable successful deployment to Cloudflare Pages.

---

## 1. Current State Analysis

### 1.1 Project Structure

The application uses Next.js 16.2.6 with the App Router architecture:

- **API Routes:** Located in `app/api/` directory
- **Page Routes:** Located in `app/(auth)/`, `app/(dashboard)/`, and `app/(marketing)/` route groups
- **Configuration:** Currently uses `export const dynamic = 'force-dynamic'` in some routes
- **Existing Edge Runtime:** Only 1 route explicitly configured: `app/api/dashboard/admin-bootstrap/route.ts` has `export const runtime = "nodejs"` (needs to be changed)

### 1.2 Route Inventory Summary

**Total Routes Identified:** 100+ routes

#### API Routes: ~80 routes
- Core CRUD operations (leads, campaigns, etc.)
- Payment processing (MyFatoorah, PSP, PUC fees, file fees, test fees)
- Webhook handlers (MyFatoorah, PSP, Finance, AI Transfer)
- WhatsApp integration (send, templates)
- Import/Export functionality
- Settings and configuration
- AI chat and document extraction
- PSP self-service portal
- LMS integration
- RSVP management
- Cron jobs

#### Page Routes: ~25 routes
- Authentication pages (login, register)
- Dashboard pages (main dashboard, leads, campaigns, reports, etc.)
- Marketing pages
- Error pages (error.tsx, global-error.tsx, not-found.tsx)

### 1.3 Current Runtime Configurations

**Found in codebase:**
- `export const dynamic = 'force-dynamic'` - Used in 5 routes
- `export const runtime = "nodejs"` - Used in 1 route (needs to be changed to "edge")
- **No Edge Runtime configurations** found in any other routes

---

## 2. Compatibility Analysis

### 2.1 Edge Runtime Compatible Features ✅

The following features are **fully compatible** with Edge Runtime:

- **Supabase Client:** `@supabase/ssr` and `@supabase/supabase-js` - fully compatible
- **Next.js APIs:** `NextRequest`, `NextResponse`, `cookies()`, `headers()` - native support
- **Fetch API:** All HTTP requests - native support
- **Crypto API:** `crypto.createHash()`, `crypto.timingSafeEqual()`, `Buffer` - available
- **JSON Processing:** Native support
- **Environment Variables:** `process.env` - supported
- **AI SDK:** `@ai-sdk/anthropic`, `@ai-sdk/openai` - Edge compatible
- **Rate Limiting:** `@upstash/ratelimit` and `@upstash/redis` - designed for Edge
- **Zod Validation:** Fully compatible
- **Date/Time APIs:** Native support

### 2.2 Edge Runtime Incompatible Features ⚠️

#### **Critical Incompatibilities:**

1. **nodemailer (Node.js only)**
   - **Location:** `app/api/leads/send-registration/route.ts`
   - **Impact:** Email sending functionality
   - **Solution:** Replace with Edge-compatible service (Resend, SendGrid, Postmark)

2. **xlsx library (Node.js only)**
   - **Location:** `app/api/export/route.ts`
   - **Impact:** Excel export functionality
   - **Solution:** Remove Excel option (keep CSV) or use external service

#### **Potentially Compatible (Needs Verification):**

3. **Twilio SDK**
   - **Location:** 10+ routes for WhatsApp messaging
   - **Status:** Should work with Edge Runtime (uses REST API internally)
   - **Action:** Test thoroughly, have REST API fallback ready

4. **AI Document Processing**
   - **Location:** `app/api/civil-id-extract/route.ts`
   - **Concern:** Large image processing, has `maxDuration = 30`
   - **Action:** Test Edge Runtime timeout limits

### 2.3 Routes Requiring Special Attention

#### **Must Fix Before Migration:**

1. **`/api/leads/send-registration`** - Replace nodemailer
2. **`/api/export`** - Handle xlsx dependency

#### **Test Thoroughly:**

1. All webhook routes (signature verification, external callbacks)
2. All WhatsApp routes (Twilio SDK compatibility)
3. Payment processing routes (critical business logic)
4. AI document extraction (timeout and size limits)

---

## 3. Migration Strategy

### 3.1 Recommended Approach: Phased Migration

**Phase 1: Preparation**
1. ✅ Analyze routes and dependencies (COMPLETE)
2. Fix incompatible dependencies (nodemailer, xlsx)
3. Set up Cloudflare Pages project
4. Configure environment variables

**Phase 2: Dependency Fixes**
1. Replace nodemailer with Resend or SendGrid
2. Remove Excel export or find alternative
3. Test replacements locally

**Phase 3: Add Edge Runtime Configuration**
1. Add `export const runtime = 'edge'` to all routes
2. Change the one `runtime = "nodejs"` to `runtime = "edge"`
3. Use automated script or manual batch approach

**Phase 4: Testing**
1. Local testing with Edge Runtime
2. Deploy to Cloudflare Pages preview
3. Comprehensive testing on preview
4. Performance benchmarking

**Phase 5: Production Deployment**
1. Deploy to production
2. Monitor closely for 24-48 hours
3. Address any issues immediately

### 3.2 Implementation Options

#### **Option A: Automated Script (Recommended)**

Create a script to add `export const runtime = 'edge'` to all route files:

**Pros:**
- Fast and consistent
- No files missed
- Easy to review with git diff

**Cons:**
- Less granular control
- May need manual adjustments

#### **Option B: Manual Batch Migration**

Migrate routes in logical batches:

**Pros:**
- More control
- Can test incrementally
- Easier to identify issues

**Cons:**
- Time-consuming
- Risk of missing files

#### **Recommendation:** Use automated script for adding runtime exports, but fix dependencies manually first.

---

## 4. Dependency Migration Plan

### 4.1 Email Service Migration (nodemailer → Resend)

**Current Implementation:**
```typescript
import * as nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  auth: { user: smtpUser, pass: smtpPass }
})

await transporter.sendMail({
  from: sender,
  to: recipient,
  subject: subject,
  html: htmlContent,
  attachments: attachments
})
```

**Recommended Replacement (Resend):**
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'noreply@yourdomain.com',
  to: recipient,
  subject: subject,
  html: htmlContent,
  attachments: attachments
})
```

**Steps:**
1. Install: `npm install resend`
2. Get API key from resend.com
3. Update `app/api/leads/send-registration/route.ts`
4. Add `RESEND_API_KEY` to environment variables
5. Test email sending

**Alternatives:** SendGrid, Postmark, AWS SES (all have Edge-compatible APIs)

### 4.2 Excel Export Migration

**Option 1: CSV Only (Simplest)**
- Remove Excel export option
- Keep CSV export (already implemented)
- Update UI to remove Excel button

**Option 2: External Service**
- Use Cloudflare Workers with Node.js compatibility
- Call external API for Excel generation

**Option 3: Client-Side Generation**
- Generate Excel files in the browser
- Use libraries like SheetJS (client-side)

**Recommendation:** Start with CSV-only approach for fastest migration.

### 4.3 Twilio SDK Verification

**Current Usage:** Twilio SDK used in 10+ routes

**Action Plan:**
1. Test Twilio SDK in Edge Runtime environment
2. If issues found, replace with direct REST API calls:

```typescript
const response = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: twilioNumber,
      To: recipientNumber,
      Body: message,
    }),
  }
)
```

---

## 5. Implementation Checklist

### 5.1 Pre-Migration Tasks

- [ ] Review and approve this migration plan
- [ ] Set up Cloudflare Pages project
- [ ] Configure environment variables in Cloudflare Pages
- [ ] Create feature branch: `edge-runtime-migration`
- [ ] Set up monitoring and alerting

### 5.2 Dependency Migration Tasks

- [ ] **Replace nodemailer**
  - [ ] Choose email service (Resend recommended)
  - [ ] Install package
  - [ ] Update `app/api/leads/send-registration/route.ts`
  - [ ] Add API key to environment variables
  - [ ] Test email sending locally
  
- [ ] **Handle Excel export**
  - [ ] Decision: CSV-only or alternative
  - [ ] Update `app/api/export/route.ts`
  - [ ] Update UI if removing Excel option
  - [ ] Test export functionality
  
- [ ] **Verify Twilio SDK**
  - [ ] Test in Edge Runtime environment
  - [ ] Prepare REST API fallback if needed
  - [ ] Test all WhatsApp routes

### 5.3 Add Edge Runtime Configuration

**Automated Script Approach:**

```javascript
// scripts/add-edge-runtime.mjs
import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'

async function findRouteFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      await findRouteFiles(path, files)
    } else if (entry.name === 'route.ts' || entry.name === 'page.tsx') {
      files.push(path)
    }
  }
  
  return files
}

async function addEdgeRuntime(filePath) {
  let content = await readFile(filePath, 'utf-8')
  
  // Skip if already has runtime export
  if (content.includes('export const runtime')) {
    // If it's "nodejs", change to "edge"
    if (content.includes('runtime = "nodejs"') || content.includes("runtime = 'nodejs'")) {
      content = content.replace(/runtime = ["']nodejs["']/, "runtime = 'edge'")
      await writeFile(filePath, content, 'utf-8')
      console.log(`✅ Changed nodejs to edge: ${filePath}`)
    } else {
      console.log(`⏭️  Skipping ${filePath} - already has edge runtime`)
    }
    return
  }
  
  // Find position after imports
  const lines = content.split('\n')
  let insertIndex = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('import ') || line.startsWith('import{')) {
      insertIndex = i + 1
    } else if (insertIndex > 0 && line && !line.startsWith('import')) {
      break
    }
  }
  
  // Insert runtime export
  lines.splice(insertIndex, 0, '', "export const runtime = 'edge'")
  
  await writeFile(filePath, lines.join('\n'), 'utf-8')
  console.log(`✅ Added edge runtime to ${filePath}`)
}

async function main() {
  const appDir = join(process.cwd(), 'app')
  const files = await findRouteFiles(appDir)
  
  console.log(`Found ${files.length} route files\n`)
  
  for (const file of files) {
    try {
      await addEdgeRuntime(file)
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message)
    }
  }
  
  console.log('\n✨ Migration complete!')
}

main().catch(console.error)
```

**Usage:**
```bash
node scripts/add-edge-runtime.mjs
```

**Manual Checklist:**
- [ ] Run automated script
- [ ] Review changes with `git diff`
- [ ] Verify all files updated correctly
- [ ] Commit changes

### 5.4 Testing Tasks

**Local Testing:**
- [ ] Run tests: `npm test`
- [ ] Run type checking: `npm run typecheck`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Manual testing of critical flows

**Cloudflare Pages Preview Testing:**
- [ ] Deploy to preview environment
- [ ] Test authentication (login/logout)
- [ ] Test lead management (create, update, delete)
- [ ] Test campaign management
- [ ] Test payment processing (test mode)
- [ ] Test WhatsApp messaging
- [ ] Test webhooks (use test payloads)
- [ ] Test CSV export
- [ ] Test AI chat functionality
- [ ] Test document upload and processing
- [ ] Test all settings pages

**Performance Testing:**
- [ ] Measure response times
- [ ] Check cold start times
- [ ] Monitor memory usage
- [ ] Compare with current performance

### 5.5 Deployment Tasks

- [ ] Merge feature branch to main
- [ ] Deploy to Cloudflare Pages production
- [ ] Monitor error rates for 24 hours
- [ ] Verify all critical functionality
- [ ] Update documentation
- [ ] Notify stakeholders of completion

---

## 6. Testing Strategy

### 6.1 Critical Test Cases

**Authentication:**
- [ ] User login with valid credentials
- [ ] User logout
- [ ] Session persistence
- [ ] Protected route access

**Lead Management:**
- [ ] Create new lead
- [ ] Update lead information
- [ ] Delete lead
- [ ] Search and filter leads
- [ ] Bulk import leads

**Payment Processing:**
- [ ] Create payment link
- [ ] Process cash payment
- [ ] Webhook handling (test mode)
- [ ] Receipt generation

**WhatsApp Integration:**
- [ ] Send WhatsApp message
- [ ] Send payment link via WhatsApp
- [ ] Send receipt via WhatsApp
- [ ] Template management

**Webhooks:**
- [ ] MyFatoorah webhook processing
- [ ] PSP webhook processing
- [ ] Finance webhook processing
- [ ] AI transfer webhook

**Export:**
- [ ] CSV export of leads
- [ ] Filter and export
- [ ] Large dataset export

### 6.2 Performance Benchmarks

**Target Metrics:**
- API response time: < 500ms (p95)
- Page load time: < 2s
- Cold start time: < 1s
- Error rate: < 0.5%

---

## 7. Risk Assessment

### 7.1 High-Risk Areas

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Payment processing failures | Critical | Low | Thorough testing, test mode first, rollback plan |
| Email delivery failures | High | Medium | Replace nodemailer before migration, extensive testing |
| Webhook signature verification issues | High | Low | Test with real payloads, verify crypto APIs work |
| WhatsApp messaging failures | High | Medium | Verify Twilio SDK compatibility, REST API fallback |
| Authentication system issues | Critical | Low | Comprehensive testing, monitor closely |
| Performance degradation | Medium | Medium | Benchmark before/after, optimize if needed |
| Edge Runtime timeout issues | Medium | Medium | Monitor long-running routes, optimize or split |

### 7.2 Success Criteria

**Must Have:**
- ✅ All routes deploy successfully to Cloudflare Pages
- ✅ Zero critical functionality broken
- ✅ Authentication works correctly
- ✅ Payment processing works (test and production)
- ✅ Webhooks process correctly
- ✅ No data loss or corruption

**Should Have:**
- ✅ Response times equal or better than current
- ✅ Error rates below 0.5%
- ✅ All tests passing
- ✅ CSV export working
- ✅ WhatsApp messaging working

---

## 8. Rollback Plan

### 8.1 Git Strategy

**Branch Structure:**
```
main (production)
  └── edge-runtime-migration (feature branch)
```

**Rollback Process:**
1. If issues in preview: revert commits on feature branch
2. If issues in production: revert merge commit
3. Redeploy previous working version

### 8.2 Monitoring & Alerts

**Set up alerts for:**
- Error rate > 1%
- Response time > 2s (p95)
- Failed webhook deliveries
- Failed payment processing
- Authentication failures

**Immediate rollback triggers:**
- Payment processing failures
- Authentication system failures
- Data corruption or loss

---

## 9. Post-Migration Tasks

### 9.1 Monitoring (Week 1)

- Monitor error rates hourly
- Check webhook delivery success rates
- Verify payment processing metrics
- Review user feedback
- Check performance metrics

### 9.2 Documentation Updates

- [ ] Update deployment documentation
- [ ] Document Edge Runtime configuration
- [ ] Update developer onboarding guide
- [ ] Create troubleshooting guide

### 9.3 Optimization Opportunities

After successful migration:
- Implement edge caching for static data
- Optimize database queries for Edge Runtime
- Add edge middleware for authentication
- Use Cloudflare KV for session storage
- Implement edge-based rate limiting

---

## 10. Key Resources

### 10.1 Documentation

- [Next.js Edge Runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Vercel Edge Runtime APIs](https://edge-runtime.vercel.app/)

### 10.2 Edge-Compatible Services

- **Email:** Resend, SendGrid, Postmark
- **Rate Limiting:** Upstash Redis
- **Storage:** Cloudflare R2, Supabase Storage
- **Database:** Supabase (already using)
- **AI:** Anthropic, OpenAI (already using)

---

## 11. Conclusion

This migration plan provides a comprehensive roadmap for transitioning the ktech-crm application to Cloudflare Pages with Edge Runtime.

**Key Success Factors:**
1. ✅ Fix incompatible dependencies first (nodemailer, xlsx)
2. ✅ Use automated script for consistent runtime configuration
3. ✅ Test thoroughly at each stage
4. ✅ Monitor closely during and after migration
5. ✅ Have a clear rollback plan ready

**Estimated Timeline:**
- Dependency fixes: 1 day
- Add Edge Runtime configuration: 2-3 hours (automated)
- Testing: 1-2 days
- Deployment and monitoring: 1 day
- **Total: 3-4 days**

**Next Steps:**
1. Review and approve this plan
2. Schedule migration timeline
3. Begin dependency fixes (nodemailer, xlsx)
4. Run automated script to add Edge Runtime configuration
5. Test thoroughly on Cloudflare Pages preview
6. Deploy to production with close monitoring

**Questions or Concerns:**
Please review this plan and provide feedback before proceeding with implementation.
