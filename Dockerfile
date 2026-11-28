FROM oven/bun:1.4.5@sha256:3aa040e5445efa09d75bb428a64ba50db13e2b3ac9b6b0c7f145615f62b2ee18 AS dependencies

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/a11y-testing/package.json packages/a11y-testing/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
RUN bun install --frozen-lockfile

FROM dependencies AS build

COPY . .
RUN bun run --cwd apps/web build

FROM oven/bun:1.4.5@sha256:3aa040e5445efa09d75bb428a64ba50db13e2b3ac9b6b0c7f145615f62b2ee18 AS production-dependencies

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/package.json
COPY packages/a11y-testing/package.json packages/a11y-testing/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.4.5@sha256:3aa040e5445efa09d75bb428a64ba50db13e2b3ac9b6b0c7f145615f62b2ee18 AS runtime

WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/davidvornholt/wichteln"

ENV HOST=0.0.0.0
ENV HOME=/tmp
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=production-dependencies /app/node_modules ./node_modules
# .output holds the server and the administrator's command line, which runs
# inside this container: `bun run --cwd apps/web admin status`.
COPY --from=build /app/apps/web/.output ./apps/web/.output
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/packages/db/drizzle ./packages/db/drizzle
COPY --from=build /app/packages/db/package.json ./packages/db/package.json
COPY --from=build /app/packages/db/src ./packages/db/src
COPY --from=production-dependencies /app/packages/db/node_modules ./packages/db/node_modules
RUN chmod -R a+rX /app

EXPOSE 3000

USER 65532:65532

CMD ["bun", "run", "--cwd", "apps/web", "start"]
