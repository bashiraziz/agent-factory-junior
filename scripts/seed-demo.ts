/**
 * Seed script — creates a demo parent + child + sample AI workers for feedback previews.
 * Safe to run multiple times (idempotent — skips existing rows).
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

// ── IDs (fixed so re-runs stay idempotent) ───────────────────────────────────
const DEMO = {
  // Better Auth
  userId:         "demo_user_parent_001",
  accountId:      "demo_account_parent_001",
  // App
  parentProfileId: "demo_profile_parent_001",
  parentUsageLimitId: "demo_usage_parent_001",
  // Child
  childUserId:    "demo_user_child_001",
  childProfileId: "demo_profile_child_001",
  childCredId:    "demo_cred_child_001",
  childLinkId:    "demo_link_child_001",
  childUsageLimitId: "demo_usage_child_001",
  // Projects
  proj1Id: "demo_proj_math_001",
  proj2Id: "demo_proj_story_001",
  proj3Id: "demo_proj_science_001",
  // Runs
  run1Id:  "demo_run_001",
  run2Id:  "demo_run_002",
  run3Id:  "demo_run_003",
};

const DEMO_EMAIL    = "demo@agentfactoryjr.com";
const DEMO_PASSWORD = "Demo1234!";
const DEMO_PIN      = "1234";
const CHILD_USERNAME = "alex_demo";

// ── Helpers ──────────────────────────────────────────────────────────────────
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
  if (exists.rowCount && exists.rowCount > 0) return false; // already seeded
  const keys = Object.keys(cols);
  const vals = Object.values(cols);
  const placeholders = keys.map((_, i) => `$${i + 2}`).join(", ");
  await client.query(
    `INSERT INTO ${table} (${idCol}, ${keys.join(", ")}) VALUES ($1, ${placeholders})`,
    [idVal, ...vals]
  );
  return true;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect();
  try {
    console.log("🌱  Seeding demo account…\n");

    const now = new Date();
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const pinHash      = await bcrypt.hash(DEMO_PIN, 10);

    // ── 1. Better Auth user ─────────────────────────────────────────────────
    const userCreated = await upsertRow(client, '"user"', "id", DEMO.userId, {
      name: "Demo Parent",
      email: DEMO_EMAIL,
      '"emailVerified"': true,
      '"createdAt"': now,
      '"updatedAt"': now,
    });
    console.log(userCreated ? "  ✓ Better Auth user" : "  · Better Auth user (exists)");

    // ── 2. Better Auth account (credential) ────────────────────────────────
    const accountCreated = await upsertRow(client, '"account"', "id", DEMO.accountId, {
      '"accountId"': DEMO_EMAIL,
      '"providerId"': "credential",
      '"userId"': DEMO.userId,
      password: passwordHash,
      '"createdAt"': now,
      '"updatedAt"': now,
    });
    console.log(accountCreated ? "  ✓ Auth credential" : "  · Auth credential (exists)");

    // ── 3. Parent profile ───────────────────────────────────────────────────
    const parentProfileCreated = await upsertRow(client, "profiles", "id", DEMO.parentProfileId, {
      user_id: DEMO.userId,
      display_name: "Demo Parent",
      role: "parent",
      created_at: now,
      updated_at: now,
    });
    console.log(parentProfileCreated ? "  ✓ Parent profile" : "  · Parent profile (exists)");

    // ── 4. Parent usage limits ──────────────────────────────────────────────
    const parentUsageCreated = await upsertRow(client, "usage_limits", "id", DEMO.parentUsageLimitId, {
      user_id: DEMO.parentProfileId,
      daily_run_limit: 10,
      runs_used_today: 0,
      chat_turns_used_today: 0,
      paused: false,
      period_start: now,
      created_at: now,
      updated_at: now,
    });
    console.log(parentUsageCreated ? "  ✓ Parent usage limits" : "  · Parent usage limits (exists)");

    // ── 5. Child Better Auth-style user (child_ prefix, no real auth) ──────
    const childUserCreated = await upsertRow(client, '"user"', "id", DEMO.childUserId, {
      name: "Alex (Demo)",
      email: `child_${DEMO.childUserId}@demo.internal`,
      '"emailVerified"': false,
      '"createdAt"': now,
      '"updatedAt"': now,
    });
    console.log(childUserCreated ? "  ✓ Child user" : "  · Child user (exists)");

    // ── 6. Child profile ────────────────────────────────────────────────────
    const childProfileCreated = await upsertRow(client, "profiles", "id", DEMO.childProfileId, {
      user_id: DEMO.childUserId,
      display_name: "Alex",
      role: "student",
      link_code: "DEMO1234",
      created_at: now,
      updated_at: now,
    });
    console.log(childProfileCreated ? "  ✓ Child profile" : "  · Child profile (exists)");

    // ── 7. Child credentials (username + PIN) ───────────────────────────────
    const childCredCreated = await upsertRow(client, "child_credentials", "id", DEMO.childCredId, {
      profile_id: DEMO.childProfileId,
      parent_id: DEMO.parentProfileId,
      username: CHILD_USERNAME,
      pin_hash: pinHash,
      failed_attempts: 0,
      created_at: now,
      updated_at: now,
    });
    console.log(childCredCreated ? "  ✓ Child credentials" : "  · Child credentials (exists)");

    // ── 8. Parent-child link ────────────────────────────────────────────────
    const linkCreated = await upsertRow(client, "parent_child_links", "id", DEMO.childLinkId, {
      parent_id: DEMO.parentProfileId,
      student_id: DEMO.childProfileId,
      link_code: "DEMO1234",
      email_on_flag: false,
      require_approval: false,
      created_at: now,
    });
    console.log(linkCreated ? "  ✓ Parent-child link" : "  · Parent-child link (exists)");

    // ── 9. Child usage limits ───────────────────────────────────────────────
    const childUsageCreated = await upsertRow(client, "usage_limits", "id", DEMO.childUsageLimitId, {
      user_id: DEMO.childProfileId,
      daily_run_limit: 5,
      runs_used_today: 2,
      chat_turns_used_today: 0,
      paused: false,
      period_start: now,
      created_at: now,
      updated_at: now,
    });
    console.log(childUsageCreated ? "  ✓ Child usage limits" : "  · Child usage limits (exists)");

    // ── 10. Sample AI Workers (projects) ────────────────────────────────────
    const proj1Created = await upsertRow(client, "projects", "id", DEMO.proj1Id, {
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
    console.log(proj1Created ? "  ✓ Project: Multiplication Buddy" : "  · Project: Multiplication Buddy (exists)");

    const proj2Created = await upsertRow(client, "projects", "id", DEMO.proj2Id, {
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
    console.log(proj2Created ? "  ✓ Project: Story Helper" : "  · Project: Story Helper (exists)");

    const proj3Created = await upsertRow(client, "projects", "id", DEMO.proj3Id, {
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
    console.log(proj3Created ? "  ✓ Project: Science Explorer" : "  · Project: Science Explorer (exists)");

    // ── 11. Sample agent runs (so history isn't empty) ──────────────────────
    const run1Created = await upsertRow(client, "agent_runs", "id", DEMO.run1Id, {
      project_id: DEMO.proj1Id,
      student_id: DEMO.childProfileId,
      input: "What is 7 times 8?",
      output: "Great question! Here's a hint: 7×8 is the same as 7×4 doubled. What is 7×4? 🤔",
      provider: "mock",
      status: "completed",
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    });
    console.log(run1Created ? "  ✓ Sample run 1" : "  · Sample run 1 (exists)");

    const run2Created = await upsertRow(client, "agent_runs", "id", DEMO.run2Id, {
      project_id: DEMO.proj2Id,
      student_id: DEMO.childProfileId,
      input: "I want to write a story about a dragon who is afraid of fire.",
      output: "I love it — that's a brilliant twist! 🐉 Let's give your dragon a name first. What would you like to call them?",
      provider: "mock",
      status: "completed",
      created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
    });
    console.log(run2Created ? "  ✓ Sample run 2" : "  · Sample run 2 (exists)");

    const run3Created = await upsertRow(client, "agent_runs", "id", DEMO.run3Id, {
      project_id: DEMO.proj3Id,
      student_id: DEMO.childProfileId,
      input: "Why is the sky blue?",
      output: "The sky is blue because of something called scattering! Sunlight is made of all colours. When it hits our atmosphere, blue light bounces around the most — so that's what we see. 🌤️ Here's a fun one: why do sunsets look orange and red?",
      provider: "mock",
      status: "completed",
      created_at: new Date(now.getTime() - 30 * 60 * 1000), // 30 min ago
    });
    console.log(run3Created ? "  ✓ Sample run 3" : "  · Sample run 3 (exists)");

    console.log(`
✅  Demo seed complete!

┌─────────────────────────────────────────────┐
│  PARENT LOGIN (share this with reviewers)   │
│  URL:      /sign-in                         │
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
