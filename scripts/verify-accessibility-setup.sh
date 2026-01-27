#!/bin/bash
# Accessibility Testing Setup Verification Script
# This script verifies that all accessibility testing tools are properly configured

set -e

echo "🔍 Verifying Accessibility Testing Setup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check 1: Package dependencies
echo "1. Checking package dependencies..."
echo ""

if command -v bun &> /dev/null; then
    print_status 0 "Bun is installed"

    # Check jest-axe
    if bun pm ls | grep -q "jest-axe"; then
        print_status 0 "jest-axe is installed"
    else
        print_status 1 "jest-axe is NOT installed"
    fi

    # Check @axe-core/playwright
    if bun pm ls | grep -q "@axe-core/playwright"; then
        print_status 0 "@axe-core/playwright is installed"
    else
        print_status 1 "@axe-core/playwright is NOT installed"
    fi

    # Check @lhci/cli
    if bun pm ls | grep -q "@lhci/cli"; then
        print_status 0 "@lhci/cli (Lighthouse CI) is installed"
    else
        print_status 1 "@lhci/cli is NOT installed"
    fi

    # Check @playwright/test
    if bun pm ls | grep -q "@playwright/test"; then
        print_status 0 "@playwright/test is installed"
    else
        print_status 1 "@playwright/test is NOT installed"
    fi

    # Check vitest
    if bun pm ls | grep -q "vitest"; then
        print_status 0 "vitest is installed"
    else
        print_status 1 "vitest is NOT installed"
    fi
else
    print_status 1 "Bun is NOT installed"
fi

echo ""

# Check 2: Configuration files
echo "2. Checking configuration files..."
echo ""

[ -f "tests/accessibility/setup.ts" ] && print_status 0 "tests/accessibility/setup.ts exists" || print_status 1 "tests/accessibility/setup.ts missing"
[ -f "tests/accessibility/vitest.config.ts" ] && print_status 0 "tests/accessibility/vitest.config.ts exists" || print_status 1 "tests/accessibility/vitest.config.ts missing"
[ -f "tests/accessibility/components.spec.ts" ] && print_status 0 "tests/accessibility/components.spec.ts exists" || print_status 1 "tests/accessibility/components.spec.ts missing"
[ -f "tests/e2e/accessibility.spec.ts" ] && print_status 0 "tests/e2e/accessibility.spec.ts exists" || print_status 1 "tests/e2e/accessibility.spec.ts missing"
[ -f "lighthouserc.json" ] && print_status 0 "lighthouserc.json exists" || print_status 1 "lighthouserc.json missing"

echo ""

# Check 3: NPM scripts
echo "3. Checking npm scripts..."
echo ""

if grep -q '"test:axe"' package.json; then
    print_status 0 "test:axe script exists"
else
    print_status 1 "test:axe script missing"
fi

if grep -q '"test:axe:watch"' package.json; then
    print_status 0 "test:axe:watch script exists"
else
    print_status 1 "test:axe:watch script missing"
fi

if grep -q '"test:lighthouse"' package.json; then
    print_status 0 "test:lighthouse script exists"
else
    print_status 1 "test:lighthouse script missing"
fi

if grep -q '"test:a11y"' package.json; then
    print_status 0 "test:a11y script exists"
else
    print_status 1 "test:a11y script missing"
fi

echo ""

# Check 4: Documentation
echo "4. Checking documentation..."
echo ""

[ -f "tests/accessibility/README.md" ] && print_status 0 "tests/accessibility/README.md exists" || print_status 1 "tests/accessibility/README.md missing"
[ -f "tests/accessibility/QUICK_START.md" ] && print_status 0 "tests/accessibility/QUICK_START.md exists" || print_status 1 "tests/accessibility/QUICK_START.md missing"
[ -f "scripts/accessibility-setup-guide.md" ] && print_status 0 "scripts/accessibility-setup-guide.md exists" || print_warning "scripts/accessibility-setup-guide.md missing (optional)"

echo ""

# Check 5: Playwright browsers
echo "5. Checking Playwright browsers..."
echo ""

if [ -d "node_modules/playwright" ]; then
    print_status 0 "Playwright is installed"

    if command -v npx &> /dev/null; then
        if npx playwright --version &> /dev/null; then
            print_status 0 "Playwright CLI is available"
            echo ""
            echo "   Note: Run 'bunx playwright install' to install browser binaries if not already installed"
        else
            print_warning "Playwright CLI not found - run 'bunx playwright install'"
        fi
    else
        print_warning "npx not available - cannot verify Playwright installation"
    fi
else
    print_warning "Playwright not fully installed"
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}🎉 Accessibility Testing Setup Verification Complete!${NC}"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Install Playwright browsers (if not already installed):"
echo "   bunx playwright install"
echo ""
echo "2. Run accessibility tests:"
echo "   bun run test:a11y"
echo ""
echo "3. Run individual tools:"
echo "   - Component tests: bun run test:axe"
echo "   - E2E tests: bun run test:e2e tests/e2e/accessibility.spec.ts"
echo "   - Lighthouse: bun run test:lighthouse"
echo ""
echo "4. Manual testing with WAVE:"
echo "   Install WAVE browser extension:"
echo "   - Chrome: https://chrome.google.com/webstore/detail/wave-evaluation-tool/"
echo "   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/wave-accessibility-tool/"
echo ""
echo "📖 Documentation:"
echo "   - Quick Start: tests/accessibility/QUICK_START.md"
echo "   - Full Guide: tests/accessibility/README.md"
echo "   - WAVE Setup: scripts/accessibility-setup-guide.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
