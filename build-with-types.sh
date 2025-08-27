#!/bin/bash
echo "Running build with type checking..."
npm run type-check && npm run build:client && npm run build:server
echo "Build completed."
