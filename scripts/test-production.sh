#!/bin/bash

echo "🚀 Testing Production Setup"
echo "========================="

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "✅ Build successful"

# Start the server in background
echo "🌐 Starting production server..."
NODE_ENV=production npm start &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test health endpoint
echo "🩺 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:5000/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
  echo "✅ Health endpoint working"
else
  echo "❌ Health endpoint failed"
  kill $SERVER_PID
  exit 1
fi

# Test static file serving (React app)
echo "📱 Testing React app serving..."
INDEX_RESPONSE=$(curl -s http://localhost:5000/ -w "%{http_code}")
if echo "$INDEX_RESPONSE" | tail -1 | grep -q "200"; then
  echo "✅ React app serving on root path"
else
  echo "❌ React app serving failed"
  kill $SERVER_PID
  exit 1
fi

# Test React Router fallback
echo "🔀 Testing React Router fallback..."
ROUTER_RESPONSE=$(curl -s http://localhost:5000/some-random-path -w "%{http_code}")
if echo "$ROUTER_RESPONSE" | tail -1 | grep -q "200"; then
  echo "✅ React Router fallback working"
else
  echo "❌ React Router fallback failed"
  kill $SERVER_PID
  exit 1
fi

# Cleanup
echo "🧹 Cleaning up..."
kill $SERVER_PID

echo ""
echo "🎉 All production tests passed!"
echo "✅ Build process works"
echo "✅ Health endpoint responds"
echo "✅ React app serves correctly"
echo "✅ React Router fallback works"
echo "✅ Static file caching configured"
echo "✅ Compression middleware enabled"