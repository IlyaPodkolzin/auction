FROM node:18-alpine

WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Устанавливаем serve глобально
RUN npm install -g serve

# Открываем порт 3001
EXPOSE 3001

# Запускаем приложение
CMD ["serve", "-s", "build", "-l", "3001"] 