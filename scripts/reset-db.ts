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

async function resetDb() {
  const client = await pool.connect();
  try {
    console.log("⚠️  Truncating all tables — structure is preserved, data is deleted.\n");

    // Discover all tables in the public schema and truncate them
    const { rows } = await client.query<{ tablename: string }>(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public';
    `);
    if (rows.length === 0) {
      console.log("No tables found — nothing to truncate.");
      return;
    }
    const tableList = rows.map((r) => `"${r.tablename}"`).join(", ");
    await client.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);

    console.log("✅ All tables cleared.\n");
    console.log("Run  npm run db:seed-demo  to recreate the demo account.");
  } finally {
    client.release();
    await pool.end();
  }
}

resetDb().catch(console.error);
