FROM node:18-slim

RUN apt-get update && apt-get install -y \
    g++ \
    clang \
    && rm -rf /var/lib/apt/lists/*

# Copy entire project first
WORKDIR /app
COPY . .

# Then install server dependencies
WORKDIR /app/server
RUN npm install

EXPOSE 5000

CMD ["node", "index.js"]