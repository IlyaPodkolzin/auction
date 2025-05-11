# Auction Application

A full-stack auction application built with React, Node.js, Express, and PostgreSQL.

## Features

- User authentication with Google OAuth
- Create and manage auction lots
- Place bids on active lots
- Real-time bid updates
- View your bids and created lots
- Image upload support
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Google Cloud Platform account (for OAuth)

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auction?schema=public"
   JWT_SECRET="your-secret-key-here"
   PORT=3000
   FRONTEND_URL="http://localhost:3002"
   GOOGLE_CLIENT_ID="your-google-client-id"
   ```

4. Initialize the database:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   REACT_APP_API_URL="http://localhost:3000/api"
   REACT_APP_GOOGLE_CLIENT_ID="your-google-client-id"
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Create a new OAuth 2.0 Client ID
5. Add the following authorized JavaScript origins:
   - `http://localhost:3001`
   - `http://localhost:3002`
6. Add the following authorized redirect URIs:
   - `http://localhost:3001`
   - `http://localhost:3002`
7. Copy the Client ID and add it to both frontend and backend `.env` files

## Database Schema

The application uses the following main models:

- User: Stores user information
- Lot: Represents auction items
- Bid: Records bids placed on lots

## API Endpoints

### Authentication
- `POST /api/auth/google`: Google OAuth login
- `GET /api/auth/me`: Get current user

### Lots
- `GET /api/lots`: Get all active lots
- `GET /api/lots/my-lots`: Get user's lots
- `GET /api/lots/:id`: Get single lot
- `POST /api/lots`: Create new lot
- `PATCH /api/lots/:id/status`: Update lot status

### Bids
- `GET /api/bids/lot/:lotId`: Get bids for a lot
- `GET /api/bids/user`: Get user's bids
- `POST /api/bids`: Place a bid

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 