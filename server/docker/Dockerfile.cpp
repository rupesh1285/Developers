FROM alpine:3.19
RUN apk add --no-cache g++ && \
    adduser -D -s /bin/sh runner
USER runner
WORKDIR /home/runner/app
