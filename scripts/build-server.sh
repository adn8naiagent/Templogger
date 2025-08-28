#!/bin/bash
# Build server with TypeScript compilation
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist