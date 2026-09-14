FROM node:20-alpine

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    git

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

RUN npm run build

COPY . .

EXPOSE 5000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "dist/index.js"]
