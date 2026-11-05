#!/bin/sh
set -e

BIN="$(go env GOPATH)/bin"
SMIG_VERSION=$(sed -n 's/.*samna-migrate\/cmd@\(v[0-9.]*\).*/\1/p' Dockerfile | head -1)

has() {
    command -v "$1" > /dev/null 2>&1
}

brew_install() {
    if ! has brew; then
        echo "$1 is missing and Homebrew is not here to install it. Install $1, then run just install again."
        exit 1
    fi
    brew install "$@"
}

for tool in go pnpm; do
    if has "$tool"; then
        echo "$tool: found"
    else
        echo "$tool: installing"
        brew_install "$tool"
    fi
done

if has smig && smig --version 2>/dev/null | grep -q "$SMIG_VERSION"; then
    echo "smig: found $SMIG_VERSION"
else
    echo "smig: installing $SMIG_VERSION"
    GOPRIVATE=github.com/nimling/* go install -ldflags "-X github.com/nimling/samna-migrate/pkg/cli.Version=$SMIG_VERSION" "github.com/nimling/samna-migrate/cmd@$SMIG_VERSION"
    mv "$BIN/cmd" "$BIN/smig"
fi

if has air; then
    echo "air: found"
else
    echo "air: installing"
    go install github.com/air-verse/air@latest
fi

if has playwright-cli; then
    echo "playwright-cli: found"
else
    echo "playwright-cli: installing"
    brew_install playwright-cli
fi

if has docker; then
    echo "docker: found"
else
    echo "docker: installing"
    brew_install --cask orbstack
fi

case ":$PATH:" in
    *":$BIN:"*) ;;
    *) echo "Add $BIN to PATH so smig and air are found." ;;
esac

cd web && pnpm install
cd ..
go mod download
echo "Installed."
