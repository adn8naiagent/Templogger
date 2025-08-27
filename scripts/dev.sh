#!/bin/bash
# Run both client and server concurrently
concurrently "npm run dev:server" "npm run dev:client"