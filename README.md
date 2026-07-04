# Agent Factory Junior

A safe, child-friendly platform where kids build AI Workers with visual blocks.

---

## Dev quick-start

```bash
npm install
npm run dev        # starts on http://localhost:3000
```

## Database commands

| Command | What it does |
|---|---|
| `npm run db:migrate` | Create / update all tables (safe to re-run) |
| `npm run db:seed-demo` | Create the demo parent + child account with sample workers |
| `npm run db:reset` | **Wipe all data** (tables stay) — run `db:seed-demo` after |

### Fresh-slate workflow

```bash
npm run db:reset
npm run db:seed-demo
```

### Demo account (after seeding)

| | Credentials |
|---|---|
| **Parent** | `demo@agentfactoryjr.com` / `Demo1234!` |
| **Child** | username `alex_demo` / PIN `1234` |

---

## Key pages

| Route | Who sees it |
|---|---|
| `/` | Landing page |
| `/demo` | One-click demo login |
| `/sign-up` | Parents & teachers only |
| `/child/sign-in` | Kids (username + PIN) |
| `/parent/dashboard` | Parent home |
| `/teacher/dashboard` | Teacher home |
| `/student/dashboard` | Child home |
| `/student/projects` | Child's worker list |
| `/student/learn` | Guided lessons path map (8 core + 4 explorer) |
| `/student/learn/[chapterId]` | Individual lesson — read, mission, quiz, badge |
| `/about` | About page |
| `/privacy` | Privacy policy |
| `/terms` | Terms stub |
