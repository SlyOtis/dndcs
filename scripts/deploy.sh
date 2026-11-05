#!/bin/sh
set -e

ENV="${1:-tst}"
VERSION="${2:-}"

if [ "$ENV" = "prd" ]; then
    [ -n "$VERSION" ] || { echo "Usage: just deploy prd <tag>"; exit 1; }
    exec sbump release dndcs --env prd --tag "$VERSION"
fi

if [ -z "$VERSION" ]; then
    sbump patch --env SERVER_VERSION --push-version --auto
    VERSION=$(git tag --points-at HEAD --list 'v[0-9]*' | grep -v -- "-$ENV\$" | head -1)
fi

if ! git ls-remote --tags origin "refs/tags/$VERSION" | grep -q "refs/tags/$VERSION$"; then
    echo "Tag '$VERSION' does not exist on origin. Push the tag first."
    exit 1
fi

git tag "$VERSION-$ENV" "$VERSION"
git push origin "$VERSION-$ENV"
echo "Pushed $VERSION-$ENV. Workflow deploys to $ENV."
