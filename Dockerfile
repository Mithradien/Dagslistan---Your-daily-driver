FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install
COPY . .
RUN bunx vite build -c vite.static.config.ts

FROM nginx:alpine
COPY --from=build /app/dist-static /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  location / { try_files $uri /index.html; }\n  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
