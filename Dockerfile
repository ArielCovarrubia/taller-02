# BUILD STAGE ========================================================

FROM node:24-slim AS build

WORKDIR /app

RUN npm install -g pnpm@10

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# DEVELOPMENT STAGE ========================================================

FROM build AS dev

ENV NODE_ENV=development

EXPOSE 3000

CMD ["pnpm", "run", "start:dev"]

# PRODUCTION STAGE ========================================================

FROM node:24-slim AS prod

ENV NODE_ENV=production

WORKDIR /app

# pnpm is installed here only to run `pnpm prune --prod` a few lines below.
# The app is executed with `node dist/main`, not pnpm. If we did not prune,
# devDependencies would ship inside the image. pnpm stays in the final image
# as a side effect of this step (small, harmless), and could be removed with
# `npm uninstall -g pnpm` if a truly minimal image were required.
RUN npm install -g pnpm@10

COPY package.json pnpm-lock.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

# Remove devDependencies from node_modules, leaving only what runtime needs.
RUN pnpm prune --prod

USER node

EXPOSE 3000

CMD ["node", "dist/main"]
