/**
 * Seed script — creates a demo parent + child + sample AI workers for feedback previews.
 * Safe to run multiple times (idempotent).
 *
 * Usage:
 *   npx tsx scripts/seed-demo.ts
 *
 * Demo credentials:
 *   Parent  →  demo@agentfactoryjr.com  /  Demo1234!
 *   Child   →  username: alex_demo      /  PIN: 1234
 */

import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL not set in .env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes("neon.tech") ? true : undefined,
});

const DEMO_EMAIL     = "demo@agentfactoryjr.com";
const DEMO_PASSWORD  = "Demo1234!";
const DEMO_PIN       = "1234";
const CHILD_USERNAME = "alex_demo";

// Fixed IDs for app-level rows (idempotent across re-runs)
const DEMO = {
  parentProfileId:    "demo_profile_parent_001",
  parentUsageLimitId: "demo_usage_parent_001",
  childUserId:        "demo_user_child_001",
  childProfileId:     "demo_profile_child_001",
  childCredId:        "demo_cred_child_001",
  childLinkId:        "demo_link_child_001",
  childUsageLimitId:  "demo_usage_child_001",
  proj1Id:            "demo_proj_math_001",
  proj2Id:            "demo_proj_story_001",
  proj3Id:            "demo_proj_science_001",
  run1Id:             "demo_run_001",
  run2Id:             "demo_run_002",
  run3Id:             "demo_run_003",
};

function dsl(goal: string, knowledge: string[], rules: string[]) {
  return JSON.stringify({
    goal,
    knowledge: knowledge.map((c) => ({ content: c })),
    rules,
  });
}

async function upsertRow(
  client: import("pg").PoolClient,
  table: string,
  idCol: string,
  idVal: string,
  cols: Record<string, unknown>
) {
  const exists = await client.query(
    `SELECT 1 FROM ${table} WHERE ${idCol} = $1`,
    [idVal]
  );
  if (exists.rowCount && exists.rowCount > 0) return false;
  const keys = Object.keys(cols);
  const vals = Object.values(cols);
  const placeholders = keys.map((_, i) => `$${i + 2}`).join(", ");
  await client.query(
    `INSERT INTO ${table} (${idCol}, ${keys.join(", ")}) VALUES ($1, ${placeholders})`,
    [idVal, ...vals]
  );
  return true;
}

async function seed() {
  // Import after dotenv so DATABASE_URL / BETTER_AUTH_SECRET are set
  const { auth } = await import("../src/lib/auth.js");

  const client = await pool.connect();
  try {
    console.log("🌱  Seeding demo account…\n");
    const now = new Date();

    // ── 1. Better Auth user — sign in if exists, create only if needed ──────────
    let baUserId = "";
    try {
      const signInData = await auth.api.signInEmail({
        body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
        headers: new Headers({ "content-type": "application/json" }),
      }) as { user?: { id: string } };
      baUserId = signInData?.user?.id ?? "";
      if (baUserId) console.log("  · Demo auth user already exists (id:", baUserId, ")");
    } catch { /* not found — will create below */ }

    if (!baUserId) {
      const signUpData = await auth.api.signUpEmail({
        body: { email: DEMO_EMAIL, password: DEMO_PASSWORD, name: "Demo Parent" },
        headers: new Headers({ "content-type": "application/json" }),
      }) as { user?: { id: string } };
      baUserId = signUpData?.user?.id ?? "";
      if (!baUserId) {
        console.error("❌  Better Auth signUp failed:", signUpData);
        process.exit(1);
      }
      console.log("  ✓ Better Auth user created (id:", baUserId, ")");
    }

    // ── 2. Parent profile — upsert, linking to the BA userId ──────────────────
    await upsertRow(client, "profiles", "id", DEMO.parentProfileId, {
      user_id: baUserId,
      display_name: "Demo Parent",
      role: "parent",
      created_at: now,
      updated_at: now,
    });
    // Ensure user_id stays in sync (safe on re-runs)
    await client.query(
      `UPDATE profiles SET user_id = $1, role = 'parent' WHERE id = $2`,
      [baUserId, DEMO.parentProfileId]
    );
    console.log("  ✓ Parent profile");

    // ── 3. Parent usage limits ─────────────────────────────────────────────────
    await upsertRow(client, "usage_limits", "id", DEMO.parentUsageLimitId, {
      user_id: DEMO.parentProfileId,
      daily_run_limit: 10,
      runs_used_today: 0,
      chat_turns_used_today: 0,
      paused: false,
      period_start: now,
      created_at: now,
      updated_at: now,
    });
    console.log("  ✓ Parent usage limits");

    // ── 4. Child Better Auth-style user row (no real auth, internal only) ──────
    await upsertRow(client, '"user"', "id", DEMO.childUserId, {
      name: "Alex (Demo)",
      email: `child_${DEMO.childUserId}@demo.internal`,
      '"emailVerified"': false,
      '"createdAt"': now,
      '"updatedAt"': now,
    });
    console.log("  ✓ Child user row");

    // ── 5. Child profile ───────────────────────────────────────────────────────
    await upsertRow(client, "profiles", "id", DEMO.childProfileId, {
      user_id: DEMO.childUserId,
      display_name: "Alex",
      role: "student",
      link_code: "DEMO1234",
      created_at: now,
      updated_at: now,
    });
    console.log("  ✓ Child profile");

    // ── 6. Child credentials (username + PIN) ──────────────────────────────────
    const pinHash = await bcrypt.hash(DEMO_PIN, 10);
    await upsertRow(client, "child_credentials", "id", DEMO.childCredId, {
      profile_id: DEMO.childProfileId,
      parent_id: DEMO.parentProfileId,
      username: CHILD_USERNAME,
      pin_hash: pinHash,
      failed_attempts: 0,
      created_at: now,
      updated_at: now,
    });
    console.log("  ✓ Child credentials");

    // ── 7. Parent-child link ───────────────────────────────────────────────────
    await upsertRow(client, "parent_child_links", "id", DEMO.childLinkId, {
      parent_id: DEMO.parentProfileId,
      student_id: DEMO.childProfileId,
      link_code: "DEMO1234",
      email_on_flag: false,
      require_approval: false,
      created_at: now,
    });
    console.log("  ✓ Parent-child link");

    // ── 8. Child usage limits ──────────────────────────────────────────────────
    await upsertRow(client, "usage_limits", "id", DEMO.childUsageLimitId, {
      user_id: DEMO.childProfileId,
      daily_run_limit: 5,
      runs_used_today: 2,
      chat_turns_used_today: 0,
      paused: false,
      period_start: now,
      created_at: now,
      updated_at: now,
    });
    console.log("  ✓ Child usage limits");

    // ── 9. Sample AI Workers ───────────────────────────────────────────────────
    await upsertRow(client, "projects", "id", DEMO.proj1Id, {
      owner_id: DEMO.childProfileId,
      name: "Multiplication Buddy",
      description: "Helps me practise times tables with hints, not answers!",
      dsl_json: dsl(
        "Help the student practise multiplication tables by asking questions and giving hints — never give the answer directly.",
        [
          "Multiplication is repeated addition. 3×4 means 3 groups of 4.",
          "Times tables go up to 12×12.",
          "Tricks: anything times 10 adds a zero. Anything times 5 ends in 0 or 5.",
        ],
        [
          "Ask me one question at a time.",
          "If I get it wrong, give a hint — don't tell me the answer.",
          "Celebrate when I get it right!",
        ]
      ),
      status: "published",
      parent_approved_at: now,
      created_at: now,
      updated_at: now,
    });
    console.log("  ✓ Project: Multiplication Buddy");

    await upsertRow(client, "projects", "id", DEMO.proj2Id, {
      owner_id: DEMO.childProfileId,
      name: "Story Helper",
      description: "My AI writing partner — helps me build amazing stories!",
      dsl_json: dsl(
        "Help the student build a creative short story step by step — characters, setting, problem, and resolution.",
        [
          "A good story has a beginning, middle, and end.",
          "Characters need a goal and a challenge to overcome.",
          "Describing sights, sounds, and feelings makes stories vivid.",
        ],
        [
          "Ask me what kind of story I want before starting.",
          "Suggest ideas but let me make the final choices.",
          "Keep the story age-appropriate and positive.",
        ]
      ),
      status: "published",
      parent_approved_at: now,
      created_at: now,
      updated_at: now,
    });
    console.log("  ✓ Project: Story Helper");

    await upsertRow(client, "projects", "id", DEMO.proj3Id, {
      owner_id: DEMO.childProfileId,
      name: "Science Explorer",
      description: "Curious about science? Ask me anything about nature and space!",
      dsl_json: dsl(
        "Answer the student's science questions about nature, space, animals, and the human body in a fun and easy-to-understand way.",
        [
          "The solar system has 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.",
          "Photosynthesis is how plants make food from sunlight, water, and CO2.",
          "The human body has 206 bones and about 37 trillion cells.",
          "Light travels at 300,000 km per second.",
        ],
        [
          "Use simple words and fun comparisons.",
          "Ask me a follow-up question after each answer to keep me curious.",
          "If I ask something outside your knowledge, say so honestly.",
        ]
      ),
      status: "published",
      parent_approved_at: now,
      created_at: now,
      updated_at: now,
    });
    console.log("  ✓ Project: Science Explorer");

    // ── 10. Sample agent runs ──────────────────────────────────────────────────
    await upsertRow(client, "agent_runs", "id", DEMO.run1Id, {
      project_id: DEMO.proj1Id,
      student_id: DEMO.childProfileId,
      input: "What is 7 times 8?",
      output: "Great question! Here's a hint: 7×8 is the same as 7×4 doubled. What is 7×4? 🤔",
      provider: "mock",
      status: "completed",
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    });

    await upsertRow(client, "agent_runs", "id", DEMO.run2Id, {
      project_id: DEMO.proj2Id,
      student_id: DEMO.childProfileId,
      input: "I want to write a story about a dragon who is afraid of fire.",
      output: "I love it — that's a brilliant twist! 🐉 Let's give your dragon a name first. What would you like to call them?",
      provider: "mock",
      status: "completed",
      created_at: new Date(now.getTime() - 60 * 60 * 1000),
    });

    await upsertRow(client, "agent_runs", "id", DEMO.run3Id, {
      project_id: DEMO.proj3Id,
      student_id: DEMO.childProfileId,
      input: "Why is the sky blue?",
      output: "The sky is blue because of scattering! Sunlight is made of all colours. Blue light bounces around the most — so that's what we see. 🌤️ Why do sunsets look orange and red?",
      provider: "mock",
      status: "completed",
      created_at: new Date(now.getTime() - 30 * 60 * 1000),
    });
    console.log("  ✓ Sample runs");

    // ── 11. Replay records for each run ───────────────────────────────────────
    await upsertRow(client, "replays", "id", "demo_replay_001", {
      run_id: DEMO.run1Id,
      project_id: DEMO.proj1Id,
      student_id: DEMO.childProfileId,
      goal: "Help the student practise multiplication tables by asking questions and giving hints — never give the answer directly.",
      knowledge_used: JSON.stringify([
        "Multiplication is repeated addition. 3×4 means 3 groups of 4.",
        "Tricks: anything times 10 adds a zero. Anything times 5 ends in 0 or 5.",
      ]),
      rules_applied: JSON.stringify([
        "Ask me one question at a time.",
        "If I get it wrong, give a hint — don't tell me the answer.",
        "Celebrate when I get it right!",
      ]),
      steps_followed: JSON.stringify([
        "Received student question: What is 7 times 8?",
        "Identified this as a multiplication question",
        "Applied hint rule — did not reveal the answer",
        "Used doubling trick as a scaffold",
        "Posed a follow-up question to guide the student",
      ]),
      tools_used: JSON.stringify([]),
      approval_required: JSON.stringify([]),
      safety_flags: JSON.stringify([]),
      output: "Great question! Here's a hint: 7×8 is the same as 7×4 doubled. What is 7×4? 🤔",
      provider: "mock",
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    });

    await upsertRow(client, "replays", "id", "demo_replay_002", {
      run_id: DEMO.run2Id,
      project_id: DEMO.proj2Id,
      student_id: DEMO.childProfileId,
      goal: "Help the student build a creative short story step by step — characters, setting, problem, and resolution.",
      knowledge_used: JSON.stringify([
        "A good story has a beginning, middle, and end.",
        "Characters need a goal and a challenge to overcome.",
        "Describing sights, sounds, and feelings makes stories vivid.",
      ]),
      rules_applied: JSON.stringify([
        "Ask me what kind of story I want before starting.",
        "Suggest ideas but let me make the final choices.",
        "Keep the story age-appropriate and positive.",
      ]),
      steps_followed: JSON.stringify([
        "Received student story idea: dragon afraid of fire",
        "Recognised creative premise with an interesting twist",
        "Applied rule: let student make final choices",
        "Asked for character name to build engagement",
        "Kept tone positive and encouraging",
      ]),
      tools_used: JSON.stringify([]),
      approval_required: JSON.stringify([]),
      safety_flags: JSON.stringify([]),
      output: "I love it — that's a brilliant twist! 🐉 Let's give your dragon a name first. What would you like to call them?",
      provider: "mock",
      created_at: new Date(now.getTime() - 60 * 60 * 1000),
    });

    await upsertRow(client, "replays", "id", "demo_replay_003", {
      run_id: DEMO.run3Id,
      project_id: DEMO.proj3Id,
      student_id: DEMO.childProfileId,
      goal: "Answer the student's science questions about nature, space, animals, and the human body in a fun and easy-to-understand way.",
      knowledge_used: JSON.stringify([
        "Light travels at 300,000 km per second.",
        "The solar system has 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.",
      ]),
      rules_applied: JSON.stringify([
        "Use simple words and fun comparisons.",
        "Ask me a follow-up question after each answer to keep me curious.",
        "If I ask something outside your knowledge, say so honestly.",
      ]),
      steps_followed: JSON.stringify([
        "Received student question: Why is the sky blue?",
        "Retrieved knowledge: light scattering (Rayleigh scattering)",
        "Applied rule: use simple words and fun comparisons",
        "Explained that blue light scatters more than other colours",
        "Applied rule: ask a follow-up question",
        "Posed question about sunset colours to extend curiosity",
      ]),
      tools_used: JSON.stringify([]),
      approval_required: JSON.stringify([]),
      safety_flags: JSON.stringify([]),
      output: "The sky is blue because of scattering! Sunlight is made of all colours. Blue light bounces around the most — so that's what we see. 🌤️ Why do sunsets look orange and red?",
      provider: "mock",
      created_at: new Date(now.getTime() - 30 * 60 * 1000),
    });
    console.log("  ✓ Replay records");

    console.log(`
✅  Demo seed complete!

┌─────────────────────────────────────────────┐
│  PARENT LOGIN (share this with reviewers)   │
│  URL:      /sign-in  (or click Try Demo)    │
│  Email:    ${DEMO_EMAIL.padEnd(33)}│
│  Password: ${DEMO_PASSWORD.padEnd(33)}│
├─────────────────────────────────────────────┤
│  STUDENT LOGIN (to demo the child view)     │
│  URL:      /child/sign-in                   │
│  Username: ${CHILD_USERNAME.padEnd(33)}│
│  PIN:      ${DEMO_PIN.padEnd(33)}│
└─────────────────────────────────────────────┘
`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
