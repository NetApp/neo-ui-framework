#!/bin/sh
set -e

NEO_API=${NEO_API:-http://localhost:8080}
export NEO_API

echo "Configuring nginx to proxy API requests to: $NEO_API"

# Check if we're running in Kubernetes with a pre-configured ConfigMap
# If /etc/nginx/conf.d/default.conf exists and is not a template, use it as-is
if [ -f /etc/nginx/conf.d/default.conf ] && ! grep -q '\${NEO_API}' /etc/nginx/conf.d/default.conf 2>/dev/null; then
    echo "Found pre-configured nginx config (likely from ConfigMap), skipping template substitution"
    echo "Current proxy_pass configuration:"
    grep proxy_pass /etc/nginx/conf.d/default.conf || echo "No proxy_pass found"
else
    echo "Generating nginx config from template"
    
    # Check if template exists
    if [ ! -f /etc/nginx/conf.d/default.conf.template ]; then
        echo "Error: Template file not found at /etc/nginx/conf.d/default.conf.template"
        exit 1
    fi
    
    # Create temp file in writable directory first
    envsubst '$NEO_API' < /etc/nginx/conf.d/default.conf.template > /tmp/default.conf
    
    # Copy to final location with error handling
    if cp -f /tmp/default.conf /etc/nginx/conf.d/default.conf 2>/dev/null; then
        echo "Configuration updated successfully"
    else
        echo "Warning: Could not copy config file, trying direct write"
        envsubst '$NEO_API' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf || {
            echo "Error: Could not create nginx configuration"
            exit 1
        }
    fi
    
    echo "Checking NEO_API configuration in NGINX default.conf"
    grep proxy_pass /etc/nginx/conf.d/default.conf
fi

# Validate nginx configuration
if nginx -t; then
    echo "Nginx configuration is valid, starting server..."
    exec nginx -g 'daemon off;'
else
    echo "Error: Nginx configuration test failed"
    exit 1
fi