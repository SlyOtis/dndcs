env="${1:-}"
if [ -z "$env" ]; then
    echo "usage: $0 <tst|prd> ..." >&2
    exit 1
fi
if [ ! -f ".env.$env" ]; then
    echo ".env.$env is missing" >&2
    exit 1
fi
set -a
source ".env.$env"
set +a
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

render() {
    export ENVIRONMENT_ID IDENTITY_ID IDENTITY_CLIENT_ID ACR_SERVER
    ENVIRONMENT_ID=$(az containerapp env show --resource-group "$RESOURCE_GROUP" --name "$ENVIRONMENT_NAME" --query id --output tsv)
    IDENTITY_ID=$(az identity show --resource-group "$RESOURCE_GROUP" --name "$IDENTITY_NAME" --query id --output tsv)
    IDENTITY_CLIENT_ID=$(az identity show --resource-group "$RESOURCE_GROUP" --name "$IDENTITY_NAME" --query clientId --output tsv)
    ACR_SERVER="$ACR_NAME.azurecr.io"
    mkdir -p tmp
    envsubst "$(printf '${%s} ' $(grep -oE '^[A-Z][A-Z0-9_]*' .env.example) AZURE_LOCATION AZURE_TENANT_ID RESOURCE_GROUP APP_PREFIX DOCKER_IMAGE ENVIRONMENT_ID IDENTITY_ID IDENTITY_CLIENT_ID ACR_SERVER)" < "deploy/$1.yaml" > "tmp/$1.yaml"
}
