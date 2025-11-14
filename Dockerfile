# syntax=docker/dockerfile:1.4
# Node.js official image
FROM node:20 AS server-deps

# Workspace
WORKDIR /app

# Install server-side dependencies with caching
COPY package*.json ./
RUN npm install

# Build the Vue client (or copy pre-built artefacts)
FROM node:20 AS client-build
WORKDIR /workspace

ARG CLIENT_DIST_DIR=""
ARG CLIENT_DIST_ARCHIVE=""
ENV CLIENT_DIST_DIR=$CLIENT_DIST_DIR
ENV CLIENT_DIST_ARCHIVE=$CLIENT_DIST_ARCHIVE

COPY install_client.sh ./install_client.sh
COPY assets ./assets
RUN ./install_client.sh --output-dir ./assets/vuejs

# Runtime image
FROM node:20

WORKDIR /app

# Reuse cached server dependencies
COPY --from=server-deps /app/package*.json ./
COPY --from=server-deps /app/node_modules ./node_modules

# Copy sources
COPY . .

# Overwrite with the freshly built client bundle
COPY --from=client-build /workspace/assets/vuejs ./assets/vuejs

# Expose the frontend port
EXPOSE 3000

# Start the express server
CMD ["node", "index.js"]
