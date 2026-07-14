FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN cp -r src/db/migrations dist/db/migrations

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev
RUN mkdir -p /app/uploads
EXPOSE 4000
CMD ["node", "dist/index.js"]
