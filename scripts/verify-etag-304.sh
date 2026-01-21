#!/bin/bash
# ETag and 304 Not Modified Verification Script
# This script tests the ETag generation and 304 Not Modified response functionality

set -e

echo "=== ETag and 304 Not Modified Verification ==="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo "Checking if server is running..."
if ! curl -s http://localhost:3000/ > /dev/null 2>&1; then
  echo -e "${RED}✗ Server is not running${NC}"
  echo "Please start the server first:"
  echo "  cd apps/server && bun run dev"
  exit 1
fi

echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Test endpoints to verify
ENDPOINTS=(
  "http://localhost:3000/rpc/folder/getAll"
  "http://localhost:3000/rpc/model/getAll"
  "http://localhost:3000/rpc/chat/getAll"
)

for endpoint in "${ENDPOINTS[@]}"; do
  echo "Testing: $endpoint"
  echo "---"

  # Step 1: Make initial request to get ETag
  echo "1. Making initial request to get ETag..."
  response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Cookie: connect.sid=test" \
    -d '{}' \
    -i \
    "$endpoint" 2>&1)

  # Extract ETag from response
  etag=$(echo "$response" | grep -i "^etag:" | sed 's/ETag: //i' | tr -d '\r')

  if [ -z "$etag" ]; then
    echo -e "${RED}✗ No ETag found in response${NC}"
    echo ""
    continue
  fi

  echo -e "${GREEN}✓ ETag received: $etag${NC}"

  # Extract Cache-Control header
  cache_control=$(echo "$response" | grep -i "^cache-control:" | sed 's/Cache-Control: //i' | tr -d '\r')
  echo -e "${GREEN}✓ Cache-Control: $cache_control${NC}"
  echo ""

  # Step 2: Make conditional request with If-None-Match
  echo "2. Making conditional request with If-None-Match: $etag"
  conditional_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "If-None-Match: $etag" \
    -H "Cookie: connect.sid=test" \
    -d '{}' \
    -i \
    -w "\n%{http_code}" \
    "$endpoint" 2>&1)

  http_code=$(echo "$conditional_response" | tail -n 1)

  if [ "$http_code" = "304" ]; then
    echo -e "${GREEN}✓ 304 Not Modified response received${NC}"
  else
    echo -e "${RED}✗ Expected 304, got $http_code${NC}"
    echo "Response headers:"
    echo "$conditional_response" | head -n 20
  fi

  echo ""
  echo "3. Testing with invalid ETag (should return fresh data)..."
  invalid_etag='"invalid-etag-12345"'
  fresh_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "If-None-Match: $invalid_etag" \
    -H "Cookie: connect.sid=test" \
    -d '{}' \
    -i \
    -w "\n%{http_code}" \
    "$endpoint" 2>&1)

  fresh_http_code=$(echo "$fresh_response" | tail -n 1)

  if [ "$fresh_http_code" = "200" ]; then
    echo -e "${GREEN}✓ 200 OK response received (fresh data)${NC}"
  else
    echo -e "${RED}✗ Expected 200, got $fresh_http_code${NC}"
  fi

  echo ""
  echo "========================================"
  echo ""
done

echo "=== Verification Complete ==="
echo ""
echo "Summary:"
echo "- All endpoints should return ETag headers"
echo "- Conditional requests with matching ETag should return 304 Not Modified"
echo "- Conditional requests with non-matching ETag should return 200 OK with fresh data"
echo "- Cache-Control headers should be present with appropriate max-age values"
