#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
source scripts/lib.sh "${1:-}"

verification=$(az containerapp env show --resource-group "$RESOURCE_GROUP" --name "$ENVIRONMENT_NAME" --query properties.customDomainConfiguration.customDomainVerificationId --output tsv)
name="$APP_PREFIX-dndcs"
fqdn=$(az containerapp show --resource-group "$RESOURCE_GROUP" --name "$name" --query properties.configuration.ingress.fqdn --output tsv)
record="${QUILLBORNE_HOST%.$DNS_ZONE}"

echo "dns $QUILLBORNE_HOST -> $fqdn"
az network dns record-set cname set-record \
    --subscription "$DNS_SUBSCRIPTION_ID" \
    --resource-group "$DNS_RESOURCE_GROUP" \
    --zone-name "$DNS_ZONE" \
    --record-set-name "$record" \
    --cname "$fqdn" \
    --output none
if ! az network dns record-set txt show --subscription "$DNS_SUBSCRIPTION_ID" --resource-group "$DNS_RESOURCE_GROUP" --zone-name "$DNS_ZONE" --name "asuid.$record" --query "txtRecords[].value[]" --output tsv 2>/dev/null | grep -qx "$verification"; then
    az network dns record-set txt add-record \
        --subscription "$DNS_SUBSCRIPTION_ID" \
        --resource-group "$DNS_RESOURCE_GROUP" \
        --zone-name "$DNS_ZONE" \
        --record-set-name "asuid.$record" \
        --value "$verification" \
        --output none
fi

echo "hostname $QUILLBORNE_HOST on $name"
az containerapp hostname add --resource-group "$RESOURCE_GROUP" --name "$name" --hostname "$QUILLBORNE_HOST" --output none 2>/dev/null || true
az containerapp hostname bind \
    --resource-group "$RESOURCE_GROUP" \
    --name "$name" \
    --hostname "$QUILLBORNE_HOST" \
    --environment "$ENVIRONMENT_NAME" \
    --validation-method CNAME \
    --output none
