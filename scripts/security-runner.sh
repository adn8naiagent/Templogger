#!/bin/bash
set -e

echo "🔒 Security Scanner - Running comprehensive security checks"
echo "=================================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Snyk is available
if ! command_exists snyk; then
    echo "❌ Snyk CLI not found. Installing..."
    npm install -g snyk
fi

# Check if SNYK_TOKEN is set
if [ -z "$SNYK_TOKEN" ]; then
    echo "⚠️  SNYK_TOKEN environment variable not set"
    echo "   Get your token from: https://app.snyk.io/account"
    echo "   Export it with: export SNYK_TOKEN=your_token_here"
    echo ""
fi

echo "1. Running TypeScript checks..."
npm run check || {
    echo "❌ TypeScript check failed"
    exit 1
}

echo "✅ TypeScript checks passed"
echo ""

echo "2. Running ESLint security checks..."
npm run lint || {
    echo "❌ ESLint check failed"
    exit 1
}

echo "✅ ESLint checks passed"
echo ""

echo "3. Running Snyk vulnerability scan..."
if [ "$SNYK_TOKEN" ]; then
    snyk test --severity-threshold=high || {
        echo "❌ High severity vulnerabilities found"
        echo "Run 'snyk test' for detailed output"
        exit 1
    }
    echo "✅ No high severity vulnerabilities found"
else
    echo "⚠️  Skipping Snyk scan - SNYK_TOKEN not set"
fi

echo ""
echo "4. Running Snyk code analysis..."
if [ "$SNYK_TOKEN" ]; then
    snyk code test || {
        echo "⚠️  Code analysis found issues"
        echo "Run 'snyk code test' for detailed output"
    }
    echo "✅ Code analysis completed"
else
    echo "⚠️  Skipping code analysis - SNYK_TOKEN not set"
fi

echo ""
echo "🎉 Security scan completed successfully!"
echo "=================================================="