FROM node:18-slim

RUN apt-get update && apt-get install -y \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set workdir directly to server folder
WORKDIR /app/server

# Copy only server package files first
COPY server/package*.json ./

# Install dependencies (already inside /app/server)
RUN npm install

# Copy entire project into /app
COPY . /app

EXPOSE 5000

CMD ["node", "index.js"]