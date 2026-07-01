# Agent Factory Junior

A child-safe, education-first platform where kids build their first **AI Workers** using visual Blockly blocks — goals, safety rules, approved knowledge, steps — with real LLM output, parent controls, and a full replay/receipt for every run.

## Roles

- **Student** — builds and runs AI Workers. Signs in via a **classroom code** (teacher-issued) or a **username + 4-digit PIN** (parent-created, no email needed).
- **Teacher** — creates classrooms, issues seat codes, sees per-student activity.
- **Parent** — links to a child (link code) or creates a child account directly. Sets daily run limits, pauses, requires per-worker approval, reviews every run's replay.
- **Admin** — reserved.

## Tech

- Next.js 16 App Router · TypeScript · Tailwind
- Drizzle ORM + Postgres (Neon works out of the box)
- Better Auth (grown-ups) · seat-code cookie session (classroom kids) · username+PIN cookie session (kids without email)
- Vercel AI SDK v7 · Gemini (via `@ai-sdk/google`) with a mock provider fallback
- Blockly for the visual editor

## Environment variables

Create `.env.local` with:

| Var | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string (Neon `?sslmode=require` works) |
| `BETTER_AUTH_SECRET` | ✅ | Any long random string |
| `BETTER_AUTH_URL` | ✅ | e.g. `http://localhost:3000` in dev |
| `LLM_PROVIDER` | | `gemini` or unset for the mock provider |
| `GEMINI_API_KEY` | when `LLM_PROVIDER=gemini` | |
| `GEMINI_MODEL` | | Defaults to `gemini-2.0-flash` |
| `DEV_UNLIMITED_RUNS` | | Set to `1` in dev to bypass the daily run limit |

## Getting started

```bash
npm install
npm run db:migrate      # idempotent — creates/updates all tables + indexes
npm run dev             # http://localhost:3000
```

Open `/sign-in` for a grown-up (teacher/parent) or `/join` for a kid (classroom code or username+PIN).

## Providers

- **Mock** (default) — deterministic, no API key needed. Great for classroom demos.
- **Gemini** — set `LLM_PROVIDER=gemini` + `GEMINI_API_KEY`. Chat, quiz-generation, and wrap-up all use Gemini.

## Safety model

Every LLM path goes through:

1. **Guardrails** (`src/lib/runtime/guardrails.ts`) — parent pause, per-worker approval, daily run limit (chat counts as 1/5 of a run).
2. **Prompt hardening** — student-authored goal/knowledge/rules are wrapped in `<student_content>` delimiters; the model is told to treat them as data, never instructions.
3. **Output moderation** (`src/lib/runtime/moderate-output.ts`) — post-generation blocklist. Flags are replaced with a friendly message and marked in the run/replay so the parent can review.
4. **Replay receipt** — every run persists goal, knowledge used, rules applied, steps followed, tools used, approval requirements, safety flags, and output.

## Testing checklist

- 6th wrong PIN within 15 minutes returns 429
- Editing an approved project's blocks clears `parentApprovedAt`
- A claimed seat code rejects re-joins; teacher reset re-opens it
- Paused child cannot chat; 5 chat turns consume 1 run
- No `Math.random` in token/code generation
- Two parallel run requests cannot exceed the daily limit
- Flagged output never reaches the child UI
