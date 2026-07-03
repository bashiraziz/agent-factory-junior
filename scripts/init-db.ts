import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("❌ DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("neon.tech") ? true : undefined,
});

async function initDb() {
  const client = await pool.connect();
  try {
    console.log("🗄️  Initializing database...\n");

    // Better Auth tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
        image TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "account" (
        id TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMPTZ,
        "refreshTokenExpiresAt" TIMESTAMPTZ,
        scope TEXT,
        password TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "verification" (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // App tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        link_code TEXT UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS classrooms (
        id TEXT PRIMARY KEY,
        teacher_id TEXT NOT NULL,
        name TEXT NOT NULL,
        join_code TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS classroom_members (
        id TEXT PRIMARY KEY,
        classroom_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS parent_child_links (
        id TEXT PRIMARY KEY,
        parent_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        link_code TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        classroom_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        dsl_json JSONB,
        blockly_json JSONB,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_runs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        input TEXT,
        output TEXT,
        provider TEXT NOT NULL DEFAULT 'mock',
        status TEXT NOT NULL DEFAULT 'completed',
        safety_flags JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS replays (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL UNIQUE,
        project_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        goal TEXT,
        knowledge_used JSONB,
        rules_applied JSONB,
        steps_followed JSONB,
        tools_used JSONB,
        approval_required JSONB,
        safety_flags JSONB,
        output TEXT,
        provider TEXT NOT NULL DEFAULT 'mock',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS classroom_seat_codes (
        id TEXT PRIMARY KEY,
        classroom_id TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        profile_id TEXT,
        session_token TEXT UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        joined_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS usage_limits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        daily_run_limit INTEGER NOT NULL DEFAULT 5,
        runs_used_today INTEGER NOT NULL DEFAULT 0,
        period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        flagged BOOLEAN NOT NULL DEFAULT FALSE,
        flag_reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS chat_messages_project_id_idx ON chat_messages(project_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS chat_messages_student_id_idx ON chat_messages(student_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS child_credentials (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL UNIQUE,
        parent_id TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        pin_hash TEXT NOT NULL,
        session_token TEXT UNIQUE,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    // Idempotent columns for existing installs
    await client.query(`
      ALTER TABLE child_credentials ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0;
    `);
    await client.query(`
      ALTER TABLE child_credentials ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
    `);

    // Rename reasoning_receipts → replays (only if old table exists and new one doesn't)
    await client.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reasoning_receipts')
        AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'replays') THEN
          ALTER TABLE reasoning_receipts RENAME TO replays;
        END IF;
      END $$;
    `);

    // Indexes on hot lookup paths (idempotent)
    await client.query(`CREATE INDEX IF NOT EXISTS projects_owner_id_idx ON projects(owner_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS classroom_members_classroom_id_idx ON classroom_members(classroom_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS agent_runs_project_id_idx ON agent_runs(project_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS agent_runs_student_id_idx ON agent_runs(student_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS classroom_seat_codes_session_token_idx ON classroom_seat_codes(session_token);`);
    await client.query(`CREATE INDEX IF NOT EXISTS child_credentials_session_token_idx ON child_credentials(session_token);`);
    await client.query(`CREATE INDEX IF NOT EXISTS parent_child_links_parent_id_idx ON parent_child_links(parent_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS parent_child_links_student_id_idx ON parent_child_links(student_id);`);

    // Chat turn counter — separate integer avoids the fractional-increment rounding bug
    await client.query(`
      ALTER TABLE usage_limits ADD COLUMN IF NOT EXISTS chat_turns_used_today INTEGER NOT NULL DEFAULT 0;
    `);

    // Foreign key constraints — wrapped in DO blocks because Postgres lacks IF NOT EXISTS for constraints
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE projects ADD CONSTRAINT projects_owner_id_fkey
          FOREIGN KEY (owner_id) REFERENCES profiles(id);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE agent_runs ADD CONSTRAINT agent_runs_project_id_fkey
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE replays ADD CONSTRAINT replays_run_id_fkey
          FOREIGN KEY (run_id) REFERENCES agent_runs(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE classroom_members ADD CONSTRAINT classroom_members_classroom_id_fkey
          FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_project_id_fkey
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE child_credentials ADD CONSTRAINT child_credentials_profile_id_fkey
          FOREIGN KEY (profile_id) REFERENCES profiles(id);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE classroom_seat_codes ADD CONSTRAINT classroom_seat_codes_classroom_id_fkey
          FOREIGN KEY (classroom_id) REFERENCES classrooms(id);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS provider_keys (
        id TEXT PRIMARY KEY,
        owner_profile_id TEXT NOT NULL UNIQUE REFERENCES profiles(id),
        provider TEXT NOT NULL DEFAULT 'gemini',
        encrypted_key TEXT NOT NULL,
        key_tail TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        last_validated_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Parent control columns (idempotent)
    await client.query(`
      ALTER TABLE usage_limits ADD COLUMN IF NOT EXISTS paused BOOLEAN NOT NULL DEFAULT FALSE;
    `);
    await client.query(`
      ALTER TABLE parent_child_links ADD COLUMN IF NOT EXISTS email_on_flag BOOLEAN NOT NULL DEFAULT FALSE;
    `);
    await client.query(`
      ALTER TABLE parent_child_links ADD COLUMN IF NOT EXISTS require_approval BOOLEAN NOT NULL DEFAULT FALSE;
    `);
    await client.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS parent_approved_at TIMESTAMPTZ;
    `);

    console.log("✅ All tables created successfully!\n");
    console.log("Next step: Set DATABASE_URL in .env.local and run: npm run db:migrate");
  } finally {
    client.release();
    await pool.end();
  }
}

initDb().catch(console.error);
