FROM node:18-slim

RUN apt-get update && apt-get install -y \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install

COPY . .

WORKDIR /app/server

EXPOSE 5000

CMD ["node", "index.js"]