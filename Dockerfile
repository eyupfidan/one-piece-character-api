FROM node:22-slim AS build

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
ENV NODE_ENV=production \
    PORT=8000 \
    SQLITE_PATH=/usr/src/app/data/onepiece.db

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/config ./config
COPY --from=build /usr/src/app/README.md ./README.md
COPY --from=build /usr/src/app/README.tr.md ./README.tr.md
RUN mkdir -p /usr/src/app/data

EXPOSE 8000
CMD ["node", "dist/server.js"]
