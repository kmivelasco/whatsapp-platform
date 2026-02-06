# WhatsApp MVP

A full-stack WhatsApp Business platform with AI-powered bot responses, real-time agent dashboard, and analytics. Built with Express + React in a monorepo.

## Features

- **WhatsApp Integration** — Send and receive messages via Meta WhatsApp Cloud API
- **AI Bot Responses** — Automatic replies powered by OpenAI GPT-4o with configurable system prompts
- **Bot/Human Handover** — Seamless toggle between AI bot mode and live agent mode per conversation
- **Real-time Dashboard** — Live conversation updates via Socket.io with unread counts
- **Role-Based Access** — Admin, Agent, and Viewer roles with JWT authentication
- **Analytics & Reporting** — Token usage, cost breakdown, message volume, and response time charts
- **Data Export** — Export conversations and analytics as CSV or PDF
- **Audit Logging** — Track all user actions for compliance

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite 6, TypeScript, Tailwind CSS 4, Zustand, React Query, Recharts, Socket.io-client |
| **Backend** | Node.js, Express 4, TypeScript, Socket.io, JWT, bcryptjs, Zod |
| **Database** | PostgreSQL 16, Prisma ORM 6 |
| **AI** | OpenAI GPT-4o |
| **Messaging** | Meta WhatsApp Cloud API |
| **DevOps** | Docker, docker-compose, GitHub Actions |

## Project Structure

```
whatsapp-mvp/
├── server/                 # Express API + WebSocket server
│   ├── prisma/             # Database schema & migrations
│   └── src/
│       ├── config/         # Env, database, socket setup
│       ├── middleware/      # Auth, RBAC, rate limiting, error handling
│       ├── routes/         # API route definitions
│       ├── controllers/    # Request handlers
│       ├── services/       # Business logic (bot pipeline, WhatsApp, OpenAI)
│       ├── validators/     # Zod input schemas
│       └── types/          # TypeScript type definitions
├── client/                 # React SPA
│   └── src/
│       ├── pages/          # Login, Dashboard, Analytics, Settings, History
│       ├── components/     # Chat, analytics, layout, common components
│       ├── hooks/          # React Query hooks, socket hook
│       ├── stores/         # Zustand state (auth, chat)
│       ├── api/            # Axios client with interceptors
│       └── utils/          # Formatters, constants
├── docker/                 # Dockerfiles + nginx config
└── .github/workflows/      # CI/CD pipeline
```

## Prerequisites

- **Node.js** >= 20
- **Docker** & **docker-compose** (for PostgreSQL)
- **Meta WhatsApp Business** account with Cloud API access
- **OpenAI** API key

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/whatsapp-mvp.git
cd whatsapp-mvp
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT signing (use a strong random string) |
| `JWT_EXPIRES_IN` | Token expiry (e.g., `7d`) |
| `WHATSAPP_API_TOKEN` | Meta Cloud API permanent token |
| `WHATSAPP_PHONE_NUMBER_ID` | Your WhatsApp phone number ID |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Your WhatsApp Business account ID |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verification token (you define this) |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_DEFAULT_MODEL` | Default model (e.g., `gpt-4o`) |
| `PORT` | Server port (default: `3001`) |
| `CORS_ORIGIN` | Frontend URL (default: `http://localhost:5173`) |

### 3. Start with Docker (recommended)

```bash
docker-compose up
```

This starts PostgreSQL, the Express server (port 3001), and the React dev server (port 5173).

### 4. Or start manually

```bash
# Terminal 1: Start PostgreSQL (via Docker or local install)
docker-compose up postgres

# Terminal 2: Setup database and start server
cd server
npx prisma migrate dev
npx tsx prisma/seed.ts    # Creates default admin user
npm run dev

# Terminal 3: Start client
cd client
npm run dev
```

### 5. Access the app

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3001/api
- **Health check:** http://localhost:3001/api/health

### Default admin credentials (from seed)

- **Email:** `admin@whatsapp-mvp.com`
- **Password:** `admin123`

> Change the default password immediately in production.

## WhatsApp Webhook Setup

1. Go to [Meta for Developers](https://developers.facebook.com/) and open your WhatsApp app
2. Under **Webhooks**, set the callback URL to:
   ```
   https://<your-server-domain>/api/webhook
   ```
3. Set the **Verify Token** to match your `WHATSAPP_VERIFY_TOKEN` env variable
4. Subscribe to the `messages` webhook field

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register new user | — |
| `POST` | `/api/auth/login` | Login | — |
| `GET` | `/api/users` | List users | Admin |
| `GET` | `/api/users/me` | Current user profile | Any |
| `PUT` | `/api/users/:id` | Update user | Admin |
| `GET` | `/api/conversations` | List conversations | Any |
| `GET` | `/api/conversations/:id` | Get conversation | Any |
| `PUT` | `/api/conversations/:id/mode` | Toggle bot/human mode | Agent+ |
| `PUT` | `/api/conversations/:id/status` | Update status | Agent+ |
| `GET` | `/api/messages/:conversationId` | Get messages | Any |
| `POST` | `/api/messages/:conversationId` | Send agent message | Agent+ |
| `GET/POST` | `/api/webhook` | WhatsApp webhook | — |
| `GET` | `/api/analytics/tokens` | Token usage stats | Any |
| `GET` | `/api/analytics/costs` | Cost breakdown | Any |
| `GET` | `/api/analytics/volume` | Message volume | Any |
| `GET` | `/api/analytics/response-times` | Response times | Any |
| `GET` | `/api/bot-configs` | List bot configs | Any |
| `POST` | `/api/bot-configs` | Create bot config | Admin |
| `PUT` | `/api/bot-configs/:id` | Update bot config | Admin |
| `DELETE` | `/api/bot-configs/:id` | Delete bot config | Admin |
| `GET` | `/api/export/conversations` | Export conversations CSV | Any |
| `GET` | `/api/export/conversations/:id` | Export conversation CSV/PDF | Any |
| `GET` | `/api/export/analytics` | Export analytics CSV | Any |

## Database Schema

7 tables managed by Prisma:

- **User** — Platform users with roles (Admin/Agent/Viewer)
- **Client** — WhatsApp contacts (auto-created on first message)
- **Conversation** — Chat sessions with status and bot/human mode
- **Message** — Individual messages with sender type tracking
- **TokenUsage** — OpenAI token consumption per AI response
- **AuditLog** — User action audit trail
- **BotConfig** — AI bot configuration (system prompt, model, temperature)

```bash
# View schema
npx prisma studio          # Opens visual DB browser
npx prisma migrate dev     # Apply migrations
npx tsx prisma/seed.ts     # Seed default data
```

## Architecture

```
WhatsApp User → Meta Cloud API → Webhook → Bot Pipeline → OpenAI GPT-4o
                                     │              │
                                     ↓              ↓
                                 Store Message   Send Reply via WA
                                     │
                                     ↓
                              Socket.io → Agent Dashboard (React)
```

**Bot Pipeline** is the core orchestrator:
1. Receives incoming WhatsApp message via webhook
2. Auto-creates Client if new phone number
3. Creates or finds active Conversation
4. Checks conversation mode (BOT or HUMAN)
5. If BOT: generates AI response via OpenAI, sends reply via WhatsApp
6. Stores all messages in database with metadata
7. Records token usage and estimated cost
8. Emits real-time events via Socket.io

## Deployment

### GitHub Pages (Frontend Only)

The client is configured for GitHub Pages deployment. A GitHub Actions workflow auto-deploys on push to `main`.

**Setup:**
1. Go to your repo **Settings > Pages**
2. Set source to **GitHub Actions**
3. Optionally set `VITE_API_URL` and `VITE_WS_URL` in repo **Settings > Variables** to point to your deployed backend

> GitHub Pages only hosts static files. The Express backend and PostgreSQL must be deployed separately (e.g., Railway, Render, Fly.io, AWS).

### Docker Production

```bash
# Build and run production containers
docker-compose -f docker-compose.yml up --build
```

For production, update the environment variables with real secrets and configure the nginx reverse proxy in `docker/nginx.conf`.

## Development

```bash
# Run both server and client in dev mode
npm run dev

# Run server only
npm run dev -w server

# Run client only
npm run dev -w client

# Build everything
npm run build

# Run tests
npm test

# Prisma commands
npm run db:generate -w server   # Generate Prisma client
npm run db:migrate -w server    # Run migrations
npm run db:seed -w server       # Seed database
npm run db:studio -w server     # Visual DB browser
```

## License

MIT
