# Agent Factory Junior — Roadmap

## Age Verification & Access Control Options

Three options for handling age verification, COPPA compliance, and child
access control. Decision pending.

---

### Option 1 — Google OAuth (Sign in with Google)

**How it works:**
Students sign in with their existing Google account. No custom sign-up
form, no DOB field, no password managed by us. Better Auth handles the
OAuth flow; Google issues the identity token.

**What Google OAuth actually gives you:**
When a user signs in with Google, your app receives only this:

```json
{
  "sub": "1234567890",
  "name": "Amelia M.",
  "email": "amelia@school.edu",
  "picture": "https://...",
  "email_verified": true
}
```

That is all. **Google does not expose age, date of birth, or an
"under 13" flag in the OAuth token.** This is intentional — Google
withholds age data for privacy reasons regardless of account type.

**What Google Family Link actually does (and doesn't do):**
Family Link is a parental device-supervision tool, not an age gate for
third-party websites. It lets parents approve Android app installs and
set screen time limits. It does NOT:
- Signal to your website that a visitor is under 13
- Restrict which websites a child can visit
- Expose the child's age to OAuth recipients
- Give third-party apps any parental consent confirmation

A child with a Family Link account signs into your site identically to
an adult. You cannot tell the difference from the token.

**The one useful signal — email domain:**
School-issued Google Workspace for Education accounts have recognisable
domains (`@students.districtname.k12.us`). You can read the email domain
on sign-in and apply restrictions:

```
@gmail.com         → unknown age → treat as adult, no restrictions
@school.k12.us     → likely a school student → apply grade-level defaults
```

This is a heuristic, not a guarantee. A child can have a personal Gmail
account and sign in with that instead.

**What Google OAuth is actually good for:**
- Stronger identity than email/password (harder to create fake Google
  accounts than fake email addresses)
- Convenience — students already have Google accounts from school
- Removes password management from our responsibility
- School domain heuristic gives a weak but free age signal

**What it does NOT provide:**
- Age verification of any kind
- COPPA compliance on its own
- Parental consent confirmation
- Any difference in token between an 8-year-old and a 40-year-old

**Conclusion:** Google OAuth is worth adding for convenience and identity
strength. It is **not** an age control mechanism. Age-based feature
gating must come from the teacher setting a grade level on the classroom
— not from Google.

**Implementation effort:** Low — add Google OAuth to Better Auth (1–2 hours).

**Comparable products using this approach:**
MIT App Inventor (main platform), Google Classroom integrations, most
EdTech tools targeting middle/high school — all of whom rely on the
teacher/school relationship for actual age context, not the OAuth token.

---

### Option 2 — No-Login Classroom Session Mode

**How it works:**
Inspired directly by MIT App Inventor's classroom version
(code.appinventor.mit.edu). The teacher creates a classroom and generates
a set of one-time access codes — one per student seat. Students go to
`/join`, type their code, optionally set a nickname, and get a session.
No account. No email. No password. No PII collected at all.

Projects are tied to the session and visible to the teacher. Sessions
expire when the teacher deactivates them or after a set period.

**Why it works:**
- Zero COPPA exposure — no PII means no COPPA obligation
- No age verification needed because no data is collected
- Eliminates the fake-parent problem entirely — there is no parent flow
- Lowest friction for classroom use: teacher prints codes, hands them out,
  students are working in under 60 seconds
- Teacher retains full visibility and control — they issued the codes

**What it doesn't solve:**
- Students can't access their work from home (no persistent account)
- No parent visibility in this mode (no account to link to)
- Teacher must manage code distribution and rotation

**Implementation effort:** Medium — new DB table, join page, session
cookie, code generation UI for teachers (4–6 hours).

**Comparable products using this approach:**
MIT App Inventor classroom version, Scratch (partial — allows saving
without account but limits features), many classroom coding tools.

---

### Option 3 — School SSO via Clever or ClassLink

**How it works:**
School districts use identity providers like Clever or ClassLink to
manage all student accounts centrally. Students log in with their school
credentials (the same ones they use for everything else at school). The
district has already verified ages at enrollment. We receive a verified
identity token with grade level attached.

**Why it works:**
- Age is verified by the school district at enrollment — the most
  trustworthy source possible
- Grade level comes with the token — we can gate features by age
  automatically without asking
- Single sign-on means no new password for students to forget
- Districts are already familiar with Clever/ClassLink — reduces
  procurement friction for IT departments
- Full COPPA compliance: parental consent was obtained by the district
  when the student enrolled

**What it doesn't solve:**
- Requires district IT to set up the integration — adds a sales/onboarding
  step
- Home-school and individual families can't use this path
- Implementation is significantly more complex (OAuth 2.0 integration
  with Clever/ClassLink APIs, district provisioning flow)
- Not suitable for v1 — this is a v2/v3 feature when there are paying
  school customers to justify the effort

**Implementation effort:** High — 2–4 weeks including Clever/ClassLink
developer program enrollment, OAuth integration, district provisioning
UI, and testing with real district credentials.

**Comparable products using this approach:**
Khan Academy, Newsela, IXL, Duolingo for Schools — essentially every
serious K–12 EdTech product at scale.

---

## Recommended Phasing

| Phase | What | Why |
|---|---|---|
| v1 (now) | Option 2 — No-login classroom sessions | Zero PII, zero COPPA exposure, lowest friction for classrooms |
| v1 (now) | Option 1 — Google OAuth (convenience only) | Easier sign-in for teachers/parents; school domain heuristic for weak age signal |
| v1 (now) | Teacher sets `grade_level` on classroom | **The actual age signal** — drives all feature gating |
| v2 | Option 3 — Clever/ClassLink SSO | First paying school district; grade level in token replaces heuristic |
| v2 | Parent activation flow | If direct-to-consumer growth warrants it |

**Key insight:** Google OAuth is a sign-in convenience, not an age control.
The teacher is the age signal. The classroom `grade_level` field is what
drives feature gating — block availability, run limits, explain styles.
That is the design that MIT App Inventor, Google Classroom, and every
serious K–12 EdTech product converge on.

---

## Other Open Architecture Decisions

### Age-Based Feature Gating
Once a grade level is known (from teacher classroom settings or SSO token),
restrict features by age group:

| Feature | K–2 | 3–5 | 6–8 |
|---|---|---|---|
| Available blocks | Goal, Knowledge, Output | + Rule, Ask Student | All 8 |
| Daily run limit | 3 | 5 | 10 |
| Explain styles | Simple only | Simple + Example | All 3 |
| Quiz max questions | 2 | 3 | 5 |

### Parental Control Settings (future)
- Daily run cap override
- Require parent approval before each run
- Allowed hours window
- Pause account toggle

### Teacher Control Settings (future)
- Block type allowlist per classroom
- Run limit override per classroom
- Require receipt review before next run
- Assignment mode (assign a specific template)
