# Dockerfile ini bikin server punya "otak" (Node.js) + "tangan" (ffmpeg)
# buat proses video. Railway/Render otomatis pakai file ini kalau ada,
# jadi kamu TIDAK perlu install apa pun manual.

FROM node:20-bookworm

# Install ffmpeg (buat potong/render video) + fonts (buat caption)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    fonts-dejavu \
    fonts-liberation \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
