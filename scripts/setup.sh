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

if [ -z "${POSTGRES_ADMIN_USER:-}" ] || [ -z "${POSTGRES_ADMIN_PASSWORD:-}" ]; then
    echo "POSTGRES_ADMIN_USER and POSTGRES_ADMIN_PASSWORD in .env.$env name the admin of $PGHOST: write them and rerun" >&2
    exit 1
fi

job="$APP_PREFIX-dndcs-bootstrap"
echo "role $PGUSER and database $PGDATABASE on $PGHOST as $POSTGRES_ADMIN_USER"
if ! az containerapp job show --resource-group "$RESOURCE_GROUP" --name "$job" --output none 2>/dev/null; then
    az containerapp job create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$job" \
        --environment "$ENVIRONMENT_NAME" \
        --trigger-type Manual \
        --replica-timeout 600 \
        --replica-retry-limit 0 \
        --image postgres:17-alpine \
        --cpu 0.5 \
        --memory 1Gi \
        --output none
fi
az containerapp job secret set --resource-group "$RESOURCE_GROUP" --name "$job" --secrets "pgadminpassword=$POSTGRES_ADMIN_PASSWORD" "pgpassword=$PGPASSWORD" --output none
bootstrap=$(cat <<'SQL'
SELECT format('CREATE ROLE %I LOGIN CREATEROLE PASSWORD %L', :'u', :'p') WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'u') \gexec
SELECT format('ALTER ROLE %I PASSWORD %L', :'u', :'p') \gexec
SELECT format('GRANT %I TO CURRENT_USER', :'u') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'d', :'u') WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'d') \gexec
SELECT format('REVOKE CONNECT ON DATABASE %I FROM PUBLIC', :'d') \gexec
\connect :"d"
CREATE EXTENSION IF NOT EXISTS pgcrypto;
GRANT USAGE, CREATE ON SCHEMA public TO :"u";
SQL
)
mkdir -p tmp
jq -n \
    --arg host "$PGHOST" \
    --arg port "$PGPORT" \
    --arg sslmode "$PGSSLMODE" \
    --arg admin "$POSTGRES_ADMIN_USER" \
    --arg user "$PGUSER" \
    --arg database "$PGDATABASE" \
    --arg bootstrap "$bootstrap" \
    '{containers: [{
        name: "bootstrap",
        image: "postgres:17-alpine",
        command: ["sh", "-c", "printf \"%s\\n\" \"$BOOTSTRAP\" | psql --dbname postgres --set ON_ERROR_STOP=1 --quiet --variable u=\"$APP_USER\" --variable p=\"$APP_PASSWORD\" --variable d=\"$APP_DATABASE\""],
        env: [
            {name: "PGHOST", value: $host},
            {name: "PGPORT", value: $port},
            {name: "PGSSLMODE", value: $sslmode},
            {name: "PGUSER", value: $admin},
            {name: "PGPASSWORD", secretRef: "pgadminpassword"},
            {name: "APP_USER", value: $user},
            {name: "APP_PASSWORD", secretRef: "pgpassword"},
            {name: "APP_DATABASE", value: $database},
            {name: "BOOTSTRAP", value: $bootstrap}
        ],
        resources: {cpu: 0.5, memory: "1Gi"}
    }]}' > tmp/dndcs-bootstrap.json
execution=$(az containerapp job start --resource-group "$RESOURCE_GROUP" --name "$job" --yaml tmp/dndcs-bootstrap.json --query name --output tsv)
while :; do
    status=$(az containerapp job execution show --resource-group "$RESOURCE_GROUP" --name "$job" --job-execution-name "$execution" --query properties.status --output tsv)
    case "$status" in
        Succeeded)
            echo "$execution $status"
            break
            ;;
        Failed|Stopped|Degraded)
            echo "$execution $status" >&2
            az containerapp job secret remove --resource-group "$RESOURCE_GROUP" --name "$job" --secret-names pgadminpassword --yes --output none
            exit 1
            ;;
    esac
    sleep 10
done
az containerapp job secret remove --resource-group "$RESOURCE_GROUP" --name "$job" --secret-names pgadminpassword --yes --output none

bash scripts/apps.sh "$env"
