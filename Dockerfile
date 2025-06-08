FROM oven/bun
WORKDIR /app

COPY package.json .
COPY bun.lock .
RUN bun install --production

COPY . .
ENV NODE_ENV production
CMD ["bun", "src/index.ts", "serve"]
EXPOSE 3000