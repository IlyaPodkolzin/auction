# Антикварный аукцион

Фуллстек-приложение для аукциона антиквариата и памятных вещей.
Разработано в рамках курсовой работы по дисциплине "Разработка клиент-серверных приложений".

## Функционал

- Аутентификация/авторизация через Google OAuth
- Создание/удаление лотов
- Создание/удаление ставок для активных лотов
- Личный кабинет со статистикой проданных лотов
- Загрузка фотографий для лота
- Отзывчивый дизайн
- Наличие системы уведомлений

## Требования

- Node.js (v14 или выше)
- PostgreSQL (v12 или выше)
- Аккаунт Google Cloud Platform (для OAuth)

## Настройка

### Серверная часть

1. Перейдите в директорию backend:
   ```bash
   cd backend
   ```

2. Установите зависимости:
   ```bash
   npm install
   ```

3. Создайте `.env` со следующими переменными окружения:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auction?schema=public"
   JWT_SECRET="your-secret-key-here"
   PORT=3000
   FRONTEND_URL="http://localhost:3002"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. Инициируйте базу данных:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. Запустите сервер:
   ```bash
   npm run dev
   ```

### Клиентская часть

1. Перейдите в директорию frontend:
   ```bash
   cd frontend
   ```

2. Установите зависимости:
   ```bash
   npm install
   ```

3. Создайте `.env` со следующими переменными окружения:
   ```
   REACT_APP_API_URL="http://localhost:3000/api"
   REACT_APP_GOOGLE_CLIENT_ID="your-google-client-id"
   REACT_APP_WS_URL="ws://localhost:3000/api"
   PORT=3001
   ```

4. Запустите клиент:
   ```bash
   npm start
   ```

## Настройка Google OAuth

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект
3. Перейдите в "APIs & Services" > "Credentials"
4. Создайте новый OAuth 2.0 Client ID
5. Добавьте authorized JavaScript origins:
   - `http://localhost:3001`
6. Добавьте authorized redirect URIs:
   - `http://localhost:3001`
   - `http://localhost:3001:login`
7. Скопируйте Client ID и Client Secret и добавьте в `.env`

## Схема базы данных

Главные модели приложения:

- User: пользователь
- Lot: лот
- Bid: ставка
- Notification: уведомление

## Конечные точки API

### Авторизация
- `POST /api/auth/google`: через Google OAuth
- `GET /api/auth/me`: текущий пользователь

### Лоты
- `GET /api/lots`: все активные лоты
- `GET /api/lots/my-lots`: лоты пользователя
- `GET /api/lots/:id`: конкретный лот
- `POST /api/lots`: создать новый лот
- `DELETE /api/lots/:id`: удалить конкретный лот

### Ставки
- `GET /api/bids/lot/:lotId`: ставки на конкретный лот
- `GET /api/bids/user`: ставки пользователя
- `POST /api/bids`: сделать ставку
- `DELETE /api/bids/:id`: удалить конкретную ставку

## Уведомления
- `GET /api/notifications/`: все уведомления пользователя
- `PATCH /api/notifications/:id/read`: пометить уведомление прочитанным
- `PATCH /api/notifications/read-all`: пометить все уведомления пользователя прочитанными
- `DELETE /api/notifications/`: удалить все уведомления пользователя
- `DELETE /api/notifications/:id`: удалить конкретное уведомление пользователя
