#!/bin/sh
set -e

NEO_API=${NEO_API:-http://localhost:8080}
export NEO_API

echo "Configuring Caddy to proxy API requests to: $NEO_API"

# Check if a pre-configured Caddyfile exists (e.g., from Kubernetes ConfigMap)
# If it does not contain the env var placeholder, use it as-is
if [ -f /etc/caddy/Caddyfile ] && ! grep -q '{\$NEO_API}' /etc/caddy/Caddyfile 2>/dev/null; then
    echo "Found pre-configured Caddyfile (likely from ConfigMap), using as-is"
fi

# Validate and run Caddy
echo "Starting Caddy server..."
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile