#!/bin/bash
# Build both client and server
echo "Building client..."
vite build

echo "Building server..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"