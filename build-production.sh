#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
APP_NAME="frontend"
NEW_DIR="${PARENT_DIR}/${APP_NAME}-new"
OLD_DIR="${PARENT_DIR}/${APP_NAME}-old"

echo "========================================="
echo "Zero-Downtime Deploy for wallet.az"
echo "========================================="

# 1. Pull latest in current folder
cd "$SCRIPT_DIR"
git pull || exit 1

# 2. Copy to new folder
rm -rf "$NEW_DIR"
cp -r "$SCRIPT_DIR" "$NEW_DIR"

# 3. Build in new folder (old keeps running)
cd "$NEW_DIR"
rm -rf .next node_modules
npm install || exit 1
NODE_ENV=production npm run build || exit 1

# 4. Quick swap
cd "$PARENT_DIR"
rm -rf "$OLD_DIR"
mv "$SCRIPT_DIR" "$OLD_DIR"
mv "$NEW_DIR" "$SCRIPT_DIR"

# 5. Restart PM2
cd "$SCRIPT_DIR"
pm2 restart next.wallet.az || pm2 start npm --name next.wallet.az -- start -- -p 3033
pm2 save

# 6. Cleanup
rm -rf "$OLD_DIR"

echo "Done!"
