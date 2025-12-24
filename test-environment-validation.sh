#!/usr/bin/env bash
# Environment Validation Test Script
# Tests the environment validation module

echo "🧪 Environment Validation Tests"
echo "=================================="
echo ""

# Test 1: Check if validation module exists
echo "1️⃣ Checking if validation module exists..."
if [ -f "src/lib/validateEnvironment.ts" ]; then
  echo "   ✅ validateEnvironment.ts found"
else
  echo "   ❌ validateEnvironment.ts NOT found"
fi

echo ""

# Test 2: Check if startup module exists
echo "2️⃣ Checking if startup module exists..."
if [ -f "src/lib/serverStartup.ts" ]; then
  echo "   ✅ serverStartup.ts found"
else
  echo "   ❌ serverStartup.ts NOT found"
fi

echo ""

# Test 3: Check if layout is updated
echo "3️⃣ Checking if layout.tsx imports serverStartup..."
if grep -q "serverStartup" src/app/layout.tsx; then
  echo "   ✅ layout.tsx imports serverStartup"
else
  echo "   ❌ layout.tsx does NOT import serverStartup"
fi

echo ""

# Test 4: Check if API route imports validation
echo "4️⃣ Checking if api/chat/route.ts imports validation..."
if grep -q "validateEnvironment" src/app/api/chat/route.ts; then
  echo "   ✅ route.ts imports validateEnvironment"
else
  echo "   ❌ route.ts does NOT import validateEnvironment"
fi

echo ""

# Test 5: Check environment variables
echo "5️⃣ Checking environment variables..."
if [ -f ".env.local" ]; then
  echo "   ✅ .env.local file exists"
  
  if grep -q "GEMINI_API_KEY" .env.local; then
    echo "   ✅ GEMINI_API_KEY is set"
  else
    echo "   ⚠️  GEMINI_API_KEY is NOT set"
  fi
  
  if grep -q "GEMINI_MODEL_ID" .env.local; then
    echo "   ✅ GEMINI_MODEL_ID is set"
  else
    echo "   ⚠️  GEMINI_MODEL_ID is NOT set"
  fi
else
  echo "   ⚠️  .env.local file not found"
fi

echo ""

# Test 6: Check for exposed keys
echo "6️⃣ Checking for exposed API keys..."
if grep -q "NEXT_PUBLIC_GEMINI_API_KEY" .env.local 2>/dev/null; then
  echo "   ❌ NEXT_PUBLIC_GEMINI_API_KEY found (SECURITY ISSUE!)"
else
  echo "   ✅ No exposed NEXT_PUBLIC_GEMINI_API_KEY"
fi

echo ""

# Test 7: TypeScript compilation
echo "7️⃣ Checking TypeScript compilation..."
if npx tsc --noEmit 2>/dev/null; then
  echo "   ✅ TypeScript compilation successful"
else
  echo "   ❌ TypeScript compilation failed"
fi

echo ""

# Test 8: Check for validation utility functions
echo "8️⃣ Checking validation utility functions..."
if grep -q "export function validateEnvironment" src/lib/validateEnvironment.ts; then
  echo "   ✅ validateEnvironment() function found"
fi

if grep -q "export function logEnvironmentValidation" src/lib/validateEnvironment.ts; then
  echo "   ✅ logEnvironmentValidation() function found"
fi

if grep -q "export function getValidatedEnvironment" src/lib/validateEnvironment.ts; then
  echo "   ✅ getValidatedEnvironment() function found"
fi

if grep -q "export function safeValidateEnvironment" src/lib/validateEnvironment.ts; then
  echo "   ✅ safeValidateEnvironment() function found"
fi

echo ""

# Test 9: Build test
echo "9️⃣ Attempting Next.js build..."
if npm run build > /dev/null 2>&1; then
  echo "   ✅ Next.js build successful"
else
  echo "   ❌ Next.js build failed"
fi

echo ""

# Test 10: Dev server startup
echo "🔟 To test live environment validation:"
echo "   1. Run: npm run dev"
echo "   2. Check console for: ✅ Environment validation successful"
echo "   3. Look for: API Key and Model ID logged"
echo ""

# Summary
echo "✅ All checks completed!"
echo ""
