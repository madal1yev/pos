# 🚀 POS AI Agent Platform

**Production-ready Telegram AI Business Agent Platform with POS integration**

A 24/7 AI-powered business intelligence platform that connects Telegram bots with POS systems, providing real-time analytics, automated reporting, and intelligent business management through natural language conversations.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Telegram    │────▶│  AI Agent Engine  │────▶│  Tool Registry   │
│  Bot        │     │  (Process Messages│     │  (READ/WRITE)    │
│  Webhooks   │     │   + Memory +      │     └────────┬────────┘
└─────────────┘     │   Planning)       │              │
                    └──────────────────┘              │
                            │                         │
                    ┌───────▼──────────────┐          │
                    │  POS Adapter Layer    │──────────┘
                    │  (REST API + WS)    │          │
                    └─────────────────────┘          │
                            │                         │
                    ┌───────▼──────────────┐          │
                    │  Database (SQLite/PG) │◀─────────┘
                    │  + Redis + Queue     │
                    └─────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Node.js 20+, TypeScript, Express |
| **Telegram** | Telegraf.js |
| **Database** | SQLite (local) / PostgreSQL (production) |
| **Cache/Queue** | Redis + BullMQ |
| **AI** | OpenAI API (GPT-4o-mini), extensible to Anthropic/Gemini |
| **Logging** | Winston |
| **Validation** | Zod |
| **Testing** | Jest |
| **Deployment** | Docker + Docker Compose |
| **Process Manager** | PM2 (production) |

## Features

### 🤖 AI Agent Core
- Natural language understanding
- Multi-step reasoning (UNDERSTAND → PLAN → USE TOOLS → VERIFY → RESPOND)
- Conversation memory with context retrieval
- Business memory for preferences and important facts
- Multi-language support (Uzbek, Russian, English)

### 📊 Real-time Analytics
- Daily/weekly/monthly sales reports
- Product performance analysis
- Customer behavior insights
- Inventory monitoring
- Revenue comparison

### 📦 POS Integration
- Adapter pattern for any POS system
- Real-time product/order/sales data
- Inventory status
- Customer database access
- Read/write operations with confirmation

### ⚙️ Automation Engine
- Scheduled reports (daily 22:00, weekly Monday, monthly end)
- Threshold alerts (low stock, revenue drops)
- Event-driven automations
- Per-tenant timezone support
- Duplicate prevention

### 🔒 Security
- Multi-tenant isolation
- RBAC (Super Admin → Business Owner → Manager → Employee)
- Tenant-scoped queries
- Input validation & sanitization
- Rate limiting
- Audit logs for all actions
- Write-action confirmation system

### 📈 Reports
- Telegram text reports
- PDF generation
- Excel/CSV export
- Scheduled automatic delivery

## Quick Start

### Prerequisites
- Node.js 18+
- Docker + Docker Compose (optional, for production)
- PostgreSQL (for production)
- Telegram Bot Token

### Installation

```bash
# Clone and cd
cd "POS agent"

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# - BOT_TOKEN: Your Telegram bot token
# - OPENAI_API_KEY: Your OpenAI API key
# - DATABASE_URL: (optional) PostgreSQL connection string

# Run database migrations
npm run db:migrate

# Seed default data
npm run db:seed

# Development mode
npm run dev

# Build for production
npm run build

# Production start
npm start
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f agent

# Stop services
docker-compose down
```

## Environment Variables

See `.env.example` for all configuration options. Key settings:

| Variable | Description | Default |
|----------|-------------|---------|
| `BOT_TOKEN` | Telegram bot token | Required |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `DATABASE_URL` | PostgreSQL connection string | (uses SQLite by default) |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `PORT` | Agent server port (backend POS 5000-portda ishlaydi) | `5001` |
| `AI_PROVIDER` | AI provider (`openai`) | `openai` |
| `DEFAULT_TIMEZONE` | Business timezone | `Asia/Tashkent` |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | System health check |
| GET | `/api/ready` | Readiness check |
| GET | `/api/live` | Liveness check |
| POST | `/api/agent/chat` | AI Agent chat |
| GET | `/api/agent/tools` | Available tools |
| POST | `/api/agent/confirm` | Confirm write action |
| GET | `/api/dashboard/overview` | Dashboard overview |
| GET | `/api/dashboard/health` | System health |
| GET | `/api/automation` | Automation rules |
| POST | `/api/automation` | Create automation |
| DELETE | `/api/automation/:id` | Delete automation |
| GET | `/api/reports` | Reports list |
| POST | `/api/reports/generate/:type` | Generate report |

## Workers Architecture

The platform runs multiple background workers:

1. **Telegram Worker** - Handles all Telegram bot interactions
2. **Scheduler Worker** - Manages automated tasks and cron jobs
3. **Report Worker** - Generates and delivers reports
4. **Automation Worker** - Evaluates and executes automation rules

All workers are resilient with:
- Automatic restart on crash
- Graceful shutdown
- Health checks
- Retry with exponential backoff
- Dead-letter queue handling

## Tenant Isolation

Every operation is scoped to a tenant:
- Each business has its own data partition
- All queries include `tenant_id` filter
- Cross-tenant access is impossible
- Isolated memory, settings, and automations

## AI Safety

- **READ actions**: Automatic (no confirmation needed)
- **LOW-RISK WRITE**: May require confirmation
- **HIGH-RISK WRITE**: Always requires explicit confirmation + authorization
- AI never accesses raw SQL, shell, or arbitrary code
- All tool calls are logged and audited
- AI cannot bypass authorization

## Testing

```bash
# Run all tests
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# With coverage
npm test -- --coverage
```

## Monitoring

- **Health**: `GET /api/health`
- **Ready**: `GET /api/ready`
- **Live**: `GET /api/live`
- **Structured logs**: Winston with file + console transport
- **Heartbeat**: Every 30 seconds
- **Queue monitoring**: Redis-based

## Security Checklist

- [x] Environment variables for all secrets
- [x] No hardcoded API keys
- [x] Input validation and sanitization
- [x] Rate limiting
- [x] Authentication and authorization
- [x] Tenant isolation
- [x] Audit logging
- [x] Secure headers (Helmet)
- [x] CORS configured
- [x] Telegram webhook security
- [x] Sensitive data masking

## License

MIT

## Support

For support, contact: admin@pos.uz
