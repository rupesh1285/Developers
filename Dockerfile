FROM node:18-slim

RUN apt-get update && apt-get install -y \
    g++ \
    clang \
    python3 \
    openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*

# 🚀 PRE-COMPILE C++ HEADERS FOR INSTANT SPEED
# Pre-compiling bits/stdc++.h makes compilation 10x faster on restricted CPUs
RUN mkdir -p /usr/include/x86_64-linux-gnu/bits && \
    clang++ -x c++-header /usr/include/c++/11/bits/stdc++.h -o /usr/include/c++/11/bits/stdc++.h.pch -O0

# Copy entire project first
WORKDIR /app
COPY . .

# Then install server dependencies
WORKDIR /app/server
RUN npm install

EXPOSE 5000

CMD ["node", "index.js"]