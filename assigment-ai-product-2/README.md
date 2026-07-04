# Interview Question Generator

AI-powered interview question generator using advanced prompt engineering patterns.

## Architecture

```
POST /interviews → DB (pending) → BullMQ Queue
                                       ↓
Worker:
  1. [Prompt Chaining]    Analyze role → structured competency map
  2. [Parallel Fan-out]   Generate technical + behavioral + situational (3 parallel calls)
  3. [Fan-in]             Merge all questions
  4. [Evaluator Loop]     Score quality → if < 7.0, optimize → re-evaluate (max 2 loops)
  5. Save to DB (completed)
```

## Prompt Patterns Used

1. **Prompt Chaining** — Role analysis output feeds directly into question generation prompts
2. **Parallel Fan-out & Fan-in** — 3 question categories generated simultaneously, then merged
3. **Evaluator & Optimizer Loop** — Quality scoring with automatic regeneration if below threshold

## Setup

```bash
docker-compose up -d          # PostgreSQL + Redis
pnpm install
pnpm db:generate              # Generate Prisma client
pnpm db:migrate               # Run migrations
```

## Run

```bash
pnpm dev          # API server (port 8000)
pnpm worker:dev   # Queue worker
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /interviews | List all sessions |
| GET | /interviews/:id | Get session by ID |
| POST | /interviews | Create new session (queues job) |
| PUT | /interviews/:id | Update session metadata |
| DELETE | /interviews/:id | Delete session |
| POST | /interviews/regenerate?id=1 | Re-run AI pipeline |

### POST /interviews

```json
{
  "role": "Backend Engineer",
  "level": "senior",
  "industry": "fintech",
  "additionalContext": "Focus on distributed systems"
}
```

Level options: `junior`, `mid`, `senior`, `lead`, `principal`
