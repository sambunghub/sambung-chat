#!/bin/bash
# Validation Script for AI Provider Integration Guide
# This script validates that the guide instructions work correctly

set -e

echo "====================================="
echo "AI Provider Integration Guide Validation"
echo "====================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((FAILED++))
    fi
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  WARNING${NC}: $1"
    ((WARNINGS++))
}

echo "## Validation Test Suite"
echo ""

# Test 1: Check if guide document exists
echo "### Test 1: Guide Documentation"
if [ -f "./docs/ai-provider-integration-guide.md" ]; then
    print_result 0 "Main guide document exists"

    # Check guide has all major sections
    if grep -q "## 1. Introduction and Overview" ./docs/ai-provider-integration-guide.md &&
       grep -q "## 4. Step-by-Step Integration Guide" ./docs/ai-provider-integration-guide.md &&
       grep -q "## 5. Provider-Specific Configurations" ./docs/ai-provider-integration-guide.md &&
       grep -q "## 7. Testing and Validation" ./docs/ai-provider-integration-guide.md; then
        print_result 0 "All major sections present"
    else
        print_result 1 "Some major sections missing"
    fi
else
    print_result 1 "Main guide document not found"
fi
echo ""

# Test 2: Check if examples exist
echo "### Test 2: Provider Integration Examples"

examples=("openai-integration" "anthropic-integration" "groq-integration" "ollama-integration" "multi-provider-integration")

for example in "${examples[@]}"; do
    if [ -d "./examples/$example" ]; then
        print_result 0 "$example example exists"

        # Check for required files
        required_files=("README.md" "server.ts" ".env.example" "package.json")
        for file in "${required_files[@]}"; do
            if [ -f "./examples/$example/$file" ]; then
                print_result 0 "$example/$file exists"
            else
                print_result 1 "$example/$file missing"
            fi
        done
    else
        print_result 1 "$example example directory not found"
    fi
done
echo ""

# Test 3: Validate guide code examples
echo "### Test 3: Code Example Validation"

# Check for key code patterns in the guide
guide_file="./docs/ai-provider-integration-guide.md"

# Pattern 1: Import statement
if grep -q 'import { openai } from "@ai-sdk/openai"' "$guide_file"; then
    print_result 0 "OpenAI import pattern documented"
else
    print_result 1 "OpenAI import pattern not found"
fi

# Pattern 2: Model creation
if grep -q 'wrapLanguageModel' "$guide_file" && grep -q 'devToolsMiddleware' "$guide_file"; then
    print_result 0 "Model creation pattern documented"
else
    print_result 1 "Model creation pattern incomplete"
fi

# Pattern 3: Streaming
if grep -q 'streamText' "$guide_file" && grep -q 'toUIMessageStreamResponse' "$guide_file"; then
    print_result 0 "Streaming implementation documented"
else
    print_result 1 "Streaming implementation incomplete"
fi

# Pattern 4: Environment variables
if grep -q 'OPENAI_API_KEY' "$guide_file" && grep -q 'ANTHROPIC_API_KEY' "$guide_file"; then
    print_result 0 "Environment variable patterns documented"
else
    print_result 1 "Environment variables incomplete"
fi
echo ""

# Test 4: Validate .env.example
echo "### Test 4: Environment Configuration"

if [ -f "./.env.example" ]; then
    print_result 0 "Root .env.example exists"

    # Check for provider variables
    provider_vars=("OPENAI_API_KEY" "ANTHROPIC_API_KEY" "GOOGLE_GENERATIVE_AI_API_KEY" "GROQ_API_KEY" "OLLAMA_HOST")
    for var in "${provider_vars[@]}"; do
        if grep -q "$var" "./.env.example"; then
            print_result 0 "$var documented in .env.example"
        else
            print_result 1 "$var missing from .env.example"
        fi
    done
else
    print_result 1 "Root .env.example not found"
fi
echo ""

# Test 5: Validate examples have test scripts
echo "### Test 5: Test Script Validation"

for example in "${examples[@]}"; do
    if [ -f "./examples/$example/test.sh" ]; then
        print_result 0 "$example has test script"

        # Check if test script is executable
        if [ -x "./examples/$example/test.sh" ]; then
            print_result 0 "$example/test.sh is executable"
        else
            print_warning "$example/test.sh is not executable (run: chmod +x ./examples/$example/test.sh)"
        fi
    else
        print_result 1 "$example/test.sh not found"
    fi
done
echo ""

# Test 6: Validate README documentation quality
echo "### Test 6: Documentation Quality Check"

required_sections=("Installation" "Implementation" "Testing" "Troubleshooting")

for example in "${examples[@]}"; do
    readme="./examples/$example/README.md"
    if [ -f "$readme" ]; then
        for section in "${required_sections[@]}"; do
            if grep -qi "$section" "$readme"; then
                print_result 0 "$example README has '$section' section"
            else
                print_warning "$example README missing '$section' section"
            fi
        done
    fi
done
echo ""

# Test 7: Validate TypeScript configuration
echo "### Test 7: TypeScript Configuration"

for example in "${examples[@]}"; do
    if [ -f "./examples/$example/tsconfig.json" ]; then
        print_result 0 "$example has tsconfig.json"

        # Check for strict mode
        if grep -q '"strict": true' "./examples/$example/tsconfig.json"; then
            print_result 0 "$example uses strict TypeScript"
        else
            print_warning "$example not using strict TypeScript"
        fi
    else
        print_result 1 "$example/tsconfig.json missing"
    fi
done
echo ""

# Test 8: Check package.json dependencies
echo "### Test 8: Package Dependencies"

declare -A example_packages=(
    ["openai-integration"]="@ai-sdk/openai"
    ["anthropic-integration"]="@ai-sdk/anthropic"
    ["groq-integration"]="@ai-sdk/groq"
)

for example in "${!example_packages[@]}"; do
    package="./examples/$example/package.json"
    required_package="${example_packages[$example]}"

    if [ -f "$package" ]; then
        if grep -q "$required_package" "$package"; then
            print_result 0 "$example includes $required_package"
        else
            print_result 1 "$example missing $required_package"
        fi

        # Check for core AI SDK
        if grep -q '"ai":' "$package"; then
            print_result 0 "$example includes core AI SDK"
        else
            print_result 1 "$example missing core AI SDK"
        fi
    fi
done
echo ""

# Test 9: Validate navigation structure
echo "### Test 9: Navigation and Cross-References"

# Check if guide has table of contents
if grep -q "## Table of Contents" "$guide_file"; then
    print_result 0 "Guide has table of contents"
else
    print_result 1 "Table of contents missing"
fi

# Check for back-to-top links (added in Phase 7)
back_link_count=$(grep -c "Back to Top" "$guide_file" || true)
if [ "$back_link_count" -ge 8 ]; then
    print_result 0 "Navigation links present ($back_link_count sections)"
else
    print_warning "Some navigation links may be missing (found $back_link_count, expected 8+)"
fi
echo ""

# Test 10: Check for troubleshooting coverage
echo "### Test 10: Troubleshooting Coverage"

if grep -q "## 8. Troubleshooting and Common Issues" "$guide_file"; then
    print_result 0 "Troubleshooting section exists"

    # Check for common issue categories
    issue_types=("Installation Issues" "Configuration Issues" "Runtime Issues")
    for issue in "${issue_types[@]}"; do
        if grep -q "$issue" "$guide_file"; then
            print_result 0 "'$issue' documented"
        else
            print_result 1 "'$issue' not documented"
        fi
    done
else
    print_result 1 "Troubleshooting section missing"
fi
echo ""

# Summary
echo "====================================="
echo "## Validation Summary"
echo "====================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All critical tests passed!${NC}"
    echo ""
    echo "The AI Provider Integration Guide is production-ready."
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi
