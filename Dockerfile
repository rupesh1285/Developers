# Use official Node.js image
FROM node:18-slim

# Install g++ and other build tools
RUN apt-get update && apt-get install -y \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files for the server
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
cd server && npm install

# Copy the rest of the application
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the backend
CMD ["npm", "run", "server"]
