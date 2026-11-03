FROM node:22-alpine AS web-builder
WORKDIR /web
COPY web/package.json web/pnpm-lock.yaml web/pnpm-workspace.yaml web/.npmrc ./
RUN --mount=type=secret,id=node_auth_token corepack enable pnpm && NODE_AUTH_TOKEN="$(cat /run/secrets/node_auth_token)" pnpm install --frozen-lockfile
COPY web/ .
RUN pnpm build

FROM golang:1.26-alpine AS go-builder

ARG IMAGE_VERSION=dev
ARG GH_REPO_TOKEN=

RUN apk add --no-cache git
RUN if [ -n "$GH_REPO_TOKEN" ]; then \
        git config --global url."https://${GH_REPO_TOKEN}:x-oauth-basic@github.com/".insteadOf "https://github.com/"; \
    fi
ENV GOPRIVATE=github.com/nimling/*
ENV GOSUMDB=off

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY cmd/ cmd/
COPY internal/ internal/
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags "-X github.com/SlyOtis/dndcs/internal/version.Version=${IMAGE_VERSION}" \
    -o main ./cmd

FROM golang:1.26-alpine AS smig-builder
ARG GH_REPO_TOKEN=
RUN apk add --no-cache git
RUN if [ -n "$GH_REPO_TOKEN" ]; then \
        git config --global url."https://${GH_REPO_TOKEN}:x-oauth-basic@github.com/".insteadOf "https://github.com/"; \
    fi
ENV GOPRIVATE=github.com/nimling/*
ENV GOSUMDB=off
RUN go install -ldflags "-X github.com/nimling/samna-migrate/pkg/cli.Version=v1.5.12" github.com/nimling/samna-migrate/cmd@v1.5.12 \
    && mv /go/bin/cmd /go/bin/smig

FROM alpine:latest AS migrate

RUN apk --no-cache add ca-certificates git postgresql17-client

COPY --from=smig-builder /go/bin/smig /usr/local/bin/smig
COPY database/ /database/

CMD ["sh", "-c", "smig upgrade --yes --schema=/database/migrate.yml --db-dir=/database && smig up --yes --schema=/database/migrate.yml --db-dir=/database"]

FROM alpine:latest
ARG IMAGE_VERSION

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app
COPY --from=go-builder /app/main .
COPY --from=web-builder /web/dist ./web/dist

EXPOSE 4290

ENV SERVER_VERSION=$IMAGE_VERSION
ENV SERVER_HTML_PATH=/app/web/dist
ENV SERVER_PORT=4290

CMD ["/app/main"]
