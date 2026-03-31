FROM node:20

WORKDIR /app

# Pass the token as a build arg
ARG GITHUB_TOKEN

# Copy package files and .npmrc first (cache-friendly)
COPY package*.json ./

# Install dependencies (uses GITHUB_TOKEN from build arg)
RUN npm install

# Copy source code
COPY . .

# Compile TypeScript
RUN npm run tsc

# Start bot
CMD ["node", "dist/index.js"]