# Build stage
FROM node:22-alpine AS builder

ARG VIGIL_API_KEY
ARG VIGIL_API_BASE_URL
ENV VIGIL_API_KEY=$VIGIL_API_KEY
ENV VIGIL_API_BASE_URL=$VIGIL_API_BASE_URL

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# Runtime stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
