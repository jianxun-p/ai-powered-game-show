# AI Powered Game Show

This project is an AI-powered trivia web app inspired by game-show mechanics (**Who Wants to Be a Millionaire** with added features). Players choose categories, answer timed questions, and move up a money ladder across 10 rounds. The system supports two round types: standard multiple-choice and drawing-based challenges. Difficulty adapts over time so gameplay feels responsive to player performance.

## How the System Works

The frontend is a React single-page app (Vite) that manages game state, timer logic, score, streak, and screen transitions (start, gameplay, results, summary). For each round, it calls backend APIs to generate a new question, then submits the player response for evaluation.

The backend is an Express server that orchestrates gameplay and AI calls. It exposes endpoints for:
- Question generation
- Answer checking for multiple-choice
- Drawing prompt generation
- Drawing evaluation using image input

Session is used to keep track of the questions that the client has done. 

## How AI Is Used

AI is central to gameplay quality and variety:
- A language model generates multiple-choice questions with one correct answer, three wrong answers, explanations, and host-style reactions.
- A language model also generates drawing tasks and expected visual elements.
- A multimodal model evaluates player drawings from submitted image data and returns correctness, confidence, missing elements, and feedback.

The backend constrains model output to structured JSON and validates schema before returning data to the client. This improves reliability and simplifies frontend rendering.

## How Data Is Used

Data used by the system is lightweight and gameplay-focused:
- Input data: category selection, chosen answer, difficulty, streak, and drawing image data.
- Session data: current question, correct answer, round metadata, and recent question history.
- Output data: correctness, explanation, host reaction, feedback, and next difficulty.

No long-term user profile or analytics pipeline is required for core operation. Most state is ephemeral and tied to a gameplay session.

## Key Design and Architecture Decisions

- Server-side answer authority: The backend stores current question state in session and verifies answers there, reducing tampering risk.
- Adaptive difficulty: Difficulty moves up after correct streaks and down on misses, balancing challenge and accessibility.
- Mixed question modes: Combining multiple-choice and drawing increases variety and demonstrates text + vision AI use.
- Structured contracts: Clear request/response shapes between frontend and backend reduce ambiguity and improve maintainability.
- Deployability: Dockerized app with Nginx reverse proxy supports production-style routing, compression, and health checks.

## Tools Used

- Frontend: React, Vite, ESLint
- Backend: Node.js, Express, express-session, CORS
- AI integration: OpenAI API (language + multimodal models)
- Deployment/runtime: Docker, Docker Compose, Nginx
- Environment/config: dotenv

Overall, the system is designed as a practical AI application: the frontend focuses on game experience, while the backend controls AI orchestration, validation, and security-sensitive game logic.
