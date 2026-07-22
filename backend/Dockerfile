# Base Image
FROM node:20

# Çalışma dizini oluştur
WORKDIR /app

# Bağımlılıkları kopyala
COPY package*.json ./

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Bağımlılıkları yükle
RUN npm config set strict-ssl false && npm install --legacy-peer-deps

# Kaynak kodları ve prisma şemasını kopyala
COPY . .

# Prisma client üret
RUN npx prisma generate

# Build al
RUN npm run build

# Portu dışa aç
EXPOSE 3001

# Uygulamayı başlat
CMD ["npm", "run", "start:migrate:prod"]
