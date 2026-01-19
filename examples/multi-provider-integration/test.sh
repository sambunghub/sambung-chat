#!/bin/bash

# Multi-Provider Integration Test Suite
# Tests the provider abstraction pattern and easy switching

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BASE_URL="${BASE_URL:-http://localhost:3001}"
PROVIDER="${AI_PROVIDER:-openai}"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"
}

print_test() {
    echo -e "${YELLOW}Test $((TOTAL_TESTS + 1)): $1${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

print_pass() {
    echo -e "${GREEN}✅ PASS: $1${NC}\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

print_fail() {
    echo -e "${RED}❌ FAIL: $1${NC}\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Start testing
print_header "Multi-Provider Integration Test Suite"
print_info "Base URL: $BASE_URL"
print_info "Provider: $PROVIDER"
print_info "Starting tests...\n"

# Test 1: Health check endpoint
print_test "Health check endpoint"
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    print_pass "Health check returned status ok"
    print_info "Response: $(echo "$HEALTH_RESPONSE" | grep -o '"provider":"[^"]*"' | cut -d'"' -f4)"
else
    print_fail "Health check failed"
fi

# Test 2: Providers endpoint
print_test "Providers endpoint"
PROVIDERS_RESPONSE=$(curl -s "$BASE_URL/ai/providers")
if echo "$PROVIDERS_RESPONSE" | grep -q '"active"'; then
    ACTIVE_PROVIDER=$(echo "$PROVIDERS_RESPONSE" | grep -o '"active":"[^"]*"' | cut -d'"' -f4)
    print_pass "Providers endpoint returned active provider: $ACTIVE_PROVIDER"
else
    print_fail "Providers endpoint failed"
fi

# Test 3: Models endpoint
print_test "Models endpoint"
MODELS_RESPONSE=$(curl -s "$BASE_URL/ai/models")
if echo "$MODELS_RESPONSE" | grep -q '"provider"'; then
    MODEL_PROVIDER=$(echo "$MODELS_RESPONSE" | grep -o '"provider":"[^"]*"' | cut -d'"' -f4)
    print_pass "Models endpoint returned provider: $MODEL_PROVIDER"
else
    print_fail "Models endpoint failed"
fi

# Test 4: Simple AI request
print_test "Simple AI request"
AI_RESPONSE=$(curl -s -X POST "$BASE_URL/ai" \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"What is 2+2? Answer with just the number."}]}')

if echo "$AI_RESPONSE" | grep -q "4"; then
    print_pass "AI request returned correct answer"
else
    print_fail "AI request did not return expected answer"
    print_info "Response: $AI_RESPONSE"
fi

# Test 5: Multi-turn conversation
print_test "Multi-turn conversation"
MULTI_TURN_RESPONSE=$(curl -s -X POST "$BASE_URL/ai" \
    -H "Content-Type: application/json" \
    -d '{
        "messages": [
            {"role": "user", "content": "My name is Alice"},
            {"role": "assistant", "content": "Hello Alice!"},
            {"role": "user", "content": "What is my name?"}
        ]
    }')

if echo "$MULTI_TURN_RESPONSE" | grep -iq "alice"; then
    print_pass "Multi-turn conversation maintained context"
else
    print_fail "Multi-turn conversation did not maintain context"
fi

# Test 6: Error handling - empty messages
print_test "Error handling - empty messages"
ERROR_RESPONSE=$(curl -s -X POST "$BASE_URL/ai" \
    -H "Content-Type: application/json" \
    -d '{"messages":[]}')

if echo "$ERROR_RESPONSE" | grep -q '"error"'; then
    print_pass "Empty messages error handled correctly"
else
    print_fail "Empty messages error not handled"
fi

# Test 7: Error handling - invalid format
print_test "Error handling - invalid format"
INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/ai" \
    -H "Content-Type: application/json" \
    -d '{"invalid":"format"}')

if echo "$INVALID_RESPONSE" | grep -q '"error"'; then
    print_pass "Invalid format error handled correctly"
else
    print_fail "Invalid format error not handled"
fi

# Test 8: Long message handling
print_test "Long message handling"
LONG_MESSAGE="Please repeat the word 'test' 10 times: "
for i in {1..10}; do
    LONG_MESSAGE+="test "
done

LONG_RESPONSE=$(curl -s -X POST "$BASE_URL/ai" \
    -H "Content-Type: application/json" \
    -d "{\"messages\":[{\"role\":\"user\",\"content\":\"$LONG_MESSAGE\"}]}")

if echo "$LONG_RESPONSE" | grep -q "test"; then
    print_pass "Long message handled correctly"
else
    print_fail "Long message not handled correctly"
fi

# Test 9: Special characters and Unicode
print_test "Special characters and Unicode"
UNICODE_RESPONSE=$(curl -s -X POST "$BASE_URL/ai" \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"Say hello in Japanese: こんにちは"}]}')

if echo "$UNICODE_RESPONSE" | grep -q "."; then
    print_pass "Unicode characters handled correctly"
else
    print_fail "Unicode characters not handled"
fi

# Test 10: Provider information
print_test "Provider information extraction"
PROVIDER_INFO=$(curl -s "$BASE_URL/health")
if echo "$PROVIDER_INFO" | grep -q '"provider"' && echo "$PROVIDER_INFO" | grep -q '"model"'; then
    PROVIDER_NAME=$(echo "$PROVIDER_INFO" | grep -o '"provider":"[^"]*"' | cut -d'"' -f4)
    MODEL_NAME=$(echo "$PROVIDER_INFO" | grep -o '"model":"[^"]*"' | cut -d'"' -f4)
    print_pass "Provider info extracted: $PROVIDER_NAME / $MODEL_NAME"
else
    print_fail "Provider information not extracted"
fi

# Summary
print_header "Test Summary"
echo -e "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}\n"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please check the output above.${NC}\n"
    exit 1
fi
