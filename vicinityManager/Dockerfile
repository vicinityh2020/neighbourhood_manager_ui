FROM    nginx:1.15-alpine
COPY    ./app /usr/share/nginx/html/nm
RUN     mkdir -p var/certificates
COPY    nginx.conf /etc/nginx/conf.d/default.conf
