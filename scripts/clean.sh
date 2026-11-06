#!/bin/sh
set -e

echo "Cleaning bin..."
rm -rf bin

echo "Cleaning web/node_modules..."
rm -rf web/node_modules

echo "Cleaning web/dist..."
rm -rf web/dist

DB_NAME="$(basename "$PWD")-db"
echo "Cleaning docker containers and volumes..."
docker rm -f "$DB_NAME" > /dev/null 2>&1 || true
docker volume rm "$DB_NAME-data" > /dev/null 2>&1 || true
docker rmi -f "$DB_NAME" > /dev/null 2>&1 || true

echo "Clean complete."
