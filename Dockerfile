FROM node:22-slim

ENV NODE_ENV=production \
    PORT=8000 \
    SQLITE_PATH=/usr/src/app/data/onepiece.db

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN mkdir -p /usr/src/app/data

EXPOSE 8000

CMD ["node", "server.js"]
