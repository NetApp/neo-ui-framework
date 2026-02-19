FROM docker.io/library/caddy:2-alpine

# Copy Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy built application
COPY dist /srv

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]