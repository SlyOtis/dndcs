#!/bin/sh
set -e

BLOB_NAME="${APP_NAME}-blob"

docker rm -f "$BLOB_NAME" > /dev/null 2>&1 || true

cleanup() {
    echo ""
    echo "Stopping $BLOB_NAME..."
    docker rm -f "$BLOB_NAME" > /dev/null 2>&1 || true
    echo "Blob store stopped."
}
trap cleanup EXIT

echo "Starting $BLOB_NAME on port 10000..."
docker run \
    --name "$BLOB_NAME" \
    -p 10000:10000 \
    mcr.microsoft.com/azure-storage/azurite \
    azurite-blob --blobHost 0.0.0.0 --blobPort 10000 --skipApiVersionCheck --loose
