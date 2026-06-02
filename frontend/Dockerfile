# Base Image
FROM node:20-alpine

# Çalışma dizini oluştur
WORKDIR /app

# Bağımlılıkları kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install --legacy-peer-deps

# Kaynak kodları kopyala
COPY . .

# Build al
RUN npm run build

# Portu dışa aç
EXPOSE 3000

# Uygulamayı başlat
CMD ["npm", "start"]
