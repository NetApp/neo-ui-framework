FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf.template

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

COPY dist /usr/share/nginx/html

EXPOSE 80

CMD ["/entrypoint.sh"]