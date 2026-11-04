#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
source scripts/lib.sh "${1:-}"

echo "resource group $RESOURCE_GROUP"
az group create --name "$RESOURCE_GROUP" --location "$AZURE_LOCATION" --output none

echo "identity $IDENTITY_NAME"
az identity create --resource-group "$RESOURCE_GROUP" --name "$IDENTITY_NAME" --location "$AZURE_LOCATION" --output none
principal_id=$(az identity show --resource-group "$RESOURCE_GROUP" --name "$IDENTITY_NAME" --query principalId --output tsv)
acr_id=$(az acr show --name "$ACR_NAME" --query id --output tsv)
echo "AcrPull for $IDENTITY_NAME on $ACR_NAME"
az role assignment create \
    --assignee-object-id "$principal_id" \
    --assignee-principal-type ServicePrincipal \
    --role AcrPull \
    --scope "$acr_id" \
    --output none

echo "environment $ENVIRONMENT_NAME"
if ! az containerapp env show --resource-group "$RESOURCE_GROUP" --name "$ENVIRONMENT_NAME" --output none 2>/dev/null; then
    az containerapp env create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$ENVIRONMENT_NAME" \
        --location "$AZURE_LOCATION" \
        --enable-workload-profiles \
        --logs-destination none \
        --output none
fi

bash scripts/apps.sh "$env"
