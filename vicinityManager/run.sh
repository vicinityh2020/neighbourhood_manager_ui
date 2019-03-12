#!/bin/bash
usage="$(basename "$0") [-h] [-e env -d dns_name -w workdir -p local_port -n app_name -a api_url -b base_href]
-- Builds vcnt-ui docker
 -- Examples
 -- Production: ./run.sh -e prod -d www.example.com -a https://my.server.com:PORT -b https://my.ui.com
 -- Development: ./run.sh -e dev -d www.example.com -a localhost:3000 -b localhost:8080
 -- Local: ./run.sh [ without arguments, access on localhost:8080 ]

where:
    -h  shows help
    -e  environment [prod, dev, local (default)]
    -w  workdir [~/vicinity_nm_ui (default)]
    -p  local mode port [8080 (default)]
    -n  app name [nm-ui (default)]
    -d  dns name"

# Default configuration
PORT=8080
ENV="local"
DOMAIN=false
WORKDIR=false
NAME="nm-ui"
API_URL="localhost:3000"
BASE_HREF="localhost:8080"

# Get configuration
while getopts 'hd:d:e:w:n:a:b:' option; do
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
    w)
      WORKDIR="$OPTARG"
      ;;
    n)
      NAME="$OPTARG"
      ;;
    a)
      API_URL="$OPTARG"
      ;;
    b)
      BASE_HREF="$OPTARG"
      ;;
  esac
done

# Set WORKDIR
if [ ${WORKDIR} == false ]; then
  WORKDIR=~/vicinity_nm_ui/vicinityManager
fi

# CLEAN OLD BUILD
docker kill ${NAME} >/dev/null 2>&1
docker rm ${NAME} >/dev/null 2>&1
docker rmi ${NAME} >/dev/null 2>&1
# Copy relevant files based on ENV
cp ${WORKDIR}/docker/nginx.${ENV}.conf nginx.conf
# Update env file
cat ${WORKDIR}/app/envs/env.js | sed 's/#a#/'${API_URL}'/' | sed 's/#b#/'${BASE_HREF}'/' > ${WORKDIR}/aux
mv ${WORKDIR}/aux ${WORKDIR}/app/env.js
# Docker build
npm install
docker build -f ${WORKDIR}/Dockerfile -t ${NAME} ${WORKDIR}
# CREATE LOCAL FOLDERS
mkdir -p ~/docker_data/logs/nginx
# RUN
if [ "${ENV}" == "local" ] ; then
  echo "Running in local mode, in port ${PORT}"
  docker run -d -p ${PORT}:80 \
          --name ${NAME} \
          -v ~/docker_data/logs/nginx:/var/log/nginx \
          ${NAME}:latest
elif [ "${DOMAIN}" == false ] ; then
  echo "Missing DNS name, running non-SSL mode"
  docker run -d -p 80:80 \
          --name ${NAME} \
          -v ~/docker_data/logs/nginx:/var/log/nginx \
          ${NAME}:latest
else
  echo "Configuration complete, running SSL mode"
  docker run -d -p 443:443 -p 80:80 \
          --name ${NAME} \
          --mount type=bind,source=/etc/letsencrypt/live/${DOMAIN}/privkey.pem,target=/var/certificates/privkey.pem,readonly \
          --mount type=bind,source=/etc/letsencrypt/live/${DOMAIN}/fullchain.pem,target=/var/certificates/fullchain.pem,readonly \
          -v ~/docker_data/logs/nginx:/var/log/nginx \
          ${NAME}:latest
fi

echo "Success! Logs stored under ~/docker_data/logs/nginx"
