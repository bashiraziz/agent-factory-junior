# Agent Factory Junior — Roadmap

## Age Verification & Access Control Options

Three options for handling age verification, COPPA compliance, and child
access control. Decision pending.

---

### Option 1 — Delegate to Google OAuth

**How it works:**
Students sign in with their Google account only. No custom sign-up form,
no DOB field, no age gate built by us. Google handles COPPA compliance for
under-13 accounts via Google Family Link — parents approve the child's
Google account, and that approval carries over to any app the child signs
into with it.

**Why it works:**
- Google has a legal team, COPPA infrastructure, and parental consent
  flows already built and audited
- Schools already provision Google accounts for students via Google
  Workspace for Education — those accounts are district-managed and
  age-verified at enrollment
- We never touch a DOB field, so we can't be accused of collecting it
  incorrectly
- Zero liability for fake age declarations — if a child bypasses Google
  Family Link, that's between Google and the parent, not us

**What it doesn't solve:**
- Students without a Google account (uncommon in schools, more common
  for younger/home-school kids)
- Parents who don't use Family Link (it's optional, not enforced)

**Implementation effort:** Low — add Google OAuth to Better Auth (1–2 hours).

**Comparable products using this approach:**
MIT App Inventor (main platform), Google Classroom integrations, most
EdTech tools targeting middle/high school.

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

| Phase | Options | When |
|---|---|---|
| v1 (now) | Option 1 + Option 2 | Launch — covers schools and low-friction classroom use |
| v2 | Option 3 (Clever) | First paying school district customer |
| v2 | Parent activation flow | If direct-to-consumer growth warrants it |

The combination of Options 1 and 2 is what MIT App Inventor has run
successfully for 15+ years. It covers the vast majority of real classroom
use cases with minimal liability and minimal friction.

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
