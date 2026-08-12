FROM node:18-slim

RUN apt-get update && apt-get install -y \
    g++ \
    clang \
    python3 \
    openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*

# Pre-compile C++ headers for faster C++ runs
RUN STD_PATH=$(find /usr/include -name "stdc++.h" | head -n 1) && \
    clang++ -x c++-header "$STD_PATH" -o /usr/include/stdc++.h.pch -O0

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY server ./server

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server/index.js"]
