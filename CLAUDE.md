# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Taco Fredag is a Next.js web application that helps Norwegian users find the cheapest grocery store for buying taco ingredients. It fetches product data from the Kassal.app API, processes it, and displays a price comparison across different stores.

## Common Commands

```bash
# Development
npm run dev          # Start Next.js development server

# Code Quality
npm run lint         # Run Biome linter
npm run format       # Format code with Biome
npm run typecheck    # Run TypeScript type checking

# Building
npm run build        # Build for production
npm run start        # Start production server

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes to database
npx prisma studio    # Open Prisma Studio GUI
```

## Architecture

### Core Data Flow
1. **Data Ingestion**: Cron jobs (`/api/cron/`) fetch product data from Kassal.app API for specific EAN codes
2. **Processing**: Raw API responses stored in `EanResponeDtos`, then processed into `Product` records
3. **Price Calculation**: `getCartPrices()` in `src/server/api/cart.ts` calculates total cart prices per store
4. **Display**: Homepage shows products and store rankings with ISR (30-minute revalidation)

### Key Files
- `src/server/api/cart.ts` - Core price comparison logic
- `src/pages/api/cron/storeDataFromKasseLappenAPI.ts` - Fetches product data
- `src/pages/api/cron/processDataFromKasseLappenApiPayloads.ts` - Processes fetched data
- `src/pages/index.tsx` - Main UI displaying cart and store comparisons

### Tech Stack Specifics
- **Styling**: Tailwind CSS v4 with custom taco pattern background
- **API**: tRPC for type-safe API calls between frontend and backend
- **Database**: MySQL with Prisma ORM (relationMode: "prisma" for serverless)
- **State Management**: React Query via tRPC hooks
- **Deployment**: Optimized for Vercel with standalone output

### Product Tracking
The app tracks 10 specific taco products by EAN codes defined in the cron job. When adding new products, update the EAN list in `storeDataFromKasseLappenAPI.ts`.

### Environment Variables
Required in `.env`:
- `DATABASE_URL` - MySQL connection string
- `VERCEL_URL` - Set automatically by Vercel (used for API URLs)

### Important Patterns
- All prices are stored in NOK (Norwegian Kroner)
- Missing products use average price across stores as fallback
- Store comparison shows price offset from cheapest option
- Norwegian language throughout the UI