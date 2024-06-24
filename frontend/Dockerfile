FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:18-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_TRACKING_SERVICE_URL
ENV NEXT_PUBLIC_TRACKING_SERVICE_URL=${NEXT_PUBLIC_TRACKING_SERVICE_URL}
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-slim AS release
WORKDIR /app
COPY --from=build /app/.next/standalone ./standalone
CMD ["node", "./standalone/server.js"]