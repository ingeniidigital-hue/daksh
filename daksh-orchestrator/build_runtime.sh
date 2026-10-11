#!/bin/bash

# Exit on error
set -e

echo "Building Daksh Generic Nakama Runtime Docker Image..."
cd ../backend

# Compile TypeScript
npm install
npm run build

# Build Docker Image
docker build -t daksh/nakama:latest .

echo "Successfully built daksh/nakama:latest!"
echo "Your local kubernetes orchestrator will now use this image for all new titles."
