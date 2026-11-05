#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
source scripts/lib.sh "${1:-}"

name="$APP_PREFIX-dndcs"
render dndcs

if az containerapp show --resource-group "$RESOURCE_GROUP" --name "$name" --output none 2>/dev/null; then
    echo "update $name"
    az containerapp update --resource-group "$RESOURCE_GROUP" --name "$name" --yaml tmp/dndcs.yaml --output none
else
    echo "create $name"
    az containerapp create --resource-group "$RESOURCE_GROUP" --name "$name" --yaml tmp/dndcs.yaml --output none
fi
