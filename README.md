# Adaptive Millionaire

Adaptive Millionaire is an AI-powered game show web app inspired by Who Wants to Be a Millionaire.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- AI: OpenAI API (`gpt-4.1-mini`)

## Features

- Start screen with selectable preferred categories
- AI-generated multiple-choice questions (4 options)
- AI-powered answer validation and explanation
- AI game-show host reaction after each answer
- Adaptive difficulty (`easy` -> `medium` -> `hard`)
- Score tracking, streak tracking, 15-second timer, and money ladder progress

## How AI Is Used

AI is essential in 4 gameplay steps:

1. Question generation (`POST /api/question`)
2. Answer validation (`POST /api/answer`)
3. Explanation generation (`POST /api/answer`)
4. Host personality reaction (`POST /api/answer`)

## Project Structure

- `server/server.js`: Express app and API routes
- `server/routes/openai.js`: OpenAI integrations for question generation, validation, explanation, and host reaction
- `client/src/App.jsx`: Main app state and gameplay loop
- `client/src/components/`: UI components (`StartScreen`, `GameScreen`, `ResultPanel`, `MoneyLadder`)

## API Contract

### `POST /api/question`

Input:

```json
{
  "category": "Technology",
  "difficulty": "easy"
}
```

Output:

```json
{
  "question": "...",
  "wrongAnswers": ["...", "...", "..."],
  "correctAnswer": "...",
  "explanation": "..."
}
```

### `POST /api/answer`

Input:

```json
{
  "questionData": {
    "question": "...",
    "wrongAnswers": ["...", "...", "..."],
    "correctAnswer": "...",
    "explanation": "...",
    "category": "Technology"
  },
  "selectedAnswer": "...",
  "streak": 1,
  "difficulty": "easy"
}
```

Output:

```json
{
  "correct": true,
  "explanation": "...",
  "hostReaction": "...",
  "nextDifficulty": "medium"
}
```

Difficulty logic:

- 2 correct in a row -> increase difficulty
- wrong answer -> decrease difficulty

## Setup

### 1. Install dependencies

```bash
npm install --prefix server
npm install --prefix client
```

### 2. Configure environment

Create a file at `server/.env`:

```env
OPENAI_API_KEY=your_key_here
PORT=4000
```

You can copy from `server/.env.example`.

### 3. Run backend

```bash
npm run dev --prefix server
```

### 4. Run frontend

```bash
npm run dev --prefix client
```

Open the Vite URL shown in terminal (typically `http://localhost:5173`).

## Architecture Overview

1. Frontend starts game after category selection.
2. Frontend requests a question from backend using category + current difficulty.
3. Backend prompts OpenAI (`gpt-4.1-mini`) and returns structured question JSON.
4. User selects an answer.
5. Frontend posts answer payload to backend.
6. Backend uses AI to validate correctness, generate explanation, and generate host reaction.
7. Backend applies difficulty transition logic and returns result.
8. Frontend updates score/streak and loads next round.

## Docker Deployment

### Architecture

The Docker setup uses:
- **Node.js app** (`app`): Handles API routes, question generation, and serves static client files
- **Nginx** (`nginx`): Reverse proxy that sits in front of the app, handles routing, compression, and HTTP optimizations

### Build and Run with Docker

Build the image:

```bash
docker build -t ai-powered-game-show .
```

Run the container:

```bash
docker run -p 4000:4000 \
  -e OPENAI_API_KEY=your_key_here \
  -e CLIENT_URL=http://localhost:4000 \
  ai-powered-game-show
```

### Using Docker Compose (Recommended)

Create a `.env` file in the root directory with your configuration:

```env
OPENAI_API_KEY=your_key_here
PORT=4000
NODE_ENV=production
CLIENT_URL=http://localhost
HTTP_PORT=80
```

Then run:

```bash
docker-compose up --build
```

Access the app at `http://localhost`. Nginx will proxy requests to the Node.js backend.

**Environment variables:**
- `OPENAI_API_KEY` — Your OpenAI API key (required)
- `PORT` — Internal app port (default: 4000)
- `HTTP_PORT` — External HTTP port exposed by nginx (default: 80)
- `NODE_ENV` — Set to `production` or `development`
- `CLIENT_URL` — Client base URL for CORS (default: http://localhost)

### Nginx Configuration

Nginx is configured to:
- Proxy all `/api/*` requests to the Node.js backend
- Proxy all other requests to the backend for client-side routing
- Enable gzip compression for text and JSON responses
- Provide a `/health` endpoint for container health checks
- Forward real IP and protocol headers to the backend

The nginx configuration is in [nginx.conf](nginx.conf). For production with HTTPS, uncomment the SSL block and provide your certificates.

### Quick Start for Development

For local development with live reload:

1. Modify `docker-compose.yml`: Uncomment the volumes and command in the `app` service
2. Run `docker-compose up --build`
3. Access at `http://localhost`

## Notes

- In development (without Docker), Vite proxies `/api` requests to `http://localhost:4000`.
- If OpenAI key is missing, backend routes will return an error.
- Docker image is multi-stage: builds React/Vite frontend, then bundles with Node.js server.
- The server serves both API routes and static client files.
- Nginx acts as a reverse proxy and provides optimizations like gzip compression and health checks.
