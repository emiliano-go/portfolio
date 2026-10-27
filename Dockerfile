# Build stage. Debian-based: easeo ships manylinux (glibc) abi3 wheels only,
# so the musl-based alpine image cannot install it.
FROM node:22-slim AS builder

ARG KATIB_GITHUB_TOKEN
ENV KATIB_GITHUB_TOKEN=$KATIB_GITHUB_TOKEN

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

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
