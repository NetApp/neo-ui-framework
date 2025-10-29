#!/bin/sh
# filepath: /home/romdalf/dev/ntap/neo/ntap-neo-ui/entrypoint.sh
set -e

NEO_API=${NEO_API:-http://netapp-neo:8080}
export NEO_API

echo "Configuring nginx to proxy API requests to: $NEO_API"

envsubst '$NEO_API' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Checking NEO_API configuration in NGINX default.conf"
grep proxy_pass /etc/nginx/conf.d/default.conf

nginx -t
exec nginx -g 'daemon off;'