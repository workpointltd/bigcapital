FROM ghcr.io/bigcapitalhq/server:latest as build

ARG DB_HOST= \
  DB_USER= \
  DB_PASSWORD= \
  DB_CHARSET= \
  # System database.
  SYSTEM_DB_NAME= \
  SYSTEM_DB_PASSWORD= \
  SYSTEM_DB_USER= \
  SYSTEM_DB_HOST= \
  SYSTEM_DB_CHARSET=

ENV DB_HOST=$DB_HOST \
  DB_USER=$DB_USER \
  DB_PASSWORD=$DB_PASSWORD \
  DB_CHARSET=$DB_CHARSET \
  # System database.
  SYSTEM_DB_HOST=$SYSTEM_DB_HOST \
  SYSTEM_DB_USER=$SYSTEM_DB_USER \
  SYSTEM_DB_PASSWORD=$SYSTEM_DB_PASSWORD \
  SYSTEM_DB_NAME=$SYSTEM_DB_NAME \
  SYSTEM_DB_CHARSET=$SYSTEM_DB_CHARSET

USER root
RUN apk update && \
  apk upgrade && \
  apk add git

RUN apk add --no-cache bash

# Change working dir to the server package.
WORKDIR /app/packages/server

RUN git clone https://github.com/vishnubob/wait-for-it.git

ADD docker/migration/start.sh /
RUN chmod +x /start.sh

CMD ["/start.sh"]