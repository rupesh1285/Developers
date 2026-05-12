FROM node:18-slim

RUN apt-get update && apt-get install -y \
    g++ \
    clang \
    python3 \
    openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*

# 🚀 PRE-COMPILE C++ HEADERS FOR INSTANT SPEED
# Dynamically find stdc++.h and pre-compile it to a fixed location
RUN STD_PATH=$(find /usr/include -name "stdc++.h" | head -n 1) && \
    clang++ -x c++-header "$STD_PATH" -o /usr/include/stdc++.h.pch -O0

# Copy entire project first
WORKDIR /app
COPY . .

# Then install server dependencies
WORKDIR /app/server
RUN npm install

EXPOSE 5000

CMD ["node", "index.js"]