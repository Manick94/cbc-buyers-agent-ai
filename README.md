# AI Buyers Agent Companion

Full-stack AI companion app for Australian property buyers agents.

## Stack

- **Frontend**: React + TypeScript + TailwindCSS + Recharts (Vite)
- **Backend**: Node.js + Express + TypeScript + SQLite (node-sqlite3-wasm)
- **AI**: Gemini API / OpenAI API / Ollama (local) / ONNX stub
- **Voice**: Web Speech API (browser-native STT)

## Quick Start (Local)

### 1. Backend

```bash
cd backend
npm install
npm run db:init   # initialize SQLite schema
npm run seed      # load 10 sample customers
npm run dev       # starts on http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev       # starts on http://localhost:5173
```

Open http://localhost:5173

### 3. Configure AI Provider

Go to **Settings** in the app and enter your API key for Gemini or OpenAI.
If you have Ollama running locally, click **Connect** to auto-detect models.

## API Keys

| Provider | Where to get | Free tier |
|----------|-------------|-----------|
| Gemini | aistudio.google.com | Yes |
| OpenAI | platform.openai.com | No (pay per use) |
| Ollama | ollama.ai | Free (local) |

Keys are stored encrypted in localStorage — never sent to this server.

## Deploy to Render.com

1. Push this repo to GitHub
2. Go to render.com → New → Blueprint
3. Select your repo — Render reads `render.yaml` automatically
4. Set environment variables if needed
5. Render creates both services with persistent SQLite disk

## Deploy to Vercel

```bash
vercel deploy
```

Note: Vercel uses `/tmp` for SQLite (ephemeral). For persistent storage, use [Turso](https://turso.tech).

## Project Structure

```
cbc_01/
├── frontend/          # React app
│   └── src/
│       ├── components/  # UI components
│       ├── pages/       # Route pages
│       ├── services/    # API + LLM clients
│       └── types/       # TypeScript types
├── backend/           # Express API
│   └── src/
│       ├── db/          # SQLite schema + seed
│       ├── routes/      # REST endpoints
│       └── index.ts
├── models/            # ONNX model files (user-provided)
├── vercel.json
├── render.yaml
└── Dockerfile
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/customers` | List customers (filterable) |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Soft delete |
| GET | `/api/analytics/summary` | Dashboard stats |
| GET | `/api/analytics/trends` | 30-day interaction trend |
| GET | `/api/analytics/budget-distribution` | Budget buckets |
| GET | `/api/analytics/location-breakdown` | By city |
| POST | `/api/query` | Natural language CRM query |
