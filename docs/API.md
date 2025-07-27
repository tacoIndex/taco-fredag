# API Documentation

## Overview

Taco Fredag uses Next.js API routes and tRPC for backend functionality.

## Cron Jobs

### Store Data from KassaLappen API

**Endpoint:** `/api/cron/storeDataFromKasseLappenAPI`  
**Method:** GET  
**Schedule:** Daily at 5:00 AM  

Fetches product data for predefined EAN codes from the Kassal.app API.

**Response:**
```json
{
  "message": "Success!" | "Partial success",
  "processed": number,
  "failed"?: number
}
```

### Process Data from KassaLappen API

**Endpoint:** `/api/cron/processDataFromKasseLappenApiPayloads`  
**Method:** GET  
**Schedule:** Daily at 6:00 AM  

Processes stored API responses and updates product records.

## Revalidation

**Endpoint:** `/api/revalidate`  
**Method:** GET  
**Query Parameters:**
- `secret`: Revalidation secret (must match REVALIDATION_SECRET env var)

Triggers on-demand ISR revalidation of the homepage.

## Internal APIs

### getCartPrices()

Calculates total cart prices for each store, including handling of missing products.

**Returns:**
```typescript
interface StorePrice {
  name: string;
  price: number;
  offset: number; // Price difference from cheapest store
}
```

### getUniqueProducts()

Returns unique products (one per EAN) for display.

## Error Handling

All API endpoints include comprehensive error handling with:
- Structured error responses
- Error IDs for tracking
- Appropriate HTTP status codes
- Logging for debugging

## Rate Limiting

- General API endpoints: 30 requests per minute
- Cron endpoints: 5 requests per hour

## Caching

- ISR: Page statically generated and revalidated every 30 minutes
- No runtime caching needed since data updates only once daily via cron jobs