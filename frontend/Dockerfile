# Base Image
FROM node:20-slim

# Çalışma dizini oluştur
WORKDIR /app

# Bağımlılıkları kopyala
COPY package*.json ./

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Bağımlılıkları yükle
RUN npm config set strict-ssl false && npm install --legacy-peer-deps

# Kaynak kodları kopyala
COPY . .

# Build al
RUN npm run build

# Portu dışa aç
EXPOSE 3000

# Uygulamayı başlat
CMD ["npm", "start"]
