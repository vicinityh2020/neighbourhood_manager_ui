#!/bin/bash
usage="$(basename "$0") [-h] [-e env -d dns_name]
-- Builds vcnt-ui docker
 -- Examples
 -- Production: ./run.sh -e prod -d www.example.com
 -- Development: ./run.sh -e dev -d www.example.com
 -- Local: ./run.sh [ without arguments, access on localhost:8080 ]

where:
    -h  shows help
    -e  environment
    -d  dns name"

# Default configuration
PORT=8080
ENV="local"
DOMAIN="NONE"

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
npm install
docker build -f Dockerfile -t nm-ui .
# CREATE LOCAL FOLDERS
mkdir -p ~/docker_data/logs/nginx
# RUN
if [ "${ENV}" == "local" ] ; then
  docker run -d -p ${PORT}:80 \
          --name nm-ui \
          -v ~/docker_data/logs/nginx:/var/log/nginx \
          nm-ui:latest
elif [ "${DOMAIN}" == "NONE" ] ; then
  echo "Missing DNS name!!"
  exit 1
else
  docker run -d -p 443:443 -p 80:80 \
          --name nm-ui \
          --mount type=bind,source=/etc/letsencrypt/live/${DOMAIN}/privkey.pem,target=/var/certificates/privkey.pem,readonly \
          --mount type=bind,source=/etc/letsencrypt/live/${DOMAIN}/fullchain.pem,target=/var/certificates/fullchain.pem,readonly \
          -v ~/docker_data/logs/nginx:/var/log/nginx \
          nm-ui:latest
fi
