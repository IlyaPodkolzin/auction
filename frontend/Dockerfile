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

# Устанавливаем serve глобально (используем конкретную версию)
RUN npm install -g serve@14.2.1

# Открываем порт (будет установлен через переменную окружения)
ENV PORT=3001
EXPOSE ${PORT}

# Запускаем приложение на всех интерфейсах
CMD ["sh", "-c", "serve -s build -l tcp://0.0.0.0:${PORT}"] 