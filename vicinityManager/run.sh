#!/bin/sh
usage="$(basename "$0") [-h] [-p port -e env -d dns_name]
 -- Builds vcnt-ui docker

where:
    -h  shows help
    -p  port
    -e  environment
    -d  dns name"

# Default configuration
PORT=8080
ENV="local"
DOMAIN="development.vicinity.ws"

# Get configuration
while getopts 'hd:p:e:' option; do
  case "$option" in
    h) echo "$usage"
      exit
      ;;
    e)
      ENV="$OPTARG"
      ;;
    p)
      PORT="$OPTARG"
      ;;
    d)
      DOMAIN="$OPTARG"
      ;;
  esac
done

# CLEAN OLD BUILD
docker kill nm-ui >/dev/null 2>&1
docker rm nm-ui >/dev/null 2>&1
docker rmi nm-ui >/dev/null 2>&1
# Copy relevant files based on ENV
cp docker/nginx.${ENV}.conf nginx.conf
cp docker/Dockerfile.${ENV} Dockerfile
cp app/envs/env_${ENV}.js app/env.js
# Docker build
docker build -f Dockerfile -t nm-ui .
# CREATE LOCAL FOLDERS
mkdir -p ~/docker_data/logs/nginx
# RUN
if [ "${ENV}" == "local" ]
then
  docker run -d -p ${PORT}:80 \
          --name nm-ui \
          -v ~/docker_data/logs/nginx:/var/log/nginx \
          nm-ui:latest
else
  docker run -d -p ${PORT}:80 \
          --name nm-ui \
          --mount type=bind,source=/etc/letsencrypt/live/${DOMAIN}/privkey.pem,target=/var/certificates/privkey.pem,readonly \
          --mount type=bind,source=/etc/letsencrypt/live/${DOMAIN}/fullchain.pem,target=/var/certificates/fullchain.pem,readonly \
          -v ~/docker_data/logs/nginx:/var/log/nginx \
          nm-ui:latest
fi
