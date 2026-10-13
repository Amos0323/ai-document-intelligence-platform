FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
ARG VITE_TEMPORARY_DEMO=false
ENV VITE_TEMPORARY_DEMO=$VITE_TEMPORARY_DEMO
RUN npx prisma generate && npm run build

EXPOSE 3001
ENV NODE_ENV=production
CMD ["sh", "-c", "node --import tsx prisma/bootstrap.ts && if [ \"$SEED_DEMO_DATA\" = \"true\" ]; then node --import tsx prisma/seed.ts --if-empty; fi && node --import tsx server/index.ts"]
