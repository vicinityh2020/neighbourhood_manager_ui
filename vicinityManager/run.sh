#!/bin/bash
usage="$(basename "$0") [-h -s] [-e env -p web_port -b web_dns -q api_port -a api_dns -n app_name -w workdir ]
-- Builds vcnt-ui docker
 -- Examples
 -- Production: ./run.sh -s -e prod -a api.vicinity.bavenir.eu -b my.ui.com
 -- Development: ./run.sh -e dev -a api.vicinity.dev.bavenir.eu -b localhost:8080 -w .
 -- Local: ./run.sh -w . [ without arguments, access on localhost:8080 ]

where:
    -h  shows help
    -s  enables ssl [ Without arguments ]
    -e  environment [prod, dev, local (default)]
    -p  web port [8080 (default)]
    -q  api server port [3000 (default)]
    -b  web dns [localhost (default)]
    -a  api dns [localhost (default)]
    -w  workdir [ ~ (default)]
    -n  app name [nm-ui (default)]"

# Default configuration
SSL=false
WEB_DNS="localhost"
WEB_PORT=8080
API_DNS="localhost"
API_PORT=3000
ENV="local"
WORKDIR=false
NAME="nm-ui"

# Get configuration
while getopts 'hd:sd:p:q:e:w:n:a:b:' option; do
  case "$option" in
    h) echo "$usage"
      exit
      ;;
    s)
      SSL=true
      ;;
    e)
      ENV="$OPTARG"
      ;;
    w)
      WORKDIR="$OPTARG"
      ;;
    n)
      NAME="$OPTARG"
      ;;
    a)
      API_DNS="$OPTARG"
      ;;
    b)
      WEB_DNS="$OPTARG"
      ;;
    p)
      WEB_PORT="$OPTARG"
      ;;
    q)
      API_PORT="$OPTARG"
      ;;
  esac
done

# Set WORKDIR
if [ ${WORKDIR} == false ]; then
  WORKDIR=~/vicinity_nm_ui/vicinityManager
# else
#   WORKDIR=${WORKDIR}/vicinity_nm_ui/vicinityManager
fi

# Build full URL
# if [ ${ENV} == "local" ]; then
#   API_URL=localhost:${API_PORT}
#   WEB_URL=localhost:${WEB_PORT}
# else
  API_URL=${API_DNS}:${API_PORT}
  WEB_URL=${WEB_DNS}:${WEB_PORT}
  if [ ${WEB_PORT} == 80 ]; then
    WEB_URL=${WEB_DNS}
  fi
  if [ ${API_PORT} == 80 ]; then
    API_URL=${API_DNS}
  fi
# fi

# CLEAN OLD BUILD
docker kill ${NAME} >/dev/null 2>&1
docker rm ${NAME} >/dev/null 2>&1
# docker rmi ${NAME} >/dev/null 2>&1

# Update nginx conf
if [ ${SSL} == true ]; then
  cat ${WORKDIR}/docker/nginx.ssl.conf | sed 's/#b#/'${WEB_DNS}'/' > ${WORKDIR}/aux
  PROTOCOL="https"
else
  cat ${WORKDIR}/docker/nginx.nossl.conf | sed 's/#b#/'${WEB_DNS}'/' > ${WORKDIR}/aux
  PROTOCOL="https"
fi
# Backend is SSL unless local settings
if [ "${ENV}" == "local" ] ; then
  PROTOCOL="http"
  BASE_API="localhost:3000"
  BASE_WEB="localhost:8080"
else
  PROTOCOL="https"
  if [ "${ENV}" == "prod" ] ; then
    BASE_API="api.vicinity.bavenir.eu"
    BASE_WEB="vicinity.bavenir.eu"
  else
    BASE_API="api.vicinity.dev.bavenir.eu"
    BASE_WEB="vicinity.dev.bavenir.eu"
  fi
fi
mv ${WORKDIR}/aux ${WORKDIR}/nginx.conf

# Update env file
cat ${WORKDIR}/app/envs/env.js \
  | sed 's/#a#/'${BASE_API}'/' \
  | sed 's/#b#/'${BASE_WEB}'/' \
  | sed 's/#c#/'${PROTOCOL}'/' \
  > ${WORKDIR}/aux
mv ${WORKDIR}/aux ${WORKDIR}/app/env.js

# Docker build
if [ ${ENV} != "local" ]; then
  cd ${WORKDIR} && bower install -F
  cd ${WORKDIR} && npm install
fi
docker build -f ${WORKDIR}/Dockerfile -t ${NAME} ${WORKDIR}
# CREATE LOCAL FOLDERS
mkdir -p ~/docker_data/logs/nginx
# RUN
if [ "${ENV}" == "local" ] ; then
  echo "Running in local mode, in port ${WEB_PORT}"
  docker run -d -p ${WEB_PORT}:80 \
          --name ${NAME} \
          -v ~/docker_data/logs/nginx:/var/log/nginx \
          ${NAME}:latest
elif [ "${SSL}" == true ] && [ "${WEB_DNS}" == "localhost" ]; then
  echo "Not possible to have SSL connection without a valid DNS"
  exit 1
elif [ "${SSL}" == false ] || [ "${WEB_DNS}" == "localhost" ]; then
  echo "Running non-SSL mode"
  docker run -d -p ${WEB_PORT}:80 \
          --restart always \
          --name ${NAME} \
          -v ~/docker_data/logs/nginx:/var/log/nginx \
          ${NAME}:latest
else
  echo "Configuration complete, running SSL mode"
  docker run -d -p 443:443 -p 80:80 \
          --name ${NAME} \
          --restart always \
          --mount type=bind,source=/etc/letsencrypt/live/${WEB_DNS}/privkey.pem,target=/var/certificates/privkey.pem,readonly \
          --mount type=bind,source=/etc/letsencrypt/live/${WEB_DNS}/fullchain.pem,target=/var/certificates/fullchain.pem,readonly \
          -v ~/docker_data/logs/nginx:/var/log/nginx \
          ${NAME}:latest
fi

echo "Success! Logs stored under ~/docker_data/logs/nginx"
