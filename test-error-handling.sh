#!/bin/bash

# Error Handling Verification Script for OpenAI Provider Integration
# This script tests various error scenarios to ensure proper error handling

set -e

echo "=========================================="
echo "Error Handling Verification Tests"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server URL
AI_ENDPOINT="http://localhost:3000/ai"

# Track test results
PASSED=0
FAILED=0

# Test helper functions
test_case() {
    local test_name="$1"
    local expected_status="$2"
    local test_command="$3"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Test: $test_name"
    echo "Expected: HTTP $expected_status"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if eval "$test_command"; then
        echo -e "${GREEN}✓ PASSED${NC}: $test_name"
        ((PASSED+=1))
    else
        echo -e "${RED}✗ FAILED${NC}: $test_name"
        ((FAILED+=1))
    fi
    echo ""
}

# Helper to check if response contains expected error message
check_error_message() {
    local response="$1"
    local expected_keyword="$2"

    if echo "$response" | grep -iq "$expected_keyword"; then
        return 0
    else
        return 1
    fi
}

echo "Pre-test Checks"
echo "───────────────"

# Check if server is running
if ! curl -s "$AI_ENDPOINT" > /dev/null 2>&1; then
    echo -e "${RED}✗ Server is not running on $AI_ENDPOINT${NC}"
    echo "Please start the server with: bun run dev:server"
    exit 1
fi

echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# ============================================================================
# Test 1: Invalid API Key
# ============================================================================
echo "=========================================="
echo "Test Category: Invalid API Key"
echo "=========================================="
echo ""

# Temporarily modify environment to use invalid key
# This test requires the server to be configured with an invalid key
echo "Note: This test requires temporarily setting OPENAI_API_KEY to an invalid key"
echo ""
echo "Manual Test Steps:"
echo "1. Stop the server"
echo "2. Set OPENAI_API_KEY=OPENAI_KEY_PLACEHOLDER in .env"
echo "3. Restart server"
echo "4. Run: curl -X POST $AI_ENDPOINT -H 'Content-Type: application/json' -d '{\"messages\":[{\"role\":\"user\",\"parts\":[{\"type\":\"text\",\"text\":\"Hello\"}]}]}'"
echo "5. Expected: 401 or 500 with 'Invalid API key' or 'Unauthorized' message"
echo ""
echo "For now, we'll skip this automated test as it requires server restart"
echo ""

# ============================================================================
# Test 2: Malformed Request
# ============================================================================
echo "=========================================="
echo "Test Category: Malformed Request"
echo "=========================================="
echo ""

# Test 2.1: Empty messages array
echo "Test 2.1: Empty messages array"
response=$(curl -s -w "\n%{http_code}" -X POST "$AI_ENDPOINT" \
    -H 'Content-Type: application/json' \
    -d '{"messages":[]}' 2>&1)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "HTTP Status: $http_code"
echo "Response: $body"

if [ "$http_code" = "400" ]; then
    if check_error_message "$body" "messages cannot be empty"; then
        echo -e "${GREEN}✓ PASSED${NC}: Correct error message for empty messages"
        ((PASSED+=1))
    else
        echo -e "${YELLOW}⚠ PARTIAL${NC}: Correct status code but unexpected message"
        ((PASSED+=1))
    fi
else
    echo -e "${RED}✗ FAILED${NC}: Expected 400, got $http_code"
    ((FAILED+=1))
fi
echo ""

# Test 2.2: Missing messages field
echo "Test 2.2: Missing messages field"
response=$(curl -s -w "\n%{http_code}" -X POST "$AI_ENDPOINT" \
    -H 'Content-Type: application/json' \
    -d '{}' 2>&1)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "HTTP Status: $http_code"
echo "Response: $body"

if [ "$http_code" = "400" ]; then
    if check_error_message "$body" "messages must be an array"; then
        echo -e "${GREEN}✓ PASSED${NC}: Correct error for missing messages"
        ((PASSED+=1))
    else
        echo -e "${YELLOW}⚠ PARTIAL${NC}: Correct status but unexpected message"
        ((PASSED+=1))
    fi
else
    echo -e "${RED}✗ FAILED${NC}: Expected 400, got $http_code"
    ((FAILED+=1))
fi
echo ""

# Test 2.3: Invalid message role
echo "Test 2.3: Invalid message role"
response=$(curl -s -w "\n%{http_code}" -X POST "$AI_ENDPOINT" \
    -H 'Content-Type: application/json' \
    -d '{"messages":[{"role":"invalid_role","parts":[{"type":"text","text":"Hello"}]}]}' 2>&1)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "HTTP Status: $http_code"
echo "Response: $body"

if [ "$http_code" = "400" ]; then
    if check_error_message "$body" "Invalid message role"; then
        echo -e "${GREEN}✓ PASSED${NC}: Correct error for invalid role"
        ((PASSED+=1))
    else
        echo -e "${YELLOW}⚠ PARTIAL${NC}: Correct status but unexpected message"
        ((PASSED+=1))
    fi
else
    echo -e "${RED}✗ FAILED${NC}: Expected 400, got $http_code"
    ((FAILED+=1))
fi
echo ""

# Test 2.4: Missing parts array
echo "Test 2.4: Missing parts array"
response=$(curl -s -w "\n%{http_code}" -X POST "$AI_ENDPOINT" \
    -H 'Content-Type: application/json' \
    -d '{"messages":[{"role":"user"}]}' 2>&1)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "HTTP Status: $http_code"
echo "Response: $body"

if [ "$http_code" = "400" ]; then
    if check_error_message "$body" "parts" && check_error_message "$body" "array"; then
        echo -e "${GREEN}✓ PASSED${NC}: Correct error for missing parts"
        ((PASSED+=1))
    else
        echo -e "${YELLOW}⚠ PARTIAL${NC}: Correct status but unexpected message"
        ((PASSED+=1))
    fi
else
    echo -e "${RED}✗ FAILED${NC}: Expected 400, got $http_code"
    ((FAILED+=1))
fi
echo ""

# ============================================================================
# Test 3: Network Errors
# ============================================================================
echo "=========================================="
echo "Test Category: Network Errors"
echo "=========================================="
echo ""

echo "Note: Network error testing requires:"
echo "1. Modifying OPENAI_BASE_URL to point to invalid endpoint"
echo "2. Blocking network access temporarily"
echo "3. These are manual tests"
echo ""
echo "Manual Test Steps for Network Errors:"
echo "1. Set OPENAI_BASE_URL=http://invalid-host-that-does-not-exist:9999"
echo "2. Restart server"
echo "3. Make request to /ai endpoint"
echo "4. Expected: Error message mentioning 'network' or 'connection'"
echo ""

# ============================================================================
# Test 4: Rate Limiting (Simulation)
# ============================================================================
echo "=========================================="
echo "Test Category: Rate Limiting"
echo "=========================================="
echo ""

echo "Note: Actual rate limit testing requires:"
echo "1. Making many rapid requests to trigger provider's rate limit"
echo "2. This can incur costs and may be difficult to trigger"
echo ""
echo "Manual Test Steps for Rate Limits:"
echo "1. Run rapid requests in a loop (with valid API key)"
echo "2. Monitor for 429 responses"
echo "3. Expected: 'Rate limit exceeded' message"
echo ""
echo "Example command:"
echo "  for i in {1..100}; do"
echo "    curl -X POST $AI_ENDPOINT -H 'Content-Type: application/json' \\"
echo "      -d '{\"messages\":[{\"role\":\"user\",\"parts\":[{\"type\":\"text\",\"text\":\"Test \$i\"}]}]}'"
echo "  done"
echo ""

# ============================================================================
# Summary
# ============================================================================
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "Automated Tests Passed: $PASSED"
echo "Automated Tests Failed: $FAILED"
echo ""
echo "Manual Tests Requiring Setup:"
echo "  - Invalid API Key (requires .env modification)"
echo "  - Network Errors (requires invalid endpoint or network blocking)"
echo "  - Rate Limiting (requires rapid requests or provider rate limit)"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All automated tests passed!${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Perform manual tests listed above"
    echo "2. Verify error messages are user-friendly"
    echo "3. Check console logs for proper error logging"
else
    echo -e "${RED}Some automated tests failed${NC}"
    echo "Please review the failures above"
fi

echo ""
echo "For comprehensive testing, also check:"
echo "  - Browser console for error handling"
echo "  - Frontend error UI displays"
echo "  - Server logs for error details (without sensitive data)"
