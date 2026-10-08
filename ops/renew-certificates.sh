#!/bin/sh
set -eu

exec certbot renew --non-interactive --quiet \
    --cert-name badhon.mooo.com \
    --pre-hook "docker compose --env-file /opt/badhon/.env.production stop client" \
    --post-hook "docker compose --env-file /opt/badhon/.env.production start client"
