# Deployment Guide

## Prerequisites

1. MySQL database (compatible with Prisma)
2. Kassal.app API key
3. Node.js 18+ environment

## Environment Variables

Create a `.env` file with:

```bash
DATABASE_URL="mysql://user:password@host:port/database"
KASSE_LAPPEN_API_KEY="your-api-key"
NODE_ENV="production"
REVALIDATION_SECRET="strong-random-string"
```

## Vercel Deployment

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all required variables

4. **Configure Cron Jobs:**
   - Cron jobs are configured in `vercel.json`
   - They run automatically on Vercel

## Database Setup

1. **Run Migrations:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

2. **Apply Indexes (Optional but recommended):**
   ```sql
   CREATE INDEX idx_product_ean ON Product(ean);
   CREATE INDEX idx_product_store ON Product(store);
   CREATE INDEX idx_product_updated_at ON Product(updatedAt);
   CREATE INDEX idx_ean_response_processed ON EanResponeDtos(processed);
   ```

## Monitoring

1. **Check Logs:**
   - Vercel Dashboard → Functions → Logs
   - Monitor cron job execution

2. **Error Tracking:**
   - All errors include unique IDs
   - Check logs for error details

## Performance Optimization

1. **Enable ISR:**
   - Homepage uses 30-minute revalidation
   - Manual revalidation via `/api/revalidate?secret=YOUR_SECRET`

2. **Caching:**
   - In-memory caching enabled by default
   - Consider Redis for multi-instance deployments

## Security Checklist

- [ ] Strong REVALIDATION_SECRET set
- [ ] Database credentials secure
- [ ] API key not exposed in client code
- [ ] Rate limiting active
- [ ] Error messages don't expose sensitive data