#!/bin/bash

# Ollama Integration Test Script
# Tests the Ollama provider integration

set -e

BASE_URL="${BASE_URL:-http://localhost:3001}"
echo "🦙 Testing Ollama Integration at $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: $2"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ FAIL${NC}: $2"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# Test 1: Health check
echo "Test 1: Health check endpoint"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  provider=$(echo "$body" | grep -o '"provider":"[^"]*"' | cut -d'"' -f4)
  if [ "$provider" = "ollama" ]; then
    print_result 0 "Health check returns Ollama provider"
  else
    print_result 1 "Health check provider incorrect: $provider"
  fi
else
  print_result 1 "Health check failed with HTTP $http_code"
fi
echo ""

# Test 2: Models endpoint
echo "Test 2: Available models endpoint"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/ai/models")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  model_count=$(echo "$body" | grep -o '"id":' | wc -l)
  print_result 0 "Models endpoint returns $model_count models"
else
  print_result 1 "Models endpoint failed with HTTP $http_code"
fi
echo ""

# Test 3: Simple AI request
echo "Test 3: Simple AI request (hello)"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/ai" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Say hello and nothing else"}
    ]
  }' \
  --max-time 60)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
  print_result 0 "Simple AI request successful"
else
  print_result 1 "Simple AI request failed with HTTP $http_code"
  echo "Response: $(echo "$response" | sed '$d')"
fi
echo ""

# Test 4: Multi-turn conversation
echo "Test 4: Multi-turn conversation"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/ai" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "My name is Alice"},
      {"role": "assistant", "content": "Hello Alice!"},
      {"role": "user", "content": "What is my name?"}
    ]
  }' \
  --max-time 60)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
  print_result 0 "Multi-turn conversation successful"
else
  print_result 1 "Multi-turn conversation failed with HTTP $http_code"
fi
echo ""

# Test 5: Error handling - Empty messages
echo "Test 5: Error handling (empty messages)"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/ai" \
  -H "Content-Type: application/json" \
  -d '{"messages": []}')
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "400" ]; then
  print_result 0 "Empty messages returns 400 error"
else
  print_result 1 "Empty messages should return 400, got $http_code"
fi
echo ""

# Test 6: Error handling - Invalid format
echo "Test 6: Error handling (invalid format)"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/ai" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}')
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "400" ]; then
  print_result 0 "Invalid format returns 400 error"
else
  print_result 1 "Invalid format should return 400, got $http_code"
fi
echo ""

# Test 7: Long message handling
echo "Test 7: Long message handling (1000 characters)"
long_message=$(python3 -c "print('A' * 1000)")
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/ai" \
  -H "Content-Type: application/json" \
  -d "{
    \"messages\": [
      {\"role\": \"user\", \"content\": \"Count these characters: $long_message\"}
    ]
  }" \
  --max-time 60)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
  print_result 0 "Long message handled successfully"
else
  print_result 1 "Long message failed with HTTP $http_code"
fi
echo ""

# Test 8: Special characters
echo "Test 8: Special characters and Unicode"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/ai" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Test these characters: 🎉 <script> & \"quotes\""}
    ]
  }' \
  --max-time 60)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
  print_result 0 "Special characters handled successfully"
else
  print_result 1 "Special characters failed with HTTP $http_code"
fi
echo ""

# Summary
echo ""
echo "═══════════════════════════════════════════════════"
echo "📊 Test Summary"
echo "═══════════════════════════════════════════════════"
echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
echo "═══════════════════════════════════════════════════"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  echo ""
  echo "🦙 Ollama is ready to use!"
  echo "🚀 Enjoy local AI with privacy!"
  exit 0
else
  echo -e "${RED}⚠️  Some tests failed${NC}"
  echo ""
  echo "💡 Troubleshooting tips:"
  echo "   - Make sure Ollama is running: ollama serve"
  echo "   - Make sure the model is pulled: ollama pull llama3.2"
  echo "   - Check Ollama status: ollama list"
  exit 1
fi
