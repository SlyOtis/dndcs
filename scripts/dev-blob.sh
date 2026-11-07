#!/bin/sh
set -e

BLOB_NAME="$(basename "$PWD")-blob"
BLOB_PORT="$(printf '%s' "$AZURE_STORAGE_CONNECTION_STRING" | sed -n 's|.*BlobEndpoint=https\{0,1\}://[^:/;]*:\([0-9]*\).*|\1|p')"

if [ -z "$BLOB_PORT" ]; then
    echo "AZURE_STORAGE_CONNECTION_STRING in .env names no BlobEndpoint port for Azurite."
    exit 1
fi

docker rm -f "$BLOB_NAME" > /dev/null 2>&1 || true

cleanup() {
    echo ""
    echo "Stopping $BLOB_NAME..."
    docker rm -f "$BLOB_NAME" > /dev/null 2>&1 || true
    echo "Blob store stopped."
}
trap cleanup EXIT

echo "Starting $BLOB_NAME on port $BLOB_PORT..."
docker run \
    --name "$BLOB_NAME" \
    -p "$BLOB_PORT":10000 \
    mcr.microsoft.com/azure-storage/azurite \
    azurite-blob --blobHost 0.0.0.0 --blobPort 10000 --skipApiVersionCheck --loose
