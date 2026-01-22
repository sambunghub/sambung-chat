# ETag and 304 Not Modified Verification

## Overview

This document describes the manual verification process for ETag generation and 304 Not Modified responses as part of subtask-4-2.

## Prerequisites

### 1. Database Setup

Start PostgreSQL database:

```bash
bun run db:start
```

Verify database is running:

```bash
docker ps | grep postgres
```

### 2. Environment Configuration

Ensure the following environment variables are set (create `apps/server/.env` if needed):

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/sambung-chat
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
ENCRYPTION_KEY=<generate with: openssl rand -base64 32>
```

### 3. Server Startup

Start the development server:

```bash
cd apps/server
bun run dev
```

Verify server is running:

```bash
curl http://localhost:3000/
# Should return: OK
```

## Manual Verification Steps

### Option 1: Automated Verification Script

Run the provided verification script:

```bash
./scripts/verify-etag-304.sh
```

This script will:

- Check if the server is running
- Test multiple endpoints (folder.getAll, model.getAll, chat.getAll)
- Verify ETag generation
- Test 304 Not Modified responses
- Test fresh data returns for invalid ETags

### Option 2: Manual curl Testing

#### Step 1: Initial Request (Get ETag)

```bash
curl -i -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=test" \
  -d '{}' \
  http://localhost:3000/rpc/folder/getAll
```

**Expected Response Headers:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: private, max-age=900, no-transform
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

Note the `ETag` header value.

#### Step 2: Conditional Request (Matching ETag)

Replace `<etag>` with the actual ETag value from Step 1:

```bash
curl -i -X POST \
  -H "Content-Type: application/json" \
  -H "If-None-Match: <etag>" \
  -H "Cookie: connect.sid=test" \
  -d '{}' \
  http://localhost:3000/rpc/folder/getAll
```

**Expected Response:**

```http
HTTP/1.1 304 Not Modified
Cache-Control: private, max-age=900, no-transform
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

**Important:** Response body should be empty (0 bytes).

#### Step 3: Conditional Request (Non-Matching ETag)

```bash
curl -i -X POST \
  -H "Content-Type: application/json" \
  -H "If-None-Match: \"invalid-etag-12345\"" \
  -H "Cookie: connect.sid=test" \
  -d '{}' \
  http://localhost:3000/rpc/folder/getAll
```

**Expected Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: private, max-age=900, no-transform
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"

{...response data...}
```

Should return fresh data (full response body).

## Test Endpoints

### 1. folder.getAll

- **Cache Duration:** 900 seconds (15 minutes)
- **Expected Cache-Control:** `private, max-age=900, no-transform`
- **Should ETag:** Yes
- **Should support 304:** Yes

### 2. model.getAll

- **Cache Duration:** 300 seconds (5 minutes)
- **Expected Cache-Control:** `private, max-age=300, no-transform`
- **Should ETag:** Yes
- **Should support 304:** Yes

### 3. chat.getAll

- **Cache Duration:** 60 seconds (1 minute)
- **Expected Cache-Control:** `private, max-age=60, no-transform`
- **Should ETag:** Yes
- **Should support 304:** Yes

## Success Criteria

✅ **ETag Generation:**

- All endpoints return `ETag` header in response
- ETag format is valid (quoted string)
- ETag is consistent for the same data

✅ **304 Not Modified:**

- Matching ETag returns `304 Not Modified` status
- Response body is empty for 304 responses
- Cache-Control and ETag headers are still present in 304 response

✅ **Fresh Data:**

- Non-matching ETag returns `200 OK` status
- Response body contains fresh data
- New ETag is generated if data changed

✅ **Cache-Control Headers:**

- All endpoints return `Cache-Control` header
- Correct max-age value for each endpoint
- Includes `private` and `no-transform` directives

## Common Issues

### Issue 1: Server returns 401 Unauthorized

**Cause:** Missing authentication cookie

**Solution:** The endpoints require authentication. You may need to:

1. Sign in through the web interface first
2. Extract the session cookie from browser DevTools
3. Use the cookie in curl requests

### Issue 2: No ETag header in response

**Cause:** Cache middleware not applied or not working

**Solution:**

- Verify `cacheHeadersMiddleware` is applied to the procedure
- Check server logs for errors
- Verify TypeScript compilation succeeded: `bun run check:types`

### Issue 3: 304 response includes response body

**Cause:** Server middleware not handling 304 correctly

**Solution:**

- Verify `extractCacheMetadata()` in server index.ts
- Check that response body is emptied when `_orpcCacheStatus === "hit"`

### Issue 4: ETag changes for identical data

**Cause:** ETag generation includes timestamp or non-deterministic data

**Solution:**

- Review ETag generation in `generateETag()` function
- Ensure only response data is hashed, not metadata

## Browser DevTools Verification

You can also verify caching in the browser:

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Navigate to `http://localhost:5174/app`
4. Look for requests to `/rpc/folder/getAll`, `/rpc/model/getAll`
5. Check Response Headers:
   - `Cache-Control: private, max-age=...`
   - `ETag: "..."`
6. Reload the page
7. Second request should show:
   - Status: `304 Not Modified`
   - Size: smaller than first request (from cache)

## Documentation

After successful verification, update the implementation plan:

```json
{
  "id": "subtask-4-2",
  "status": "completed",
  "notes": "Verified ETag generation and 304 Not Modified responses work correctly..."
}
```

## References

- Implementation: `packages/api/src/middleware/cache-headers.ts`
- Server integration: `apps/server/src/index.ts`
- Test suite: `tests/e2e/orpc-caching.spec.ts`
- RFC 7232: HTTP Conditional Requests (ETag, If-None-Match)
- RFC 7234: HTTP Caching
