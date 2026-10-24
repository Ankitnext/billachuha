# syntax=docker/dockerfile:1
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /src
COPY . .
ARG DEPLOY_ENV
ARG BACKEND_URL
RUN BACKEND_URL="$BACKEND_URL" node tools/build.mjs --environment "$DEPLOY_ENV" \
    && node --check dist/site-config.js

FROM nginxinc/nginx-unprivileged:stable-alpine
ARG DEPLOY_ENV
LABEL com.billachuha.environment=$DEPLOY_ENV
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=4s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
