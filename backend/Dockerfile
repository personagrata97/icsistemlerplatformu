# Base Image
FROM node:18-alpine

# Gerekli sistem kütüphanelerini yükle (Prisma için openssl gerekli)
RUN apk add --no-cache openssl

# Çalışma dizini oluştur
WORKDIR /app

# Bağımlılıkları kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

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
