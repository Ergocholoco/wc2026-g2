FROM node:18-bookworm-slim

WORKDIR /app

# better-sqlite3 compiles a native addon at install time; these are required for that build
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3005

CMD ["node", "index.js"]
