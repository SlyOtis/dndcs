#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
source scripts/lib.sh "${1:-}"

echo "resource group $RESOURCE_GROUP"
az group create --name "$RESOURCE_GROUP" --location "$AZURE_LOCATION" --output none

echo "vnet $VNET_NAME"
if ! az network vnet show --resource-group "$RESOURCE_GROUP" --name "$VNET_NAME" --output none 2>/dev/null; then
    az network vnet create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$VNET_NAME" \
        --location "$AZURE_LOCATION" \
        --address-prefixes "$VNET_PREFIX" \
        --output none
fi

subnet() {
    name="$1"
    prefix="$2"
    delegation="$3"
    echo "subnet $name"
    if ! az network vnet subnet show --resource-group "$RESOURCE_GROUP" --vnet-name "$VNET_NAME" --name "$name" --output none 2>/dev/null; then
        az network vnet subnet create \
            --resource-group "$RESOURCE_GROUP" \
            --vnet-name "$VNET_NAME" \
            --name "$name" \
            --address-prefixes "$prefix" \
            --delegations "$delegation" \
            --output none
    fi
}
subnet "$SUBNET_NAME" "$SUBNET_PREFIX" Microsoft.App/environments
subnet "$POSTGRES_SUBNET_NAME" "$POSTGRES_SUBNET_PREFIX" Microsoft.DBforPostgreSQL/flexibleServers
subnet_id=$(az network vnet subnet show --resource-group "$RESOURCE_GROUP" --vnet-name "$VNET_NAME" --name "$SUBNET_NAME" --query id --output tsv)
postgres_subnet_id=$(az network vnet subnet show --resource-group "$RESOURCE_GROUP" --vnet-name "$VNET_NAME" --name "$POSTGRES_SUBNET_NAME" --query id --output tsv)

echo "private dns zone $POSTGRES_DNS_ZONE"
if ! az network private-dns zone show --resource-group "$RESOURCE_GROUP" --name "$POSTGRES_DNS_ZONE" --output none 2>/dev/null; then
    az network private-dns zone create --resource-group "$RESOURCE_GROUP" --name "$POSTGRES_DNS_ZONE" --output none
fi
if ! az network private-dns link vnet show --resource-group "$RESOURCE_GROUP" --zone-name "$POSTGRES_DNS_ZONE" --name "$VNET_NAME" --output none 2>/dev/null; then
    az network private-dns link vnet create \
        --resource-group "$RESOURCE_GROUP" \
        --zone-name "$POSTGRES_DNS_ZONE" \
        --name "$VNET_NAME" \
        --virtual-network "$VNET_NAME" \
        --registration-enabled false \
        --output none
fi
zone_id=$(az network private-dns zone show --resource-group "$RESOURCE_GROUP" --name "$POSTGRES_DNS_ZONE" --query id --output tsv)

if [ -z "${POSTGRES_ADMIN_USER:-}" ] || [ -z "${POSTGRES_ADMIN_PASSWORD:-}" ]; then
    echo "POSTGRES_ADMIN_USER and POSTGRES_ADMIN_PASSWORD in .env.$env name the admin of $POSTGRES_SERVER: write them and rerun" >&2
    exit 1
fi

echo "postgres $POSTGRES_SERVER"
if ! az postgres flexible-server show --resource-group "$RESOURCE_GROUP" --name "$POSTGRES_SERVER" --output none 2>/dev/null; then
    az postgres flexible-server create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$POSTGRES_SERVER" \
        --location "$AZURE_LOCATION" \
        --tier "$POSTGRES_TIER" \
        --sku-name "$POSTGRES_SKU" \
        --version 17 \
        --storage-size "$POSTGRES_STORAGE_GB" \
        --admin-user "$POSTGRES_ADMIN_USER" \
        --admin-password "$POSTGRES_ADMIN_PASSWORD" \
        --subnet "$postgres_subnet_id" \
        --private-dns-zone "$zone_id" \
        --yes \
        --output none
fi
fqdn=$(az postgres flexible-server show --resource-group "$RESOURCE_GROUP" --name "$POSTGRES_SERVER" --query fullyQualifiedDomainName --output tsv)

restart=false
parameter() {
    name="$1"
    value="$2"
    current=$(az postgres flexible-server parameter show --resource-group "$RESOURCE_GROUP" --server-name "$POSTGRES_SERVER" --name "$name" --query value --output tsv)
    if [ "$current" != "$value" ]; then
        echo "parameter $name = $value"
        az postgres flexible-server parameter set --resource-group "$RESOURCE_GROUP" --server-name "$POSTGRES_SERVER" --name "$name" --value "$value" --output none
        restart=true
    fi
}
parameter azure.extensions "PGCRYPTO"
parameter max_connections "$POSTGRES_MAX_CONNECTIONS"
if [ "$restart" = true ]; then
    echo "restart $POSTGRES_SERVER"
    az postgres flexible-server restart --resource-group "$RESOURCE_GROUP" --name "$POSTGRES_SERVER" --output none
fi

if [ "$PGHOST" != "$fqdn" ]; then
    echo "PGHOST in .env.$env is '$PGHOST', the server answers at '$fqdn': write PGHOST=$fqdn and rerun" >&2
    exit 1
fi

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
        --infrastructure-subnet-resource-id "$subnet_id" \
        --logs-destination none \
        --output none
fi

job="$APP_PREFIX-dndcs-migrate"
identity_id=$(az identity show --resource-group "$RESOURCE_GROUP" --name "$IDENTITY_NAME" --query id --output tsv)
echo "job $job"
if ! az containerapp job show --resource-group "$RESOURCE_GROUP" --name "$job" --output none 2>/dev/null; then
    az containerapp job create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$job" \
        --environment "$ENVIRONMENT_NAME" \
        --trigger-type Manual \
        --replica-timeout 1800 \
        --replica-retry-limit 0 \
        --image postgres:17-alpine \
        --cpu 0.5 \
        --memory 1Gi \
        --mi-user-assigned "$identity_id" \
        --registry-server "$ACR_NAME.azurecr.io" \
        --registry-identity "$identity_id" \
        --output none
fi
echo "role $PGUSER and database $PGDATABASE on $PGHOST as $POSTGRES_ADMIN_USER"
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
