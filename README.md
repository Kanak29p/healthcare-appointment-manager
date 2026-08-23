# Healthcare Appointment & Follow-up Manager

This is the project foundation (Part 2) for the Healthcare Appointment & Follow-up Manager.

## Project Structure

- `client/` - React + Vite + TypeScript + Tailwind CSS (v4) frontend.
- `server/` - Node.js + Express + TypeScript backend connected to PostgreSQL via Prisma.

## Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, React Router, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript, CORS, Dotenv, JWT, bcrypt, Zod.
- **Database**: PostgreSQL, Prisma.
- **Package Manager**: npm.

## Setup & Installation

To install all dependencies in the root, client, and server, run the following command from the root directory:

```bash
npm run install:all
```

## Environment Configuration

Create a `.env` file inside the `server/` directory and configure the environment variables (see `.env.example` at root for placeholders):

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
DATABASE_URL="postgresql://username:password@localhost:5432/healthcare_db?sslmode=prefer"
CLIENT_URL=http://localhost:5173
```

## Database Migrations & Seeding

Ensure your database is running (or you have the database URL configured), then perform the following commands inside the `server/` folder:

1. **Run Migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

2. **Seed Default Admin**:
   ```bash
   npx prisma db seed
   ```

This will seed a default administrative user. You can customize the admin credentials during seeding by setting these environment variables:
- `ADMIN_EMAIL` (default: `admin@aegishealth.com`)
- `ADMIN_PASSWORD` (default: `AdminPassword123!`)
- `ADMIN_NAME` (default: `System Administrator`)

## Running the Application

### Running Both Frontend & Backend (Concurrently)

From the root directory:

```bash
npm run dev
```

This will concurrently run:
- Frontend on: `http://localhost:5173`
- Backend on: `http://localhost:5000`

### Running Individually

- **Backend only**: `npm run dev:server` (from root) or `npm run dev` (inside `server/`)
- **Frontend only**: `npm run dev:client` (from root) or `npm run dev` (inside `client/`)

## API Endpoints

### Health check
- `GET /api/health`

### Authentication Routes
- `POST /api/auth/register` (Registers a new Patient)
- `POST /api/auth/login` (Generates JWT session token)
- `GET /api/auth/me` (Requires Bearer token; retrieves current user profile and role details)
