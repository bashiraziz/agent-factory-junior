# Agent Factory Junior — Roadmap

## Access Model: Two Tracks

The app serves two distinct populations — children in schools and children
at home. These have fundamentally different COPPA and age-verification
profiles. The correct architecture runs both tracks in parallel, not as
alternatives.

```
How does a child access Agent Factory Junior?

┌─────────────────────────────────────────────────────────────┐
│  TRACK A — Through school (no account needed)               │
│                                                             │
│  Teacher creates classroom → generates seat codes →         │
│  student types code at /join → session starts               │
│                                                             │
│  ✓ No PII collected → zero COPPA obligation                 │
│  ✓ Teacher is the verified adult → no fake-parent problem   │
│  ✓ Lowest friction → working in under 60 seconds            │
│  ✗ Work is not persistent outside the session               │
│  ✗ Only available to children whose school uses the app     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  TRACK B — Direct / at home (account required)              │
│                                                             │
│  Sign-up → age gate (13+) → role selection → dashboard      │
│  Under-13 → redirected to Track A or parent account path    │
│                                                             │
│  ✓ Works outside school, at home, for home-school kids      │
│  ✓ Persistent account and project history                   │
│  ✓ Parent can link and review                               │
│  ✗ Requires an adult to be involved for under-13            │
│  ✗ Age gate is self-declared (see 13+ Gate section below)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Track A — No-Login Classroom Session Mode

**How it works:**
Inspired by MIT App Inventor's classroom version (code.appinventor.mit.edu).
The teacher creates a classroom and generates a set of access codes — one
per student seat. Students go to `/join`, type their code, optionally set
a nickname, and get a session. No account. No email. No password. No PII
collected at all.

Projects are tied to the session and visible to the teacher. Sessions
expire when the teacher deactivates them or after a configurable period.

**Why it works:**
- Zero COPPA exposure — no PII means no COPPA obligation whatsoever
- No age verification needed because no data is collected
- Eliminates the fake-parent problem entirely — there is no parent flow
- Teacher retains full visibility and control — they issued the codes
- Lowest friction for classroom use

**What it doesn't solve:**
- Students can't access their work from home (no persistent account)
- No parent visibility in this mode (no account to link to)
- Restricted to children whose school or teacher uses the app

**Implementation effort:** Medium — new DB table, join page, session
cookie, code generation UI for teachers (4–6 hours).

**Comparable products:** MIT App Inventor classroom mode, Scratch (partial),
most classroom coding tools.

---

## Track B — Direct Sign-Up with 13+ Age Gate

### The 13+ Gate

The minimum age for a self-managed account is **13**, stated clearly in
the Terms of Service and enforced with an age confirmation on sign-up.

**Sign-up flow:**

```
Step 1 — Age confirmation (before anything else)
┌──────────────────────────────────────────────┐
│  Are you 13 or older?                        │
│                                              │
│  [ Yes, I'm 13 or older ]                   │
│                                              │
│  [ No, I'm under 13 ]                       │
└──────────────────────────────────────────────┘

If YES → continue to normal sign-up (email, password, role)

If NO  → show alternative paths:
┌──────────────────────────────────────────────┐
│  No problem! Here's how to get started:      │
│                                              │
│  🏫  Got a classroom code from your teacher? │
│      [ Enter code ] → /join                  │
│                                              │
│  👨‍👩‍👧  Ask a parent to create an account       │
│      and add you as a child.                 │
│      [ Go to parent sign-up ]                │
└──────────────────────────────────────────────┘
```

**Why this works legally:**
A self-declared age gate does not stop a determined child from clicking
"Yes" when they are under 13. However it:
- Satisfies the FTC's "reasonable efforts" standard for COPPA
- Shifts liability to the user who provided false information
- Creates a clear ToS record that under-13 direct accounts are prohibited
- Routes younger children toward the two supervised paths (Track A or
  parent account) rather than leaving them with no alternative

This is the standard approach used by virtually every consumer app with
a minimum age — including YouTube, Instagram, TikTok, and Khan Academy
on their direct sign-up paths.

### Sign-In Options on Track B

**Email/password** — custom credentials, managed by Better Auth.

**Sign in with Google** — convenience and slightly stronger identity.
See the Google OAuth section below for exactly what this does and does
not provide.

### Parent Account Path (Track B, under-13)

A parent creates their own account with role = parent, then links a child
using a child link code. The child's account starts in `pending` state and
only activates after the parent completes the link. The parent — not the
child — sets the child's grade level, which drives feature gating.

This means:
- A child cannot self-activate a Track B account under 13
- The grade level comes from a responsible adult
- Misrepresentation by the parent shifts full liability to the parent
  (which is exactly where COPPA intends it to land)

---

## Google OAuth — What It Actually Provides

Google OAuth is available on Track B as a sign-in convenience. It is
**not** an age verification mechanism.

**What the Google OAuth token contains:**
```json
{
  "sub": "1234567890",
  "name": "Amelia M.",
  "email": "amelia@school.edu",
  "picture": "https://...",
  "email_verified": true
}
```

That is all. Google does not expose age, date of birth, or an "under 13"
flag in the OAuth token. This is intentional — Google withholds age data
for privacy reasons regardless of account type.

**What Google Family Link actually does (and doesn't do):**
Family Link is a parental device-supervision tool, not an age gate for
third-party websites. It does NOT:
- Signal to your website that a visitor is under 13
- Restrict which websites a child can visit
- Expose the child's age to OAuth recipients
- Give third-party apps any parental consent confirmation

A child with a Family Link account signs into your site identically to
an adult. You cannot tell the difference from the token.

**The one useful signal — school email domain:**
School-issued Google Workspace for Education accounts have recognisable
domains (`@students.districtname.k12.us`). You can apply restrictions
based on domain:

```
@gmail.com         → unknown age → apply 13+ gate as normal
@school.k12.us     → likely a school student → apply grade-level defaults
```

This is a heuristic, not a guarantee. A child can sign in with a personal
Gmail account instead.

**What Google OAuth is actually good for:**
- Stronger identity than email/password (harder to fake)
- Convenience for teachers and parents already using Google
- School domain heuristic gives a weak but free signal
- Removes password management from our responsibility

**What it does NOT provide:**
- Age verification of any kind
- COPPA compliance on its own
- Parental consent confirmation
- Any distinction between an 8-year-old and a 40-year-old

**Implementation effort:** Low — add Google OAuth to Better Auth (1–2 hours).

---

## Option 3 — School SSO via Clever or ClassLink (Future)

**How it works:**
School districts use identity providers like Clever or ClassLink to manage
all student accounts centrally. Students log in with their school
credentials. The district has already verified ages at enrollment. We
receive a verified identity token with grade level attached — no
self-declaration needed.

**Why it's the right long-term answer:**
- Age is verified by the school district at enrollment — most trustworthy
  source possible
- Grade level comes with the token — feature gating is automatic
- Single sign-on — no new password for students
- Full COPPA compliance: parental consent was obtained by the district
- Eliminates all self-declaration risk for the school population

**What it doesn't solve:**
- Requires district IT setup — adds a sales/onboarding step
- Home-school and individual families cannot use this path
- Significant implementation complexity

**Implementation effort:** High — 2–4 weeks.

**Comparable products:** Khan Academy, Newsela, IXL, Duolingo for Schools.

**When to build:** First paying school district customer.

---

## Recommended Phasing

| Phase | What | Covers |
|---|---|---|
| v1 | Track A — no-login classroom sessions | Children in schools, zero COPPA risk |
| v1 | Track B — email/password + 13+ gate | Teens and adults, home use |
| v1 | Google OAuth (convenience) | Teachers, parents, 13+ students |
| v1 | Parent account path + child activation | Under-13 home use, supervised |
| v1 | Teacher sets `grade_level` on classroom | Age-based feature gating signal |
| v2 | Clever/ClassLink SSO | Paying school districts |
| v2 | Parent control settings | Pause, run cap, approval mode |
| v3 | Teacher assignment mode | Structured curriculum use |

---

## Age-Based Feature Gating

The `grade_level` field on the classroom (set by the teacher, or by the
parent for home accounts) drives all feature restrictions. It is never
self-declared by the child.

| Feature | K–2 | 3–5 | 6–8 |
|---|---|---|---|
| Available blocks | Goal, Knowledge, Output | + Rule, Ask Student | All 8 |
| Daily run limit | 3 | 5 | 10 |
| Explain styles | Simple only | Simple + Example | All 3 |
| Quiz max questions | 2 | 3 | 5 |

---

## Parental Control Settings (v2)

- Daily run cap override
- Require parent approval before each run
- Allowed hours window (e.g. no runs after 9pm)
- Pause account toggle

## Teacher Control Settings (v2)

- Block type allowlist per classroom
- Run limit override per classroom
- Require receipt review before student's next run
- Assignment mode — assign a specific template project
