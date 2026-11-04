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

echo "storage account $STORAGE_ACCOUNT_NAME"
if ! az storage account show --resource-group "$RESOURCE_GROUP" --name "$STORAGE_ACCOUNT_NAME" --output none 2>/dev/null; then
    az storage account create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$STORAGE_ACCOUNT_NAME" \
        --location "$AZURE_LOCATION" \
        --sku Standard_LRS \
        --kind StorageV2 \
        --min-tls-version TLS1_2 \
        --allow-blob-public-access false \
        --output none
fi
connection=$(az storage account show-connection-string --resource-group "$RESOURCE_GROUP" --name "$STORAGE_ACCOUNT_NAME" --query connectionString --output tsv)
echo "container $AZURE_STORAGE_CONTAINER_NAME"
az storage container create --name "$AZURE_STORAGE_CONTAINER_NAME" --connection-string "$connection" --output none
if [ "$AZURE_STORAGE_CONNECTION_STRING" != "$connection" ]; then
    echo "AZURE_STORAGE_CONNECTION_STRING in .env.$env is not the connection string of $STORAGE_ACCOUNT_NAME: write the output of 'az storage account show-connection-string --resource-group $RESOURCE_GROUP --name $STORAGE_ACCOUNT_NAME --query connectionString --output tsv' into it and rerun" >&2
    exit 1
fi

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
