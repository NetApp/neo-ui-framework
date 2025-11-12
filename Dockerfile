FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy template (for Docker usage)
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy built application
COPY dist /usr/share/nginx/html

# Make config directory writable
RUN chown -R nginx:nginx /etc/nginx/conf.d/ && \
    chmod -R 755 /etc/nginx/conf.d/ && \
    chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

# Run as root to allow config file creation
USER root

ENTRYPOINT ["/entrypoint.sh"]