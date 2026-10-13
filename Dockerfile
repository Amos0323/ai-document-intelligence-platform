FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

EXPOSE 3001
ENV NODE_ENV=production
CMD ["sh", "-c", "node --import tsx prisma/bootstrap.ts && node --import tsx server/index.ts"]
