# Healthcare Appointment & Follow-up Manager

This is the project foundation (Part 1) for the Healthcare Appointment & Follow-up Manager.

## Project Structure

- `client/` - React + Vite + TypeScript + Tailwind CSS (v4) frontend.
- `server/` - Node.js + Express + TypeScript backend.

## Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, React Router.
- **Backend**: Node.js, Express, TypeScript, CORS, Dotenv.
- **Package Manager**: npm.

## Setup & Installation

To install all dependencies in both the root, client, and server, run the following command from the root directory:

```bash
npm run install:all
```

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

- **Backend only**: `npm run dev:server`
- **Frontend only**: `npm run dev:client`

## API Endpoints

- **Health Check**: `GET http://localhost:5000/api/health`
  - Response:
    ```json
    {
      "success": true,
      "message": "Healthcare Appointment Manager API is running"
    }
    ```
