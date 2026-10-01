# Build stage. Debian-based: easeo ships manylinux (glibc) abi3 wheels only,
# so the musl-based alpine image cannot install it.
FROM node:22-slim AS builder

ARG VIGIL_API_KEY
ARG VIGIL_API_BASE_URL
ENV VIGIL_API_KEY=$VIGIL_API_KEY
ENV VIGIL_API_BASE_URL=$VIGIL_API_BASE_URL

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY requirements-seo.txt ./
RUN python3 -m pip install --no-cache-dir --break-system-packages -r requirements-seo.txt

COPY . .
# `npm run build` runs scripts/generate_seo.py via prebuild, which regenerates the
# manifest + sitemap and fails the build on any SEO payload validation issue.
RUN npm run build
RUN find dist -name '*.html' -print0 | xargs -0 python3 scripts/validate_html.py


# Runtime stage
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
