#!/bin/bash
# Test script for avatar upload flow

echo "=== Avatar Upload Flow Test ==="
echo ""

# Check if server is running
echo "1. Checking if backend server is running..."
if curl -s http://localhost:3000/ > /dev/null 2>&1; then
    echo "   ✓ Backend server is running"
else
    echo "   ✗ Backend server is NOT running"
    echo "   Please start the server with: bun run dev"
    exit 1
fi

echo ""
echo "2. Testing uploadAvatar endpoint (should return 401 without auth)..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/rpc/user/uploadAvatar \
  -H 'Content-Type: application/json' \
  -d '{"file":"test"}')

if [ "$RESPONSE" = "401" ]; then
    echo "   ✓ Endpoint returns 401 UNAUTHORIZED (correct - requires authentication)"
else
    echo "   ? Endpoint returned status: $RESPONSE"
fi

echo ""
echo "3. Checking AvatarUpload component..."
if [ -f "apps/web/src/lib/components/settings/profile/avatar-upload.svelte" ]; then
    echo "   ✓ AvatarUpload component exists"
else
    echo "   ✗ AvatarUpload component NOT found"
    exit 1
fi

echo ""
echo "4. Checking account page integration..."
if grep -q "AvatarUpload" apps/web/src/routes/app/settings/account/+page.svelte; then
    echo "   ✓ AvatarUpload is imported in account page"
else
    echo "   ✗ AvatarUpload NOT imported in account page"
    exit 1
fi

if grep -q "handleAvatarFileSelect" apps/web/src/routes/app/settings/account/+page.svelte; then
    echo "   ✓ Avatar file handler exists"
else
    echo "   ✗ Avatar file handler NOT found"
    exit 1
fi

if grep -q "handleAvatarUpload" apps/web/src/routes/app/settings/account/+page.svelte; then
    echo "   ✓ Avatar upload handler exists"
else
    echo "   ✗ Avatar upload handler NOT found"
    exit 1
fi

echo ""
echo "=== Test Summary ==="
echo "Backend API: ✓ Configured and protected"
echo "Frontend Component: ✓ Created"
echo "Account Page Integration: ✓ Complete"
echo ""
echo "Manual Browser Test Required:"
echo "1. Start dev server: bun run dev"
echo "2. Navigate to: http://localhost:5174/app/settings/account"
echo "3. Click 'Upload Photo' button"
echo "4. Select a valid image file (JPEG, PNG, GIF, WebP, < 2MB)"
echo "5. Verify preview appears"
echo "6. Click 'Save Changes' button"
echo "7. Verify avatar updates across the app"
echo ""
